'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getScreenConfig, updateScreenStatus } from '../app/actions/player';
import styles from './player.module.css';
import ClientOnlyCompositionRenderer from './ClientOnlyCompositionRenderer';
import CountdownRenderer from './CountdownRenderer';
import { ensureAbsoluteUrl } from '@/lib/url-utils';

type PlayerProps = {
    screenId: string;
};

type Content = {
    id: string;
    type: string;
    url: string | null;
    body: string | null;
    data: any; // Accommodate JSON
    duration: number;
    name: string;
};

type PlaylistEntry = {
    id: string;
    content: Content;
    duration: number | null;
};

type ScreenConfig = {
    id: string;
    name: string;
    status: string;
    timecodeId?: string | null;
    matrixRow: number | null;
    matrixCol: number | null;
    totalRows?: number;
    totalCols?: number;
    playlist: {
        entries: PlaylistEntry[];
    } | null;
};

type TimecodeStatus = {
    id: string;
    name: string;
    startedAt: string;
    speed: number;
    isRunning: boolean;
    elapsedMs: number;
};

export default function PlayerEngine({ screenId }: PlayerProps) {
    const [config, setConfig] = useState<ScreenConfig | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [timecodeStatus, setTimecodeStatus] = useState<TimecodeStatus | null>(null);
    const timecodeIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Heartbeat & Config Refresh Interval
    const fetchConfig = useCallback(async () => {
        const data = await getScreenConfig(screenId);
        if (data) {
            // @ts-ignore - Prisma types slightly mismatch with raw fetch, but structural fit is ok
            setConfig(data);
            await updateScreenStatus(screenId, 'ONLINE');
        } else {
            setIsLoading(false);
        }
    }, [screenId]);

    useEffect(() => {
        fetchConfig();
        const interval = setInterval(fetchConfig, 30000); // 30s heartbeat/refresh
        return () => clearInterval(interval);
    }, [fetchConfig]);

    // SSE: listen for server-sent events for immediate updates
    useEffect(() => {
        let es: EventSource | null = null;
        try {
            es = new EventSource(`/api/stream?screenId=${encodeURIComponent(screenId)}`);
        } catch (e) {
            console.error('PlayerEngine failed to create EventSource', e);
            return;
        }

        es.onmessage = async (ev) => {
            try {
                // If the event data starts with {, it's likely JSON.
                // The current server sends `data: { ... }` or generic messages.
                // We blindly parse.
                const data = JSON.parse(ev.data);

                if (data.type === 'timecode:started') {
                    // Update local status immediately
                    setTimecodeStatus(prev => ({
                        ...prev!,
                        id: data.timecodeId,
                        startedAt: data.startedAt,
                        isRunning: true,
                        elapsedMs: 0 // Will be recalculated by local loop
                    }));
                } else if (data.type === 'timecode:stopped') {
                    setTimecodeStatus(prev => ({
                        ...prev!,
                        isRunning: false
                    }));
                } else if (data.type === 'timecode:assigned') {
                    // Re-fetch config to get full timecode details
                    await fetchConfig();
                } else if (data.type === 'timecode:updated') {
                    // Update speed or name
                    setTimecodeStatus(prev => ({
                        ...prev!,
                        speed: data.speed ?? prev?.speed ?? 1.0,
                        name: data.name ?? prev?.name
                    }));
                } else if (data.type === 'playlist:updated' || data.type === 'screen:updated') {
                    // Playlist content changed or screen updated, refetch all
                    await fetchConfig();
                    setCurrentIndex(0);
                } else {
                    // Default / Config update
                    await fetchConfig();
                    setCurrentIndex(0);
                }
            }
            catch (e) {
                // Fallback for non-JSON messages (like the initial connection message)
                // or just log error
                // console.debug('Non-JSON SSE message or parse error:', ev.data);
            }
        };

        es.onerror = (err) => {
            console.warn('PlayerEngine EventSource error', err);
        };

        return () => {
            if (es) {
                es.close();
            }
        };
    }, [screenId, fetchConfig]);

    // Local Sync Loop: Calculate current index based on timecode
    // Replaces the network poll for driving the UI
    useEffect(() => {
        if (!config?.timecodeId || !timecodeStatus?.isRunning) return;

        const syncLoop = () => {
            if (!config.playlist?.entries) return;

            const now = new Date();
            const startTime = new Date(timecodeStatus.startedAt);
            const elapsedRaw = now.getTime() - startTime.getTime();
            const elapsed = elapsedRaw * timecodeStatus.speed;

            // Logic to find index
            const entries = config.playlist.entries;
            let accumulatedTime = 0;
            let targetIndex = 0;

            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i];
                const duration = (entry.duration || entry.content.duration || 10) * 1000;
                if (accumulatedTime + duration > elapsed) {
                    targetIndex = i;
                    break;
                }
                accumulatedTime += duration;
            }

            // Only update if changed prevents thrashing
            setCurrentIndex(prev => prev !== targetIndex ? targetIndex : prev);
        };

        // Run frequently (e.g. 100ms) for responsiveness, but purely local
        const interval = setInterval(syncLoop, 100);
        return () => clearInterval(interval);
    }, [config, timecodeStatus]);

    // Drift Check: Poll timecode status occasionally (e.g. 10s) instead of 100ms
    useEffect(() => {
        if (!config?.timecodeId) {
            if (timecodeIntervalRef.current) {
                clearInterval(timecodeIntervalRef.current);
                timecodeIntervalRef.current = null;
            }
            return;
        }

        const fetchTimecode = async () => {
            try {
                const res = await fetch(`/api/timecode?timecodeId=${encodeURIComponent(config.timecodeId!)}`);
                if (res.ok) {
                    const status = await res.json();
                    setTimecodeStatus(status);
                }
            } catch (error) {
                console.error('Error fetching timecode:', error);
            }
        };

        fetchTimecode();
        // 10 seconds sync
        timecodeIntervalRef.current = setInterval(fetchTimecode, 10000);

        return () => {
            if (timecodeIntervalRef.current) {
                clearInterval(timecodeIntervalRef.current);
                timecodeIntervalRef.current = null;
            }
        };
    }, [config?.timecodeId]);

    // Content Cycling Logic
    useEffect(() => {
        if (!config || !config.playlist || config.playlist.entries.length === 0) {
            setIsLoading(false);
            return;
        }

        setIsLoading(false);
        const entries = config.playlist.entries;
        const currentEntry = entries[currentIndex];

        // Determine duration: Entry override > Content default > 10s fallback
        const duration = (currentEntry.duration || currentEntry.content.duration || 10) * 1000;

        const timer = setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % entries.length);
        }, duration);

        return () => clearTimeout(timer);
    }, [config, currentIndex]);

    if (isLoading) {
        return <div className={styles.loading}>Loading Player...</div>;
    }

    if (!config) {
        return <div className={styles.error}>Screen Not Found</div>;
    }

    if (!config.playlist || config.playlist.entries.length === 0) {
        return (
            <div className={styles.idle}>
                <h1>{config.name}</h1>
                <p>No Content Assigned</p>
            </div>
        );
    }

    const currentEntry = config.playlist.entries[currentIndex];
    const content = currentEntry.content;

    return (
        <div className={styles.playerContainer}>
            {content.type === 'IMAGE' && content.url && (
                <img
                    src={ensureAbsoluteUrl(content.url) || ''}
                    alt={content.name}
                    className={styles.media}
                />
            )}

            {content.type === 'VIDEO' && content.url && (
                <video
                    src={ensureAbsoluteUrl(content.url) || ''}
                    autoPlay
                    muted
                    loop
                    className={styles.media}
                />
            )}

            {content.type === 'WEBSITE' && content.url && (
                <iframe
                    src={ensureAbsoluteUrl(content.url) || ''}
                    className={styles.media}
                    sandbox="allow-scripts allow-same-origin"
                />
            )}

            {content.type === 'MENU_HTML' && content.body && (
                <div
                    className={styles.htmlContent}
                    dangerouslySetInnerHTML={{ __html: content.body }}
                />
            )}

            {content.type === 'COMPOSITION' && content.data && (
                <ClientOnlyCompositionRenderer
                    data={content.data as string}
                    matrixRow={config.matrixRow ?? undefined}
                    matrixCol={config.matrixCol ?? undefined}
                    totalRows={config.totalRows ?? 1}
                    totalCols={config.totalCols ?? 1}
                />
            )}

            {content.type === 'COUNTDOWN' && content.data && (
                <CountdownRenderer data={content.data as string} />
            )}
        </div>
    );
}

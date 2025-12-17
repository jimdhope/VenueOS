'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getScreenConfig, updateScreenStatus } from '../app/actions/player';
import styles from './player.module.css';
import CompositionRenderer from './CompositionRenderer';

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
                // Re-fetch the latest config when an event arrives
                await fetchConfig();
                // Reset playback index to start of new playlist
                setCurrentIndex(0);
            }
            catch (e) {
                console.error('PlayerEngine onmessage error', e);
            }
        };

        es.onerror = (err) => {
            // EventSource will attempt to reconnect; log for debugging
            console.warn('PlayerEngine EventSource error', err);
        };

        return () => {
            if (es) {
                es.close();
            }
        };
    }, [screenId, fetchConfig]);

    // Content Cycling Logic — or Timecode Sync if timecode is active
    useEffect(() => {
        if (!config || !config.playlist || config.playlist.entries.length === 0) {
            setIsLoading(false);
            return;
        }

        setIsLoading(false);
        const entries = config.playlist.entries;

        // If timecode is assigned and active, sync to timecode
        if (config.timecodeId && timecodeStatus) {
            // Calculate which entry we should be on based on elapsed time
            let accumulatedTime = 0;
            let targetIndex = 0;

            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i];
                const duration = (entry.duration || entry.content.duration || 10) * 1000;
                if (accumulatedTime + duration > timecodeStatus.elapsedMs) {
                    targetIndex = i;
                    break;
                }
                accumulatedTime += duration;
            }

            setCurrentIndex(targetIndex);
            return; // Don't set a timeout; wait for next timecode poll
        }

        // Otherwise use local timer
        const currentEntry = entries[currentIndex];
        const duration = (currentEntry.duration || currentEntry.content.duration || 10) * 1000;

        const timer = setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % entries.length);
        }, duration);

        return () => clearTimeout(timer);
    }, [config, currentIndex, timecodeStatus]);

    // Poll timecode status if screen has a timecode assigned
    useEffect(() => {
        if (!config?.timecodeId) {
            // Clear interval if no timecode
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
                } else {
                    console.warn('Failed to fetch timecode status:', res.status);
                }
            } catch (error) {
                console.error('Error fetching timecode:', error);
            }
        };

        // Poll timecode every 100ms for tight sync (adjust if needed for performance)
        fetchTimecode();
        timecodeIntervalRef.current = setInterval(fetchTimecode, 100);

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
                    src={content.url}
                    alt={content.name}
                    className={styles.media}
                />
            )}

            {content.type === 'VIDEO' && content.url && (
                <video
                    src={content.url}
                    autoPlay
                    muted
                    loop
                    className={styles.media}
                />
            )}

            {content.type === 'WEBSITE' && content.url && (
                <iframe
                    src={content.url}
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
                <CompositionRenderer 
                    data={content.data as string}
                    matrixRow={config.matrixRow ?? undefined}
                    matrixCol={config.matrixCol ?? undefined}
                    totalRows={config.totalRows ?? 1}
                    totalCols={config.totalCols ?? 1}
                />
            )}
        </div>
    );
}

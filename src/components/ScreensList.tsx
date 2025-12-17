'use client';

import { useState, useEffect, useMemo } from 'react';
import ScreenModal from '@/components/ScreenModal';
import LinkModal from '@/components/LinkModal';
import { deleteScreen } from '../app/actions/screens';
import { isScreenOnline, timeAgo } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import styles from './screens-list.module.css';

type ScreenWithDetails = {
    id: string;
    name: string;
    resolution: string | null;
    orientation: string;
    status: string;
    updatedAt: Date;
    spaceId: string;
    playlistId: string | null;
    matrixRow: number | null;
    matrixCol: number | null;
    timecodeId: string | null;
    space: {
        name: string;
        venue: { name: string };
    };
};

type Space = {
    id: string;
    name: string;
    venue: { name: string };
};

type Playlist = {
    id: string;
    name: string;
};

type Timecode = {
    id: string;
    name: string;
};

type Params = {
    initialScreens: ScreenWithDetails[];
    initialSpaces: Space[];
    playlists: Playlist[];
    timecodes: Timecode[];
};

export default function ScreensList({ initialScreens, initialSpaces, playlists, timecodes }: Params) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedScreen, setSelectedScreen] = useState<ScreenWithDetails | null>(null);
    const [linkModalScreen, setLinkModalScreen] = useState<ScreenWithDetails | null>(null);
    const [search, setSearch] = useState('');
    const [now, setNow] = useState(new Date());
    const router = useRouter();

    // Poll for updates every 10 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh();
            setNow(new Date());
        }, 10000);
        return () => clearInterval(interval);
    }, [router]);

    // Filter and Group Screens
    const groupedScreens = useMemo(() => {
        const filtered = initialScreens.filter(s =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.space.venue.name.toLowerCase().includes(search.toLowerCase()) ||
            s.space.name.toLowerCase().includes(search.toLowerCase())
        );

        const groups: Record<string, ScreenWithDetails[]> = {};

        filtered.forEach(screen => {
            const groupKey = `${screen.space.name} • ${screen.space.venue.name}`;
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(screen);
        });

        // Sort grouping keys alphabetically
        return Object.keys(groups).sort().reduce((acc, key) => {
            // Sort screens within venue by Space Name, then Screen Name
            acc[key] = groups[key].sort((a, b) => a.name.localeCompare(b.name));
            return acc;
        }, {} as Record<string, ScreenWithDetails[]>);

    }, [initialScreens, search]);

    const handleCreate = () => {
        setSelectedScreen(null);
        setIsModalOpen(true);
    };

    const handleEdit = (screen: ScreenWithDetails) => {
        setSelectedScreen(screen);
        setIsModalOpen(true);
    };

    const handleGetLink = (screen: ScreenWithDetails) => {
        setLinkModalScreen(screen);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this screen?')) {
            await deleteScreen(id);
        }
    };

    return (
        <>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Screens</h1>
                    <p className={styles.subtitle}>Manage digital display endpoints</p>
                </div>

                <div className={styles.controls}>
                    <input
                        type="text"
                        placeholder="Search screens, locations..."
                        className={styles.search}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button onClick={handleCreate} className="btn btn-primary">
                        + Add Screen
                    </button>
                </div>
            </div>

            <div className={styles.content}>
                {Object.keys(groupedScreens).length === 0 ? (
                    <div className={styles.empty}>
                        <p>{search ? 'No screens match your search.' : 'No screens found. Add one to get started.'}</p>
                    </div>
                ) : (
                    Object.entries(groupedScreens).map(([venueName, screens]) => (
                        <div key={venueName} className={styles.venueSection}>
                            <h2 className={styles.venueHeader}>{venueName}</h2>
                            <div className={styles.grid}>
                                {screens.map((screen) => {
                                    const isOnline = isScreenOnline(screen.updatedAt);
                                    const statusLabel = isOnline ? 'ONLINE' : 'OFFLINE';

                                    return (
                                        <div key={screen.id} className={styles.card}>
                                            <div className={styles.cardHeader}>
                                                <div className={styles.statusBadge} data-status={statusLabel}>
                                                    <div className={styles.statusDot} />
                                                    <span suppressHydrationWarning>{statusLabel} ({timeAgo(screen.updatedAt)})</span>
                                                </div>
                                                <div className={styles.actions}>
                                                    <button onClick={() => handleGetLink(screen)} className={styles.actionBtn}>
                                                        Link
                                                    </button>
                                                    <button onClick={() => handleEdit(screen)} className={styles.actionBtn}>
                                                        Edit
                                                    </button>
                                                    <button onClick={() => handleDelete(screen.id)} className={`${styles.actionBtn} ${styles.danger}`}>
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>

                                            <h3 className={styles.screenName}>{screen.name}</h3>

                                            <div className={styles.meta}>
                                                <div className={styles.metaItem}>
                                                    <span className={styles.label}>Resolution</span>
                                                    <span className={styles.value}>{screen.resolution || 'N/A'}</span>
                                                </div>
                                                <div className={styles.metaItem}>
                                                    <span className={styles.label}>Orientation</span>
                                                    <span className={styles.value}>{screen.orientation}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <ScreenModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                screen={selectedScreen}
                spaces={initialSpaces}
                playlists={playlists}
                timecodes={timecodes}
            />

            {linkModalScreen && (
                <LinkModal
                    isOpen={!!linkModalScreen}
                    onClose={() => setLinkModalScreen(null)}
                    screenName={linkModalScreen.name}
                    url={`${window.location.origin}/play/${linkModalScreen.id}`}
                />
            )}
        </>
    );
}

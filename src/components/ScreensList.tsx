'use client';

import { useMemo } from 'react';
import { isScreenOnline, timeAgo } from '@/lib/utils';
import styles from './card-list.module.css';

type ScreenWithDetails = any; // Simplified for brevity
type ActiveSchedule = any;

type Params = {
    initialScreens: ScreenWithDetails[];
    activeSchedules?: Record<string, ActiveSchedule>;
    selectedIds: Set<string>;
    setSelectedIds: (ids: Set<string>) => void;
    search: string;
    onEdit: (screen: ScreenWithDetails) => void;
    onGetLink: (screen: ScreenWithDetails) => void;
    onSchedule: (screen: ScreenWithDetails) => void;
    onDelete: (id: string) => Promise<void>;
};

export default function ScreensList({
    initialScreens,
    activeSchedules = {},
    selectedIds,
    setSelectedIds,
    search,
    onEdit,
    onGetLink,
    onSchedule,
    onDelete,
}: Params) {

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

        return Object.keys(groups).sort().reduce((acc, key) => {
            acc[key] = groups[key].sort((a, b) => a.name.localeCompare(b.name));
            return acc;
        }, {} as Record<string, ScreenWithDetails[]>);

    }, [initialScreens, search]);

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    return (
        <>
            {Object.keys(groupedScreens).length === 0 ? (
                <div className={styles.empty}>
                    <p>{search ? 'No screens match your search.' : 'No screens found. Add one to get started.'}</p>
                </div>
            ) : (
                Object.entries(groupedScreens).map(([groupName, screens]) => (
                    <div key={groupName} className={styles.groupSection}>
                        <h2 className={styles.groupHeader}>{groupName}</h2>
                        <div className={styles.grid}>
                            {screens.map((screen) => {
                                const isOnline = isScreenOnline(screen.updatedAt);
                                const statusLabel = isOnline ? 'ONLINE' : 'OFFLINE';
                                const isSelected = selectedIds.has(screen.id);
                                const activeSchedule = activeSchedules[screen.id];

                                return (
                                    <div
                                        key={screen.id}
                                        className={styles.card}
                                        style={{
                                            opacity: isSelected ? 0.7 : 1,
                                            backgroundColor: isSelected ? 'var(--bg-tertiary)' : undefined,
                                            border: isSelected ? '2px solid var(--primary)' : undefined,
                                        }}
                                    >
                                        <div className={styles.cardHeader}>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelect(screen.id)}
                                                style={{ marginTop: '2px', cursor: 'pointer' }}
                                            />
                                            <div style={{ flex: 1, marginLeft: '1rem' }}>
                                                <h3 className={styles.cardTitle}>{screen.name}</h3>
                                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                    📍 {screen.space.name}
                                                </div>
                                            </div>
                                        </div>

                                        <div className={styles.cardContent}>
                                            <div style={{
                                                padding: '0.75rem 1rem',
                                                backgroundColor: activeSchedule
                                                    ? 'rgba(74, 222, 128, 0.1)'
                                                    : isOnline ? 'rgba(96, 165, 250, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                border: `1px solid ${activeSchedule
                                                    ? '#4ade80'
                                                    : isOnline ? '#60a5fa' : '#ef4444'}`,
                                                borderRadius: '6px',
                                            }}>
                                                {activeSchedule ? (
                                                    <div>
                                                        <div style={{ fontSize: '0.875rem', color: '#4ade80', fontWeight: '500' }}>
                                                            ▶ Now Playing
                                                        </div>
                                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                                                            {activeSchedule.name}
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                                            ({activeSchedule.playlistName})
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <div style={{
                                                            width: '8px',
                                                            height: '8px',
                                                            borderRadius: '50%',
                                                            backgroundColor: isOnline ? '#60a5fa' : '#ef4444'
                                                        }} />
                                                        <span style={{
                                                            fontSize: '0.875rem',
                                                            color: isOnline ? '#60a5fa' : '#ef4444',
                                                            fontWeight: '500'
                                                        }}>
                                                            {statusLabel} ({timeAgo(screen.updatedAt)})
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className={styles.actions}>
                                            <button onClick={() => onGetLink(screen)} className={styles.actionBtn}>Link</button>
                                            <button onClick={() => onSchedule(screen)} className={styles.actionBtn}>Schedule</button>
                                            <button onClick={() => onEdit(screen)} className={styles.actionBtn}>Edit</button>
                                            <button onClick={() => onDelete(screen.id)} className={`${styles.actionBtn} ${styles.danger}`}>Delete</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))
            )}
        </>
    );
}
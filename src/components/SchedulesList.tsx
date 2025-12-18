'use client';

import styles from './card-list.module.css';

type Schedule = {
    id: string;
    screenId: string;
    playlistId: string;
    priority: number;
    startDate: Date | null;
    endDate: Date | null;
    startTime: string | null;
    endTime: string | null;
    daysOfWeek: string | null;
    name: string | null;
    screen: {
        id: string;
        name: string;
        space: {
            name: string;
        };
    };
    playlist: {
        id: string;
        name: string;
    };
};

type Props = {
    initialSchedules: Schedule[];
    selectedIds: Set<string>;
    setSelectedIds: (ids: Set<string>) => void;
    onEdit: (schedule: Schedule) => void;
    onDelete: (id: string) => Promise<void>;
};

function formatDays(daysStr: string) {
    const map = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return daysStr.split(',').map(d => map[parseInt(d)]).join(', ');
}

export default function SchedulesList({ initialSchedules, selectedIds, setSelectedIds, onEdit, onDelete }: Props) {
    
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
            {initialSchedules.length === 0 ? (
                <div className={styles.empty}>
                    <p>No schedules configured. All screens will use their default playlists.</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {initialSchedules.map(schedule => {
                        const isSelected = selectedIds.has(schedule.id);
                        return (
                            <div
                                key={schedule.id}
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
                                        onChange={() => toggleSelect(schedule.id)}
                                        style={{ marginTop: '2px', cursor: 'pointer' }}
                                    />
                                    <div style={{ flex: 1, marginLeft: '1rem' }}>
                                        <h3 className={styles.cardTitle}>{schedule.name || 'Untitled'}</h3>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                            📍 {schedule.screen.space.name} → {schedule.screen.name}
                                        </div>
                                    </div>
                                    <span className={styles.priorityBadge}>P{schedule.priority}</span>
                                </div>
                                <div className={styles.cardContent}>
                                    <div className={styles.meta}>
                                        <div className={styles.metaItem}>
                                            <span className={styles.label}>Playlist:</span>
                                            <span className={styles.value}>{schedule.playlist.name}</span>
                                        </div>
                                        {(schedule.startTime || schedule.endTime) && (
                                            <div className={styles.metaItem}>
                                                <span className={styles.label}>Time:</span>
                                                <span className={styles.value}>{schedule.startTime || '00:00'} - {schedule.endTime || '23:59'}</span>
                                            </div>
                                        )}
                                        {(schedule.startDate || schedule.endDate) && (
                                            <div className={styles.metaItem}>
                                                <span className={styles.label}>Dates:</span>
                                                <span className={styles.value}>
                                                    {schedule.startDate ? new Date(schedule.startDate).toLocaleDateString() : 'Any'}
                                                    {' → '}
                                                    {schedule.endDate ? new Date(schedule.endDate).toLocaleDateString() : 'Any'}
                                                </span>
                                            </div>
                                        )}
                                        {schedule.daysOfWeek && (
                                            <div className={styles.metaItem}>
                                                <span className={styles.label}>Days:</span>
                                                <span className={styles.value}>{formatDays(schedule.daysOfWeek)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className={styles.actions}>
                                    <button onClick={() => onEdit(schedule)} className={styles.actionBtn}>Edit</button>
                                    <button onClick={() => onDelete(schedule.id)} className={`${styles.actionBtn} ${styles.danger}`}>Delete</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}

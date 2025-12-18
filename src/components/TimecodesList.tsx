'use client';

import styles from './card-list.module.css';

type Timecode = {
    id: string;
    name: string;
    isRunning: boolean;
    speed: number;
    screens: any[];
};

type TimecodesListProps = {
    timecodes: Timecode[];
    selectedIds: Set<string>;
    setSelectedIds: (ids: Set<string>) => void;
    onEdit: (timecode: Timecode) => void;
    onDelete: (id: string) => Promise<void>;
    onStart: (id: string) => Promise<void>;
    onStop: (id: string) => Promise<void>;
};

export default function TimecodesList({
    timecodes,
    selectedIds,
    setSelectedIds,
    onEdit,
    onDelete,
    onStart,
    onStop
}: TimecodesListProps) {
    
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
            {timecodes.length === 0 ? (
                <div className={styles.empty}>
                    <p>No timecodes found. Create one to synchronize screens.</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {timecodes.map((timecode) => {
                        const isSelected = selectedIds.has(timecode.id);
                        return (
                            <div
                                key={timecode.id}
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
                                        onChange={() => toggleSelect(timecode.id)}
                                        style={{ marginTop: '2px', cursor: 'pointer' }}
                                    />
                                    <div style={{ flex: 1, marginLeft: '1rem' }}>
                                        <h3 className={styles.cardTitle}>{timecode.name}</h3>
                                    </div>
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        backgroundColor: timecode.isRunning ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        color: timecode.isRunning ? 'var(--success)' : 'var(--danger)',
                                        fontSize: '0.8rem',
                                        fontWeight: 500
                                    }}>
                                        <span style={{
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            backgroundColor: 'currentColor'
                                        }} />
                                        {timecode.isRunning ? 'Running' : 'Stopped'}
                                    </span>
                                </div>
                                <div className={styles.cardContent}>
                                    <div className={styles.meta}>
                                        <div className={styles.metaItem}>
                                            <span className={styles.label}>Speed</span>
                                            <span className={styles.value}>{timecode.speed.toFixed(2)}x</span>
                                        </div>
                                        <div className={styles.metaItem}>
                                            <span className={styles.label}>Screens</span>
                                            <span className={styles.value}>{timecode.screens?.length || 0}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.actions}>
                                    {timecode.isRunning ? (
                                        <button onClick={() => onStop(timecode.id)} className={styles.actionBtn}>Stop</button>
                                    ) : (
                                        <button onClick={() => onStart(timecode.id)} className={styles.actionBtn}>Start</button>
                                    )}
                                    <button onClick={() => onEdit(timecode)} className={styles.actionBtn}>Edit</button>
                                    <button onClick={() => onDelete(timecode.id)} className={`${styles.actionBtn} ${styles.danger}`}>Delete</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}
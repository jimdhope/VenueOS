'use client';

import styles from './card-list.module.css';

type VenueWithCount = { id: string; name: string; _count?: { spaces: number } };

type VenuesListProps = {
    initialVenues: VenueWithCount[];
    selectedIds: Set<string>;
    setSelectedIds: (ids: Set<string>) => void;
    onEdit: (venue: VenueWithCount) => void;
    onDelete: (id: string) => Promise<void>;
};

export default function VenuesList({ initialVenues, selectedIds, setSelectedIds, onEdit, onDelete }: VenuesListProps) {
    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === initialVenues.length && initialVenues.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(initialVenues.map((v) => v.id)));
        }
    };

    return (
        <>
            {initialVenues.length === 0 ? (
                <div className={styles.empty}><p>No venues found.</p></div>
            ) : (
                <div className={styles.grid}>
                    {initialVenues.map((v) => {
                        const isSelected = selectedIds.has(v.id);
                        return (
                            <div
                                key={v.id}
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
                                        onChange={() => toggleSelect(v.id)}
                                        style={{ marginTop: '2px', cursor: 'pointer' }}
                                    />
                                    <div style={{ flex: 1, marginLeft: '1rem' }}>
                                        <h3 className={styles.cardTitle}>{v.name}</h3>
                                    </div>
                                </div>
                                <div className={styles.cardContent}>
                                    <span className={styles.screenCount}>{v._count?.spaces ?? 0} Space{(v._count?.spaces ?? 0) !== 1 ? 's' : ''}</span>
                                </div>
                                <div className={styles.actions}>
                                    <button onClick={() => onEdit(v)} className={styles.actionBtn}>Edit</button>
                                    <button onClick={() => onDelete(v.id)} className={`${styles.actionBtn} ${styles.danger}`}>Delete</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}

'use client';

import styles from './card-list.module.css';

type SpaceWithDetails = {
    id: string;
    name: string;
    venueId: string;
    venue: { name: string };
    screens: { id: string }[];
};

type SpacesListProps = {
    initialSpaces: SpaceWithDetails[];
    selectedIds: Set<string>;
    setSelectedIds: (ids: Set<string>) => void;
    onEdit: (space: SpaceWithDetails) => void;
    onDelete: (id: string) => Promise<void>;
};

export default function SpacesList({ initialSpaces, selectedIds, setSelectedIds, onEdit, onDelete }: SpacesListProps) {
    
    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const groupedSpaces = initialSpaces.reduce((acc, space) => {
        if (!acc[space.venue.name]) {
            acc[space.venue.name] = [];
        }
        acc[space.venue.name].push(space);
        return acc;
    }, {} as Record<string, SpaceWithDetails[]>);

    return (
        <>
            {initialSpaces.length === 0 ? (
                <div className={styles.empty}><p>No spaces found.</p></div>
            ) : (
                Object.entries(groupedSpaces).map(([groupName, spaces]) => (
                    <div key={groupName} className={styles.groupSection}>
                        <h2 className={styles.groupHeader}>{groupName}</h2>
                        <div className={styles.grid}>
                            {spaces.map((space) => {
                                const isSelected = selectedIds.has(space.id);
                                return (
                                    <div
                                        key={space.id}
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
                                                onChange={() => toggleSelect(space.id)}
                                                style={{ marginTop: '2px', cursor: 'pointer' }}
                                            />
                                            <div style={{ flex: 1, marginLeft: '1rem' }}>
                                                <h3 className={styles.cardTitle}>{space.name}</h3>
                                            </div>
                                        </div>
                                        <div className={styles.cardContent}>
                                            <span className={styles.screenCount}>
                                                {space.screens.length} Screen{space.screens.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className={styles.actions}>
                                            <button onClick={() => onEdit(space)} className={styles.actionBtn}>Edit</button>
                                            <button onClick={() => onDelete(space.id)} className={`${styles.actionBtn} ${styles.danger}`}>Delete</button>
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
'use client';

import Link from 'next/link';
import styles from './card-list.module.css';

type Playlist = {
    id: string;
    name: string;
    _count: {
        entries: number;
        screens: number;
    };
};

type PlaylistsListProps = {
    playlists: Playlist[];
    selectedIds: Set<string>;
    setSelectedIds: (ids: Set<string>) => void;
    onEdit: (playlist: Playlist) => void;
    onDelete: (id: string) => Promise<void>;
};

export default function PlaylistsList({ playlists, selectedIds, setSelectedIds, onEdit, onDelete }: PlaylistsListProps) {
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
            {playlists.length === 0 ? (
                <div className={styles.empty}><p>No playlists found.</p></div>
            ) : (
                <div className={styles.grid}>
                    {playlists.map((playlist) => {
                        const isSelected = selectedIds.has(playlist.id);
                        return (
                            <div
                                key={playlist.id}
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
                                        onChange={() => toggleSelect(playlist.id)}
                                        style={{ marginTop: '2px', cursor: 'pointer' }}
                                    />
                                    <div style={{ flex: 1, marginLeft: '1rem' }}>
                                        <Link href={`/admin/playlists/${playlist.id}`} style={{ textDecoration: 'none' }}>
                                            <h3 className={styles.cardTitle}>{playlist.name}</h3>
                                        </Link>
                                    </div>
                                </div>
                                <div className={styles.cardContent}>
                                    <div className={styles.meta}>
                                        <div className={styles.metaItem}>
                                            <span className={styles.label}>Items</span>
                                            <span className={styles.value}>{playlist._count.entries}</span>
                                        </div>
                                        <div className={styles.metaItem}>
                                            <span className={styles.label}>Screens</span>
                                            <span className={styles.value}>{playlist._count.screens}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.actions}>
                                    <button onClick={() => onEdit(playlist)} className={styles.actionBtn}>Edit</button>
                                    <button onClick={() => onDelete(playlist.id)} className={`${styles.actionBtn} ${styles.danger}`}>Delete</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}
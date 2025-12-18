'use client';

import { useRouter } from 'next/navigation';
import styles from './card-list.module.css';
import ClientOnlyCompositionPreview from './ClientOnlyCompositionPreview';

type Content = {
    id: string;
    name: string;
    type: string;
    url: string | null;
    body: string | null;
    data: string | null; // Add data field for composition JSON
    duration: number;
};

interface ContentListProps {
    initialContent: Content[];
    allowedTypes?: string[];
    selectedIds: Set<string>;
    setSelectedIds: (ids: Set<string>) => void;
    onEdit: (content: Content) => void;
    onDelete: (id: string) => Promise<void>;
}

export default function ContentList({
    initialContent,
    allowedTypes,
    selectedIds,
    setSelectedIds,
    onEdit,
    onDelete,
}: ContentListProps) {
    const router = useRouter();

    const filteredContent = allowedTypes
        ? initialContent.filter(c => allowedTypes.includes(c.type))
        : initialContent;

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
            {filteredContent.length === 0 ? (
                <div className={styles.empty}>
                    <p>No content found. Add items to get started.</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {filteredContent.map((item) => {
                        const isSelected = selectedIds.has(item.id);
                        return (
                            <div
                                key={item.id}
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
                                        onChange={() => toggleSelect(item.id)}
                                        style={{ marginTop: '2px', cursor: 'pointer' }}
                                    />
                                    <div style={{ flex: 1, marginLeft: '1rem' }}>
                                        <h3 className={styles.cardTitle}>{item.name}</h3>
                                    </div>
                                </div>
                                <div className={styles.cardContent}>
                                    <div className={styles.preview}>
                                        {item.type === 'IMAGE' && item.url && (
                                            <img src={item.url} alt={item.name} style={{width: '100%', height: '150px', objectFit: 'cover'}} />
                                        )}
                                        {item.type === 'VIDEO' && <div className={styles.placeholder}>VIDEO</div>}
                                        {item.type === 'WEBSITE' && <div className={styles.placeholder}>WEB</div>}
                                        {item.type === 'MENU_HTML' && <div className={styles.placeholder}>HTML</div>}
                                        {item.type === 'COMPOSITION' && item.data && <ClientOnlyCompositionPreview data={item.data} />}
                                        {item.type === 'COMPOSITION' && !item.data && <div className={styles.placeholder}>🎨</div>}

                                    </div>
                                    <div className={styles.details}>
                                        <span className={styles.duration}>{item.duration}s</span>
                                    </div>
                                </div>
                                <div className={styles.actions}>
                                    <button onClick={() => onEdit(item)} className={styles.actionBtn}>Edit</button>
                                    <button onClick={() => onDelete(item.id)} className={`${styles.actionBtn} ${styles.danger}`}>Delete</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ContentModal from '@/components/ContentModal';
import { deleteContent } from '../app/actions/content';
import styles from './content-list.module.css';

type Content = {
    id: string;
    name: string;
    type: string;
    url: string | null;
    body: string | null;
    duration: number;
};

interface ContentListProps {
    initialContent: Content[];
    allowedTypes?: string[]; // If provided, only shows these types and filters "Add" buttons
}

export default function ContentList({ initialContent, allowedTypes }: ContentListProps) {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedContent, setSelectedContent] = useState<Content | null>(null);

    // Filter content if allowedTypes is provided
    const filteredContent = allowedTypes
        ? initialContent.filter(c => allowedTypes.includes(c.type))
        : initialContent;

    // Determine which "Add" buttons to show
    const showCompositionBtn = !allowedTypes || allowedTypes.includes('COMPOSITION');
    const showAssetBtn = !allowedTypes || allowedTypes.some(t => ['IMAGE', 'VIDEO', 'WEBSITE', 'MENU_HTML'].includes(t));

    const handleCreate = () => {
        setSelectedContent(null);
        setIsModalOpen(true);
    };

    const handleCreateComposition = () => {
        router.push('/admin/content/editor/new');
    };

    const handleEdit = (content: Content) => {
        if (content.type === 'COMPOSITION') {
            router.push(`/admin/content/editor/${content.id}`);
            return;
        }
        setSelectedContent(content);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this content?')) {
            await deleteContent(id);
        }
    };

    return (
        <>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>
                        {allowedTypes?.includes('COMPOSITION') && allowedTypes.length === 1 ? 'Layouts' :
                            allowedTypes && !allowedTypes.includes('COMPOSITION') ? 'Media Library' :
                                'Content Library'}
                    </h1>
                    <p className={styles.subtitle}>
                        {allowedTypes?.includes('COMPOSITION') && allowedTypes.length === 1 ? 'Create and manage screen layouts' :
                            allowedTypes && !allowedTypes.includes('COMPOSITION') ? 'Upload and manage media assets' :
                                'Manage all content assets'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {showCompositionBtn && (
                        <button onClick={handleCreateComposition} className="btn btn-secondary">
                            + New Composition
                        </button>
                    )}
                    {showAssetBtn && (
                        <button onClick={handleCreate} className="btn btn-primary">
                            + Add Asset
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.grid}>
                {filteredContent.length === 0 ? (
                    <div className={styles.empty}>
                        <p>No content found. Add items to get started.</p>
                    </div>
                ) : (
                    filteredContent.map((item) => (
                        <div key={item.id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div className={styles.typeBadge}>{item.type}</div>
                                <div className={styles.actions}>
                                    <button onClick={() => handleEdit(item)} className={styles.actionBtn}>
                                        Edit
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className={`${styles.actionBtn} ${styles.danger}`}>
                                        Delete
                                    </button>
                                </div>
                            </div>

                            <div className={styles.preview}>
                                {item.type === 'IMAGE' && item.url && (
                                    <img src={item.url} alt={item.name} className={styles.imagePreview} />
                                )}
                                {item.type === 'VIDEO' && <div className={styles.placeholder}>VIDEO</div>}
                                {item.type === 'WEBSITE' && <div className={styles.placeholder}>WEB</div>}
                                {item.type === 'WEBSITE' && <div className={styles.placeholder}>WEB</div>}
                                {item.type === 'MENU_HTML' && <div className={styles.placeholder}>HTML</div>}
                                {item.type === 'COMPOSITION' && <div className={styles.placeholder}>🎨</div>}
                            </div>

                            <div className={styles.details}>
                                <h3 className={styles.itemName}>{item.name}</h3>
                                <span className={styles.duration}>{item.duration}s</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <ContentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                content={selectedContent}
            />
        </>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { getMediaAssets } from '../../app/actions/content';
import styles from './modal.module.css';

type MediaItem = {
    id: string;
    name: string;
    type: string;
    url: string | null;
};

type MediaPickerModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (item: MediaItem) => void;
    allowedTypes?: string[]; // 'IMAGE' | 'VIDEO'
};

export default function MediaPickerModal({ isOpen, onClose, onSelect, allowedTypes }: MediaPickerModalProps) {
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            getMediaAssets().then((data) => {
                let filtered = data;
                if (allowedTypes) {
                    filtered = data.filter(item => allowedTypes.includes(item.type));
                }
                setMedia(filtered as MediaItem[]);
                setLoading(false);
            });
        }
    }, [isOpen, allowedTypes]);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Select Media</h2>
                    <button className={styles.closeBtn} onClick={onClose}>&times;</button>
                </div>
                <div className={styles.content}>
                    {loading ? (
                        <p>Loading media...</p>
                    ) : media.length === 0 ? (
                        <p>No media found. Upload some assets in the Media Library first.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                            {media.map((item) => (
                                <div
                                    key={item.id}
                                    style={{
                                        border: '1px solid #333',
                                        borderRadius: '4px',
                                        padding: '5px',
                                        cursor: 'pointer',
                                        backgroundColor: '#1e1e1e'
                                    }}
                                    onClick={() => onSelect(item)}
                                >
                                    <div style={{ aspectRatio: '16/9', overflow: 'hidden', marginBottom: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                                        {item.type === 'IMAGE' && item.url ? (
                                            <img src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : item.type === 'VIDEO' ? (
                                            <span style={{ fontSize: '24px' }}>🎥</span>
                                        ) : (
                                            <span>?</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

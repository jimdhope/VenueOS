'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './modal.module.css';

type ContentType = 'IMAGE' | 'VIDEO' | 'WEBSITE' | 'MENU_HTML';

type Content = {
    id: string;
    name: string;
    type: string;
    url: string | null;
    body: string | null;
    duration: number;
};

type ContentModalProps = {
    isOpen: boolean;
    onClose: () => void;
    content?: Content | null;
};

function SubmitButton({ isEditing, isSubmitting }: { isEditing: boolean; isSubmitting: boolean }) {
    return (
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Content' : 'Create Content'}
        </button>
    );
}

export default function ContentModal({ isOpen, onClose, content }: ContentModalProps) {
    const isEditing = !!content;
    const [selectedType, setSelectedType] = useState<ContentType>('IMAGE');
    const [useUpload, setUseUpload] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            setSelectedType((content?.type as ContentType) || 'IMAGE');
            // If editing existing content with a URL, default to URL mode
            if (content && (content.type === 'IMAGE' || content.type === 'VIDEO') && content.url) {
                setUseUpload(false);
            } else {
                setUseUpload(true);
            }
        }
    }, [isOpen, content]);

    if (!isOpen) return null;

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const form = e.currentTarget as HTMLFormElement;
            const fd = new FormData(form);

            const name = String(fd.get('name') || '');
            const type = String(fd.get('type') || selectedType);
            const durationRaw = fd.get('duration');
            const duration = durationRaw === null || durationRaw === '' ? 10 : Number(durationRaw);
            const htmlBody = fd.get('body') ? String(fd.get('body')) : undefined;

            let finalUrl: string | undefined = undefined;
            // Handle file upload via chunked local upload
            const fileField = fd.get('file');
            if (useUpload && fileField && fileField instanceof File && fileField.size > 0) {
                const file = fileField as File;
                const chunkSize = 10 * 1024 * 1024; // 10 MB chunks — adjust as needed
                const totalChunks = Math.ceil(file.size / chunkSize);
                const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_/]/g, '_')}`;
                const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

                for (let i = 0; i < totalChunks; i++) {
                    const start = i * chunkSize;
                    const end = Math.min(start + chunkSize, file.size);
                    const chunk = file.slice(start, end);

                    const res = await fetch('/api/upload-chunk', {
                        method: 'POST',
                        headers: {
                            'x-upload-id': uploadId,
                            'x-chunk-index': String(i),
                            'x-chunk-total': String(totalChunks),
                            'x-filename': safeName,
                        },
                        body: chunk,
                    });

                    const rj = await res.json();
                    if (!res.ok) throw new Error(rj.error || 'Chunk upload failed');
                }

                finalUrl = `/uploads/${safeName}`;
            } else if (!useUpload) {
                const urlVal = fd.get('url');
                finalUrl = urlVal ? String(urlVal) : undefined;
            } else if (!useUpload && (selectedType === 'WEBSITE' || selectedType === 'MENU_HTML')) {
                // handled below by htmlBody or url
            }

            // Send metadata to server to create/update content record
            const payload: any = {
                id: fd.get('id') ? String(fd.get('id')) : undefined,
                name,
                type,
                url: finalUrl,
                body: htmlBody,
                duration,
            };

            const completeRes = await fetch('/api/complete-upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const completeJson = await completeRes.json();
            if (!completeRes.ok) throw new Error(completeJson.error || 'Failed to save content');

            // Refresh page data and close modal
            try { router.refresh(); } catch (_) {}
            onClose();
        } catch (err: any) {
            console.error('Upload/create error', err);
            alert(err?.message || 'Upload failed');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{isEditing ? 'Edit Content' : 'Add New Content'}</h2>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {isEditing && content?.id && (
                        <input type="hidden" name="id" value={content.id} />
                    )}

                    <div className={styles.formGroup}>
                        <label htmlFor="name">Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            defaultValue={content?.name}
                            required
                            className={styles.input}
                            placeholder="e.g. Lunch Menu 2024"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="type">Content Type</label>
                        <select
                            id="type"
                            name="type"
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value as ContentType)}
                            className={styles.select}
                        >
                            <option value="IMAGE">Image</option>
                            <option value="VIDEO">Video</option>
                            <option value="WEBSITE">Website</option>
                            <option value="MENU_HTML">Menu (HTML)</option>
                        </select>
                    </div>

                    {(selectedType === 'IMAGE' || selectedType === 'VIDEO') && (
                        <>
                            <div className={styles.formGroup}>
                                <label>Source</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        type="button"
                                        className={`btn ${useUpload ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setUseUpload(true)}
                                    >
                                        Upload file
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn ${!useUpload ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setUseUpload(false)}
                                    >
                                        Use URL
                                    </button>
                                </div>
                            </div>

                            {useUpload ? (
                                <div className={styles.formGroup}>
                                    <label htmlFor="file">File</label>
                                    <input
                                        type="file"
                                        id="file"
                                        name="file"
                                        accept={selectedType === 'IMAGE' ? 'image/*' : 'video/*'}
                                        className={styles.input}
                                    />
                                    <p className={styles.helperText}>
                                        {selectedType === 'IMAGE'
                                            ? 'Upload an image file (PNG, JPG, etc.).'
                                            : 'Upload a video file (MP4, etc.).'}
                                    </p>
                                </div>
                            ) : (
                                <div className={styles.formGroup}>
                                    <label htmlFor="url">URL</label>
                                    <input
                                        type="url"
                                        id="url"
                                        name="url"
                                        defaultValue={content?.url || ''}
                                        className={styles.input}
                                        placeholder={
                                            selectedType === 'IMAGE'
                                                ? 'https://example.com/image.jpg'
                                                : 'https://example.com/video.mp4'
                                        }
                                    />
                                </div>
                            )}
                        </>
                    )}

                    {selectedType === 'WEBSITE' && (
                        <div className={styles.formGroup}>
                            <label htmlFor="url">URL</label>
                            <input
                                type="url"
                                id="url"
                                name="url"
                                defaultValue={content?.url || ''}
                                required
                                className={styles.input}
                                placeholder="https://example.com"
                            />
                        </div>
                    )}

                    {selectedType === 'MENU_HTML' && (
                        <div className={styles.formGroup}>
                            <label htmlFor="body">HTML Content</label>
                            <textarea
                                id="body"
                                name="body"
                                defaultValue={content?.body || ''}
                                required
                                className={styles.textarea}
                                rows={8}
                                placeholder="<h1>Menu</h1><ul><li>Burger...</li></ul>"
                            />
                        </div>
                    )}

                    <div className={styles.formGroup}>
                        <label htmlFor="duration">Default Duration (seconds)</label>
                        <input
                            type="number"
                            id="duration"
                            name="duration"
                            defaultValue={content?.duration || 10}
                            min={1}
                            required
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.footer}>
                        <button type="button" onClick={onClose} className="btn">Cancel</button>
                        <SubmitButton isEditing={isEditing} isSubmitting={isSubmitting} />
                    </div>
                </form>
            </div>
        </div>
    );
}

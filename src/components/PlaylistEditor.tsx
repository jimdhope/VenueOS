'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updatePlaylist, addPlaylistEntry, removePlaylistEntry, updateEntryDuration } from '../app/actions/playlists';
import styles from './editor.module.css';

type Content = {
    id: string;
    name: string;
    type: string;
    duration: number;
    url: string | null;
};

type PlaylistEntry = {
    id: string;
    content: Content;
    order: number;
    duration: number | null;
};

type Playlist = {
    id: string;
    name: string;
    entries: PlaylistEntry[];
};

export default function PlaylistEditor({
    playlist,
    availableContent
}: {
    playlist: Playlist;
    availableContent: Content[];
}) {
    const router = useRouter();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingDurationId, setEditingDurationId] = useState<string | null>(null);

    const handleAddContent = async (contentId: string) => {
        await addPlaylistEntry(playlist.id, contentId);
        setIsAddModalOpen(false);
    };

    const handleRemove = async (entryId: string) => {
        if (confirm('Remove this item from playlist?')) {
            await removePlaylistEntry(entryId, playlist.id);
        }
    };

    const [name, setName] = useState(playlist.name);
    const [isEditingName, setIsEditingName] = useState(false);

    const handleRename = async (newName: string) => {
        if (newName && newName !== playlist.name) {
            await updatePlaylist(playlist.id, newName);
        }
        setIsEditingName(false);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.breadcrumbs}>
                    <button onClick={() => router.back()} className={styles.backLink}>← Back to Playlists</button>
                </div>
                <div className={styles.titleContainer} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isEditingName ? (
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={() => handleRename(name)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRename(name)}
                            onFocus={(e) => e.target.select()}
                            autoFocus
                            className={styles.titleInput}
                            style={{ fontSize: '2rem', background: 'transparent', border: 'none', borderBottom: '1px solid #555', color: '#fff' }}
                        />
                    ) : (
                        <h1 className={styles.title} onClick={() => setIsEditingName(true)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {name} <span style={{ fontSize: '1rem', opacity: 0.5 }}>✎</span>
                        </h1>
                    )}
                </div>
                <p className={styles.subtitle}>Manage sequence and timing</p>
            </header>

            <div className={styles.editorLayout}>
                {/* Main Playlist Sequence */}
                <div className={styles.sequence}>
                    <div className={styles.sequenceHeader}>
                        <h2>Sequence</h2>
                        <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary">
                            + Add Content
                        </button>
                    </div>

                    <div className={styles.entriesList}>
                        {playlist.entries.length === 0 ? (
                            <div className={styles.emptyState}>
                                Playlist is empty. Add content to start.
                            </div>
                        ) : (
                            playlist.entries.map((entry, index) => (
                                <div key={entry.id} className={styles.entryCard}>
                                    <div className={styles.entryOrder}>{index + 1}</div>
                                    <div className={styles.entryInfo}>
                                        <h4>{entry.content.name}</h4>
                                        <span className={styles.entryType}>{entry.content.type}</span>
                                    </div>

                                    <div className={styles.entryControls}>
                                        <div className={styles.durationControl}>
                                            <span className={styles.label}>Duration (s)</span>
                                            <input
                                                type="number"
                                                min={1}
                                                defaultValue={entry.duration || entry.content.duration}
                                                className={styles.durationInput}
                                                onBlur={(e) => updateEntryDuration(entry.id, playlist.id, parseInt(e.target.value))}
                                            />
                                        </div>

                                        <button
                                            onClick={() => handleRemove(entry.id)}
                                            className={styles.removeBtn}
                                            title="Remove"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

            {/* Add Content Modal */}
            {isAddModalOpen && (
                <div className={styles.overlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>Add Content</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className={styles.closeBtn}>&times;</button>
                        </div>
                        <div className={styles.contentGrid}>
                            {availableContent.map((content) => (
                                <button
                                    key={content.id}
                                    onClick={() => handleAddContent(content.id)}
                                    className={styles.contentSelectCard}
                                >
                                    <div className={styles.contentSelectName}>{content.name}</div>
                                    <div className={styles.contentSelectType}>{content.type}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

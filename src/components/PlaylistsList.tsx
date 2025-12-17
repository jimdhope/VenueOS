'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { createPlaylist, deletePlaylist } from '../app/actions/playlists';
import styles from './playlists-list.module.css';

type Playlist = {
    id: string;
    name: string;
    _count: {
        entries: number;
        screens: number;
    };
};

function CreateButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? 'Creating...' : '+ Create Playlist'}
        </button>
    );
}

export default function PlaylistsList({ playlists }: { playlists: Playlist[] }) {
    const [isCreating, setIsCreating] = useState(false);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigation
        if (confirm('Delete this playlist?')) {
            await deletePlaylist(id);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Playlists</h1>
                    <p className={styles.subtitle}>Create sequences of content for your screens</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="btn btn-primary"
                    style={{ display: isCreating ? 'none' : 'flex' }}
                >
                    + New Playlist
                </button>
            </div>

            {isCreating && (
                <div className={styles.createForm}>
                    <form
                        action={async (formData) => {
                            const res = await createPlaylist(null, formData);
                            if (res.success) setIsCreating(false);
                        }}
                        className={styles.inlineForm}
                    >
                        <input
                            type="text"
                            name="name"
                            placeholder="Playlist Name (e.g. Morning Menu)"
                            required
                            autoFocus
                            className={styles.input}
                        />
                        <CreateButton />
                        <button
                            type="button"
                            onClick={() => setIsCreating(false)}
                            className="btn"
                        >
                            Cancel
                        </button>
                    </form>
                </div>
            )}

            <div className={styles.grid}>
                {playlists.length === 0 && !isCreating ? (
                    <div className={styles.empty}>
                        <p>No playlists found.</p>
                    </div>
                ) : (
                    playlists.map((playlist) => (
                        <Link
                            key={playlist.id}
                            href={`/admin/playlists/${playlist.id}`}
                            className={styles.card}
                        >
                            <div className={styles.cardInfo}>
                                <h3 className={styles.cardTitle}>{playlist.name}</h3>
                                <div className={styles.meta}>
                                    <span>{playlist._count.entries} Items</span>
                                    <span>•</span>
                                    <span>{playlist._count.screens} Screens</span>
                                </div>
                            </div>
                            <button
                                onClick={(e) => handleDelete(playlist.id, e)}
                                className={styles.deleteBtn}
                            >
                                Delete
                            </button>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}

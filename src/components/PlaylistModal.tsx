'use client';

import { useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { createPlaylist, updatePlaylist } from '../app/actions/playlists';
import styles from './modal.module.css';

type Playlist = { id: string; name: string };

type PlaylistModalProps = {
    isOpen: boolean;
    onClose: () => void;
    playlist?: Playlist | null;
};

function SubmitButton({ isEditing }: { isEditing: boolean }) {
    const { pending } = useFormStatus();
    return (
        <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? 'Saving...' : isEditing ? 'Update Playlist' : 'Create Playlist'}
        </button>
    );
}

export default function PlaylistModal({ isOpen, onClose, playlist }: PlaylistModalProps) {
    const [state, setState] = useState<{ message?: string; errors?: any }>({});

    useEffect(() => { if (isOpen) setState({}); }, [isOpen]);
    if (!isOpen) return null;

    const isEditing = !!playlist;
    const action = isEditing ? updatePlaylist.bind(null, playlist!.id, playlist!.name) : createPlaylist;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{isEditing ? 'Edit Playlist' : 'Add New Playlist'}</h2>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>

                <form
                    action={async (formData) => {
                        const result = await action(state, formData);
                        if (result.success) onClose();
                        else setState(result);
                    }}
                    className={styles.form}
                >
                    <div className={styles.formGroup}>
                        <label htmlFor="name">Playlist Name</label>
                        <input type="text" id="name" name="name" defaultValue={playlist?.name} required className={styles.input} />
                        {state.errors?.name && <p className={styles.error}>{state.errors.name}</p>}
                    </div>

                    {state.message && <p className={styles.formMessage}>{state.message}</p>}

                    <div className={styles.footer}>
                        <button type="button" onClick={onClose} className="btn">Cancel</button>
                        <SubmitButton isEditing={isEditing} />
                    </div>
                </form>
            </div>
        </div>
    );
}

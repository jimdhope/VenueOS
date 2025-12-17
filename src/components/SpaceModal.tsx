'use client';

import { useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { createSpace, updateSpace } from '../app/actions/spaces';
import styles from './modal.module.css';

type Venue = {
    id: string;
    name: string;
};

type Space = {
    id: string;
    name: string;
    venueId: string;
};

type SpaceModalProps = {
    isOpen: boolean;
    onClose: () => void;
    space?: Space | null;
    venues: Venue[];
};

function SubmitButton({ isEditing }: { isEditing: boolean }) {
    const { pending } = useFormStatus();
    return (
        <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? 'Saving...' : isEditing ? 'Update Space' : 'Create Space'}
        </button>
    );
}

export default function SpaceModal({ isOpen, onClose, space, venues }: SpaceModalProps) {
    const [state, setState] = useState<{ message?: string; errors?: any }>({});

    useEffect(() => {
        if (isOpen) {
            setState({});
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const isEditing = !!space;
    const action = isEditing ? updateSpace.bind(null, space.id) : createSpace;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{isEditing ? 'Edit Space' : 'Add New Space'}</h2>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>

                <form
                    action={async (formData) => {
                        const result = await action(state, formData);
                        if (result.success) {
                            onClose();
                        } else {
                            setState(result);
                        }
                    }}
                    className={styles.form}
                >
                    <div className={styles.formGroup}>
                        <label htmlFor="name">Space Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            defaultValue={space?.name}
                            required
                            className={styles.input}
                        />
                        {state.errors?.name && <p className={styles.error}>{state.errors.name}</p>}
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="venueId">Venue</label>
                        <select
                            id="venueId"
                            name="venueId"
                            defaultValue={space?.venueId || (venues.length === 1 ? venues[0].id : '')}
                            required
                            className={styles.select}
                        >
                            <option value="" disabled>Select a Venue</option>
                            {venues.map((venue) => (
                                <option key={venue.id} value={venue.id}>
                                    {venue.name}
                                </option>
                            ))}
                        </select>
                        {state.errors?.venueId && <p className={styles.error}>{state.errors.venueId}</p>}
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

'use client';

import { useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { createVenue, updateVenue } from '../app/actions/venues';
import styles from './modal.module.css';

type Venue = { id: string; name: string };

type VenueModalProps = {
    isOpen: boolean;
    onClose: () => void;
    venue?: Venue | null;
};

function SubmitButton({ isEditing }: { isEditing: boolean }) {
    const { pending } = useFormStatus();
    return (
        <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? 'Saving...' : isEditing ? 'Update Venue' : 'Create Venue'}
        </button>
    );
}

export default function VenueModal({ isOpen, onClose, venue }: VenueModalProps) {
    const [state, setState] = useState<{ message?: string; errors?: any }>({});

    useEffect(() => { if (isOpen) setState({}); }, [isOpen]);
    if (!isOpen) return null;

    const isEditing = !!venue;
    const action = isEditing ? updateVenue.bind(null, venue!.id) : createVenue;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{isEditing ? 'Edit Venue' : 'Add New Venue'}</h2>
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
                        <label htmlFor="name">Venue Name</label>
                        <input type="text" id="name" name="name" defaultValue={venue?.name} required className={styles.input} />
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

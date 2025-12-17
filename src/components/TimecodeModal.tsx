'use client';

import { useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { createTimecode, updateTimecode } from '../app/actions/timecodes';
import styles from './modal.module.css';

type Timecode = {
    id: string;
    name: string;
    speed: number;
};

type TimecodeModalProps = {
    isOpen: boolean;
    onClose: () => void;
    timecode?: Timecode | null;
};

function SubmitButton({ isEditing }: { isEditing: boolean }) {
    const { pending } = useFormStatus();
    return (
        <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? 'Saving...' : isEditing ? 'Update Timecode' : 'Create Timecode'}
        </button>
    );
}

export default function TimecodeModal({ isOpen, onClose, timecode }: TimecodeModalProps) {
    const router = useRouter();
    const [state, setState] = useState<{ message?: string; errors?: any }>({});

    useEffect(() => {
        if (isOpen) {
            setState({});
        }
    }, [isOpen]);

    const isEditing = !!timecode;
    const action = isEditing ? updateTimecode.bind(null, timecode.id) : createTimecode;

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{isEditing ? 'Edit Timecode' : 'Add New Timecode'}</h2>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>

                <form
                    action={async (formData) => {
                        const result = await action(state, formData);
                        if (result.success) {
                            onClose();
                            router.refresh();
                        } else {
                            setState(result);
                        }
                    }}
                    className={styles.form}
                >
                    <div className={styles.formGroup}>
                        <label htmlFor="name">Timecode Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            defaultValue={timecode?.name}
                            required
                            className={styles.input}
                            placeholder="e.g., Main Display Matrix"
                        />
                        {state.errors?.name && <p className={styles.error}>{state.errors.name}</p>}
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="speed">Playback Speed Multiplier</label>
                        <input
                            type="number"
                            id="speed"
                            name="speed"
                            defaultValue={timecode?.speed ?? 1.0}
                            min="0.1"
                            max="10"
                            step="0.1"
                            required
                            className={styles.input}
                        />
                        <small>1.0 = normal speed, 2.0 = 2x speed, 0.5 = half speed</small>
                        {state.errors?.speed && <p className={styles.error}>{state.errors.speed}</p>}
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

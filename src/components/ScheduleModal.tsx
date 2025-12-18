'use client';

import { useState, useEffect } from 'react';
import { createSchedule, updateSchedule } from '../app/actions/schedules';
import { useToast } from './Toast';
import styles from './modal.module.css';

type Screen = {
    id: string;
    name: string;
    space: { name: string; };
};

type Playlist = {
    id: string;
    name: string;
};

type Schedule = {
    id: string;
    screenId: string;
    playlistId: string;
    priority: number;
    startDate: Date | null;
    endDate: Date | null;
    startTime: string | null;
    endTime: string | null;
    daysOfWeek: string | null;
    name: string | null;
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    screens: Screen[];
    playlists: Playlist[];
    schedule?: Schedule | null;
    preSelectedScreenId?: string | null;
    preSelectedScreenName?: string | null;
    screenName?: string | null;
};

export default function ScheduleModal({ isOpen, onClose, screens, playlists, schedule, preSelectedScreenId, screenName }: Props) {
    const [submitting, setSubmitting] = useState(false);
    const { addToast } = useToast();
    const isEditing = !!schedule;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);

        const formData = new FormData(e.currentTarget);

        const days = [];
        for (let i = 0; i <= 6; i++) {
            if (formData.get(`day_${i}`)) {
                days.push(i);
            }
        }
        if (days.length > 0) {
            formData.set('daysOfWeek', days.join(','));
        }

        const action = isEditing ? updateSchedule.bind(null, schedule.id) : createSchedule;
        
        const res = await action({}, formData);

        if (!res || (!res.success && res.message !== 'Schedule created.' && res.message !== 'Schedule updated.')) {
            addToast(res.message || 'Failed to save schedule', 'error', 4000);
            setSubmitting(false);
            return;
        }

        addToast(`Schedule ${isEditing ? 'updated' : 'created'} successfully!`, 'success', 3000);
        setSubmitting(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>{isEditing ? 'Edit Schedule' : 'Create Schedule'}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className={styles.closeBtn}
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.content}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label>Screens *</label>
                        <select
                            name="screenId"
                            required
                            className={styles.select}
                            defaultValue={schedule?.screenId ?? preSelectedScreenId ?? ''}
                            disabled={isEditing}
                        >
                            {screens.map(s => (
                                <option key={s.id} value={s.id}>{s.space.name} - {s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label htmlFor="modal-name" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Name (Optional)
                        </label>
                        <input
                            id="modal-name"
                            name="name"
                            placeholder="e.g. Morning Menu"
                            defaultValue={schedule?.name || ''}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label htmlFor="modal-priority" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Priority
                        </label>
                        <input
                            id="modal-priority"
                            name="priority"
                            type="number"
                            defaultValue={schedule?.priority || 0}
                            style={{
                                width: '80px',
                                padding: '0.5rem',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                            }}
                        />
                        <small style={{ display: 'block', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
                            Higher priority rules apply first
                        </small>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label htmlFor="modal-playlist" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Playlist <span style={{ color: 'var(--error)' }}>*</span>
                        </label>
                        <select
                            id="modal-playlist"
                            name="playlistId"
                            required
                            defaultValue={schedule?.playlistId}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                            }}
                        >
                            <option value="">Select a playlist</option>
                            {playlists.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <fieldset style={{ marginBottom: '1rem', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '4px' }}>
                        <legend style={{ padding: '0 0.5rem' }}>Time of Day</legend>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label htmlFor="modal-start-time" style={{ display: 'block', marginBottom: '0.5rem' }}>
                                    Start Time
                                </label>
                                <input
                                    id="modal-start-time"
                                    name="startTime"
                                    type="time"
                                    defaultValue={schedule?.startTime || ''}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '4px',
                                        backgroundColor: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)',
                                    }}
                                />
                                <small style={{ display: 'block', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
                                    Leave blank for all day
                                </small>
                            </div>
                            <div>
                                <label htmlFor="modal-end-time" style={{ display: 'block', marginBottom: '0.5rem' }}>
                                    End Time
                                </label>
                                <input
                                    id="modal-end-time"
                                    name="endTime"
                                    type="time"
                                    defaultValue={schedule?.endTime || ''}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '4px',
                                        backgroundColor: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)',
                                    }}
                                />
                            </div>
                        </div>
                    </fieldset>

                    <fieldset style={{ marginBottom: '1rem', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '4px' }}>
                        <legend style={{ padding: '0 0.5rem' }}>Date Range</legend>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label htmlFor="modal-start-date" style={{ display: 'block', marginBottom: '0.5rem' }}>
                                    Start Date
                                </label>
                                <input
                                    id="modal-start-date"
                                    name="startDate"
                                    type="date"
                                    defaultValue={schedule?.startDate ? new Date(schedule.startDate).toISOString().split('T')[0] : ''}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '4px',
                                        backgroundColor: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)',
                                    }}
                                />
                                <small style={{ display: 'block', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
                                    Leave blank for no start limit
                                </small>
                            </div>
                            <div>
                                <label htmlFor="modal-end-date" style={{ display: 'block', marginBottom: '0.5rem' }}>
                                    End Date
                                </label>
                                <input
                                    id="modal-end-date"
                                    name="endDate"
                                    type="date"
                                    defaultValue={schedule?.endDate ? new Date(schedule.endDate).toISOString().split('T')[0] : ''}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '4px',
                                        backgroundColor: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)',
                                    }}
                                />
                                <small style={{ display: 'block', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
                                    Leave blank for no end limit
                                </small>
                            </div>
                        </div>
                    </fieldset>

                    <fieldset style={{ marginBottom: '1rem', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '4px' }}>
                        <legend style={{ padding: '0 0.5rem' }}>Days of Week</legend>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d, i) => (
                                <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="checkbox" name={`day_${i}`} defaultChecked={schedule?.daysOfWeek?.includes(String(i))} />
                                    <span>{d}</span>
                                </label>
                            ))}
                        </div>
                        <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                            Leave blank to apply every day
                        </small>
                    </fieldset>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} className="btn">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting} className="btn btn-primary">
                            {submitting ? 'Saving...' : isEditing ? 'Update Schedule' : 'Create Schedule'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

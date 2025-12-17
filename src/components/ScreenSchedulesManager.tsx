'use client';

import { useState } from 'react';
import { createSchedule, deleteSchedule } from '../app/actions/schedules';
import styles from './screen-schedules.module.css';

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
    playlist: {
        id: string;
        name: string;
    };
};

type Playlist = {
    id: string;
    name: string;
};

type Props = {
    screenId: string;
    schedules: Schedule[];
    playlists: Playlist[];
};

export default function ScreenSchedulesManager({ screenId, schedules, playlists }: Props) {
    const [isAdding, setIsAdding] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this schedule?')) return;
        await deleteSchedule(id, screenId);
    };

    const handleSubmit = async (formData: FormData) => {
        setSubmitting(true);
        // Force screenId
        formData.append('screenId', screenId);

        // Handle days of week
        const days = [];
        for (let i = 0; i <= 6; i++) {
            if (formData.get(`day_${i}`)) {
                days.push(i);
            }
        }
        if (days.length > 0) {
            formData.append('daysOfWeek', days.join(','));
        }

        const res = await createSchedule({}, formData);
        setSubmitting(false);
        if (res.success || res.message === 'Schedule created.') {
            setIsAdding(false);
        } else {
            alert(res.message || 'Failed to create schedule');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>Active Schedules</h3>
                {!isAdding && (
                    <button onClick={() => setIsAdding(true)} className="btn btn-sm btn-primary">
                        + Add Rule
                    </button>
                )}
            </div>

            {isAdding && (
                <form action={handleSubmit} className={styles.formCard}>
                    <div className={styles.formRow}>
                        <div className={styles.field}>
                            <label>Name (Optional)</label>
                            <input name="name" placeholder="e.g. Morning Menu" className={styles.input} />
                        </div>
                        <div className={styles.field}>
                            <label>Priority</label>
                            <input name="priority" type="number" defaultValue="0" className={styles.input} style={{ width: 80 }} />
                            <small>Higher wins</small>
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.field}>
                            <label>Playlist</label>
                            <select name="playlistId" required className={styles.select}>
                                {playlists.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.field}>
                            <label>Start Time</label>
                            <input name="startTime" type="time" className={styles.input} />
                        </div>
                        <div className={styles.field}>
                            <label>End Time</label>
                            <input name="endTime" type="time" className={styles.input} />
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.field}>
                            <label>Start Date</label>
                            <input name="startDate" type="date" className={styles.input} />
                        </div>
                        <div className={styles.field}>
                            <label>End Date</label>
                            <input name="endDate" type="date" className={styles.input} />
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label>Days of Week</label>
                        <div className={styles.daysGrid}>
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                                <label key={i} className={styles.dayCheck}>
                                    <input type="checkbox" name={`day_${i}`} />
                                    <span>{d}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className={styles.formActions}>
                        <button type="button" onClick={() => setIsAdding(false)} className="btn btn-sm">Cancel</button>
                        <button type="submit" disabled={submitting} className="btn btn-sm btn-primary">
                            {submitting ? 'Saving...' : 'Save Rule'}
                        </button>
                    </div>
                </form>
            )}

            <div className={styles.list}>
                {schedules.length === 0 && !isAdding && (
                    <p className={styles.empty}>No scheduling rules. Screen uses default playlist.</p>
                )}
                {schedules.map(schedule => (
                    <div key={schedule.id} className={styles.card}>
                        <div className={styles.cardMain}>
                            <div className={styles.cardTitle}>
                                <strong>{schedule.name || 'Untitled Rule'}</strong>
                                <span className={styles.priorityBadge}>Priority {schedule.priority}</span>
                            </div>
                            <div className={styles.cardDetail}>
                                Playlist: <strong>{schedule.playlist.name}</strong>
                            </div>
                            <div className={styles.cardMeta}>
                                {schedule.daysOfWeek ? (
                                    <span>Days: {formatDays(schedule.daysOfWeek)}</span>
                                ) : <span>Every Day</span>}
                                {schedule.startTime ? (
                                    <span> • {schedule.startTime} - {schedule.endTime || 'End of Day'}</span>
                                ) : <span> • All Day</span>}
                                {schedule.startDate && (
                                    <span> • {channelDate(schedule.startDate)} - {channelDate(schedule.endDate)}</span>
                                )}
                            </div>
                        </div>
                        <button onClick={() => handleDelete(schedule.id)} className={styles.deleteBtn}>&times;</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function formatDays(daysStr: string) {
    const map = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return daysStr.split(',').map(d => map[parseInt(d)]).join(', ');
}

function channelDate(d: Date | null) {
    if (!d) return '...';
    return new Date(d).toLocaleDateString();
}

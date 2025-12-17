'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteTimecode, startTimecode, stopTimecode } from '../app/actions/timecodes';
import TimecodeModal from './TimecodeModal';
import styles from './timecodes-list.module.css';

type Timecode = {
    id: string;
    name: string;
    isRunning: boolean;
    speed: number;
    screens: any[];
};

type TimecodesListProps = {
    timecodes: Timecode[];
};

export default function TimecodesList({ timecodes }: TimecodesListProps) {
    const router = useRouter();
    const [selectedTimecode, setSelectedTimecode] = useState<Timecode | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        await deleteTimecode(id);
        router.refresh();
    };

    const handleStart = async (id: string) => {
        await startTimecode(id);
        router.refresh();
    };

    const handleStop = async (id: string) => {
        await stopTimecode(id);
        router.refresh();
    };

    const handleEdit = (timecode: Timecode) => {
        setSelectedTimecode(timecode);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setSelectedTimecode(null);
        setIsModalOpen(true);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Timecodes</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage synchronization signals for coordinated playback</p>
                </div>
                <button onClick={handleAddNew} className="btn btn-primary">
                    + Add Timecode
                </button>
            </div>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th style={{ width: '30%' }}>Name</th>
                        <th>Speed</th>
                        <th>Status</th>
                        <th>Assigned Screens</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {timecodes.length === 0 && (
                        <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                No timecodes found. Create one to synchronize screens.
                            </td>
                        </tr>
                    )}
                    {timecodes.map((timecode) => (
                        <tr key={timecode.id}>
                            <td style={{ fontWeight: 500 }}>{timecode.name}</td>
                            <td>{timecode.speed.toFixed(2)}x</td>
                            <td>
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    backgroundColor: timecode.isRunning ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    color: timecode.isRunning ? 'var(--success)' : 'var(--danger)',
                                    fontSize: '0.8rem',
                                    fontWeight: 500
                                }}>
                                    <span style={{
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        backgroundColor: 'currentColor'
                                    }} />
                                    {timecode.isRunning ? 'Running' : 'Stopped'}
                                </span>
                            </td>
                            <td style={{ color: 'var(--text-secondary)' }}>{timecode.screens?.length || 0} screens</td>
                            <td className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                                {timecode.isRunning ? (
                                    <button onClick={() => handleStop(timecode.id)} className="btn btn-sm">Stop</button>
                                ) : (
                                    <button onClick={() => handleStart(timecode.id)} className="btn btn-sm">Start</button>
                                )}
                                <button onClick={() => handleEdit(timecode)} className="btn btn-sm">Edit</button>
                                <button onClick={() => handleDelete(timecode.id)} className="btn btn-sm btn-danger">Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <TimecodeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                timecode={selectedTimecode}
            />
        </div>
    );
}

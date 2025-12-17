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
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2>Timecodes</h2>
                <button onClick={handleAddNew} className="btn btn-primary">Add Timecode</button>
            </div>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Speed</th>
                        <th>Status</th>
                        <th>Assigned Screens</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {timecodes.map((timecode) => (
                        <tr key={timecode.id}>
                            <td>{timecode.name}</td>
                            <td>{timecode.speed.toFixed(2)}x</td>
                            <td>{timecode.isRunning ? '🟢 Running' : '⏸ Stopped'}</td>
                            <td>{timecode.screens?.length || 0} screens</td>
                            <td className={styles.actions}>
                                {timecode.isRunning ? (
                                    <button onClick={() => handleStop(timecode.id)} className="btn btn-small">Stop</button>
                                ) : (
                                    <button onClick={() => handleStart(timecode.id)} className="btn btn-small">Start</button>
                                )}
                                <button onClick={() => handleEdit(timecode)} className="btn btn-small">Edit</button>
                                <button onClick={() => handleDelete(timecode.id)} className="btn btn-small btn-danger">Delete</button>
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

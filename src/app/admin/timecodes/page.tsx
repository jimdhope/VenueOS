'use client';

import { useState, useEffect } from 'react';
import { getTimecodes, deleteTimecode, startTimecode, stopTimecode } from '@/app/actions/timecodes';
import TimecodesList from '@/components/TimecodesList';
import AdminPageLayout from '@/components/AdminPageLayout';
import TimecodeModal from '@/components/TimecodeModal';

type Timecode = any;

export default function TimecodesPage() {
    const [timecodes, setTimecodes] = useState<Timecode[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTimecode, setSelectedTimecode] = useState<Timecode | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const fetchData = () => {
        getTimecodes().then(setTimecodes);
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Poll for timecode status
        return () => clearInterval(interval);
    }, []);

    const handleCreate = () => {
        setSelectedTimecode(null);
        setIsModalOpen(true);
    };
    
    const handleEdit = (t: Timecode) => {
        setSelectedTimecode(t);
        setIsModalOpen(true);
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedIds.size} timecode${selectedIds.size !== 1 ? 's' : ''}?`)) {
            return;
        }
        for (const id of selectedIds) {
            await deleteTimecode(id);
        }
        setSelectedIds(new Set());
        fetchData();
    };
    
    const actions = (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {selectedIds.size > 0 && (
                <button onClick={handleBulkDelete} className="btn btn-danger">
                    Delete {selectedIds.size}
                </button>
            )}
            <button onClick={handleCreate} className="btn btn-primary">+ Add Timecode</button>
        </div>
    );

    return (
        <AdminPageLayout title="Timecodes" actions={actions}>
            <TimecodesList
                timecodes={timecodes}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
                onEdit={handleEdit}
                onDelete={async (id) => {
                    if (!confirm('Are you sure?')) return;
                    await deleteTimecode(id);
                    fetchData();
                }}
                onStart={async (id) => {
                    await startTimecode(id);
                    fetchData();
                }}
                onStop={async (id) => {
                    await stopTimecode(id);
                    fetchData();
                }}
            />
            <TimecodeModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    fetchData();
                }}
                timecode={selectedTimecode}
            />
        </AdminPageLayout>
    );
}
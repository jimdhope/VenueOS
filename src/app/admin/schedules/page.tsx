'use client';

import { useState, useEffect } from 'react';
import { getSchedulesPageData, deleteSchedule } from '@/app/actions/schedules';
import SchedulesList from '@/components/SchedulesList';
import AdminPageLayout from '@/components/AdminPageLayout';
import ScheduleModal from '@/components/ScheduleModal';

type Schedule = any;
type Screen = any;
type Playlist = any;

export default function SchedulesPage() {
    const [data, setData] = useState<{
        schedules: Schedule[];
        screens: Screen[];
        playlists: Playlist[];
    }>({ schedules: [], screens: [], playlists: [] });
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const fetchData = () => {
        getSchedulesPageData().then(setData);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = () => {
        setSelectedSchedule(null);
        setIsModalOpen(true);
    };

    const handleEdit = (s: Schedule) => {
        setSelectedSchedule(s);
        setIsModalOpen(true);
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Delete ${selectedIds.size} schedule(s)?`)) return;

        for (const id of selectedIds) {
            await deleteSchedule(id, ''); // screenId is not used in the new delete action
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
            <button onClick={handleCreate} className="btn btn-primary">+ Add Schedule</button>
        </div>
    );

    return (
        <AdminPageLayout title="Schedules" actions={actions}>
            <SchedulesList
                initialSchedules={data.schedules}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
                onEdit={handleEdit}
                onDelete={async (id) => {
                    if (confirm('Delete this schedule?')) {
                        await deleteSchedule(id, '');
                        fetchData();
                    }
                }}
            />
            <ScheduleModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    fetchData();
                }}
                screens={data.screens}
                playlists={data.playlists}
                schedule={selectedSchedule}
            />
        </AdminPageLayout>
    );
}

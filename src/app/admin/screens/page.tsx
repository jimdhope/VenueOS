'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getScreensPageData, deleteScreen } from '@/app/actions/screens';
import { getActiveScheduleForScreen } from '@/app/actions/schedules';
import ScreensList from '@/components/ScreensList';
import AdminPageLayout from '@/components/AdminPageLayout';
import ScreenModal from '@/components/ScreenModal';
import LinkModal from '@/components/LinkModal';
import ScheduleModal from '@/components/ScheduleModal';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VenueOS - Screens",
};

type ScreenWithDetails = any; // Simplified for brevity
type Space = any;
type Playlist = any;
type Timecode = any;
type ActiveSchedule = any;

export default function ScreensPage() {
    const [data, setData] = useState<{
        screens: ScreenWithDetails[];
        spaces: Space[];
        playlists: Playlist[];
        timecodes: Timecode[];
    }>({ screens: [], spaces: [], playlists: [], timecodes: [] });
    const [activeSchedules, setActiveSchedules] = useState<Record<string, ActiveSchedule>>({});
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedScreen, setSelectedScreen] = useState<ScreenWithDetails | null>(null);
    const [linkModalScreen, setLinkModalScreen] = useState<ScreenWithDetails | null>(null);
    const [scheduleModalScreen, setScheduleModalScreen] = useState<ScreenWithDetails | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState('');
    const router = useRouter();

    const fetchData = () => {
        getScreensPageData().then(initialData => {
            setData(initialData);
            Promise.all(
                initialData.screens.map(async (screen) => ({
                    screenId: screen.id,
                    active: await getActiveScheduleForScreen(screen.id),
                }))
            ).then(activeSchedules => {
                setActiveSchedules(Object.fromEntries(activeSchedules.map(s => [s.screenId, s.active])));
            });
        });
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => {
            fetchData();
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleCreate = () => {
        setSelectedScreen(null);
        setIsModalOpen(true);
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Delete ${selectedIds.size} screen(s)? This cannot be undone.`)) return;

        for (const id of selectedIds) {
            await deleteScreen(id);
        }
        setSelectedIds(new Set());
        fetchData();
    };
    
    const actions = (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
                type="text"
                placeholder="Search screens, locations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    padding: '0.6rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    width: '250px',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    transition: 'border-color 0.2s',
                }}
            />
            {selectedIds.size > 0 && (
                <button onClick={handleBulkDelete} className="btn btn-danger">
                    Delete {selectedIds.size}
                </button>
            )}
            <button onClick={handleCreate} className="btn btn-primary">
                + Add Screen
            </button>
        </div>
    );

    return (
        <AdminPageLayout title="Screens" actions={actions}>
            <ScreensList
                initialScreens={data.screens}
                activeSchedules={activeSchedules}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
                search={search}
                onEdit={(screen) => {
                    setSelectedScreen(screen);
                    setIsModalOpen(true);
                }}
                onGetLink={setLinkModalScreen}
                onSchedule={setScheduleModalScreen}
                onDelete={async (id) => {
                    if (confirm('Are you sure you want to delete this screen?')) {
                        await deleteScreen(id);
                        fetchData();
                    }
                }}
            />

            <ScreenModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    fetchData();
                }}
                screen={selectedScreen}
                spaces={data.spaces}
                playlists={data.playlists}
                timecodes={data.timecodes}
            />

            {linkModalScreen && (
                <LinkModal
                    isOpen={!!linkModalScreen}
                    onClose={() => setLinkModalScreen(null)}
                    screenName={linkModalScreen.name}
                    url={`${window.location.origin}/play/${linkModalScreen.id}`}
                />
            )}

            {scheduleModalScreen && (
                <ScheduleModal
                    isOpen={!!scheduleModalScreen}
                    onClose={() => {
                        setScheduleModalScreen(null);
                        fetchData();
                    }}
                    screens={data.screens}
                    preSelectedScreenId={scheduleModalScreen.id}
                    screenName={scheduleModalScreen.name}
                    playlists={data.playlists}
                />
            )}
        </AdminPageLayout>
    );
}
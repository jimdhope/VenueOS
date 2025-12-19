'use client';

import { useState, useEffect } from 'react';
import { getPlaylists, deletePlaylist } from '@/app/actions/playlists';
import PlaylistsList from '@/components/PlaylistsList';
import AdminPageLayout from '@/components/AdminPageLayout';
import PlaylistModal from '@/components/PlaylistModal';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VenueOS - Playlists",
};

type Playlist = {
    id: string;
    name: string;
    _count: {
        entries: number;
        screens: number;
    };
};

export default function PlaylistsPage() {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const fetchData = () => {
        getPlaylists().then(setPlaylists);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = () => {
        setSelectedPlaylist(null);
        setIsModalOpen(true);
    };

    const handleEdit = (p: Playlist) => {
        setSelectedPlaylist(p);
        setIsModalOpen(true);
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedIds.size} playlist${selectedIds.size !== 1 ? 's' : ''}?`)) {
            return;
        }
        for (const id of selectedIds) {
            await deletePlaylist(id);
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
            <button onClick={handleCreate} className="btn btn-primary">+ New Playlist</button>
        </div>
    );

    return (
        <AdminPageLayout title="Playlists" actions={actions}>
            <PlaylistsList
                playlists={playlists}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
                onEdit={handleEdit}
                onDelete={async (id) => {
                    if (confirm('Delete this playlist?')) {
                        await deletePlaylist(id);
                        fetchData();
                    }
                }}
            />
            <PlaylistModal 
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    fetchData();
                }}
                playlist={selectedPlaylist}
            />
        </AdminPageLayout>
    );
}
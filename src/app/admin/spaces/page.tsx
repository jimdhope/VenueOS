'use client';

import { useState, useEffect } from 'react';
import { getSpacesPageData, deleteSpace } from '@/app/actions/spaces';
import SpacesList from '@/components/SpacesList';
import AdminPageLayout from '@/components/AdminPageLayout';
import SpaceModal from '@/components/SpaceModal';

type SpaceWithDetails = any;
type Venue = any;

export default function SpacesPage() {
    const [data, setData] = useState<{
        venues: Venue[];
        spaces: SpaceWithDetails[];
    }>({ venues: [], spaces: [] });
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSpace, setSelectedSpace] = useState<SpaceWithDetails | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const fetchData = () => {
        getSpacesPageData().then(setData);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = () => {
        setSelectedSpace(null);
        setIsModalOpen(true);
    };

    const handleEdit = (s: SpaceWithDetails) => {
        setSelectedSpace(s);
        setIsModalOpen(true);
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedIds.size} space${selectedIds.size !== 1 ? 's' : ''}?`)) {
            return;
        }
        for (const id of selectedIds) {
            await deleteSpace(id);
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
            <button onClick={handleCreate} className="btn btn-primary">+ Add Space</button>
        </div>
    );

    return (
        <AdminPageLayout title="Spaces" actions={actions}>
            <SpacesList
                initialSpaces={data.spaces}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
                onEdit={handleEdit}
                onDelete={async (id) => {
                    if (confirm('Are you sure you want to delete this space? This action cannot be undone.')) {
                        await deleteSpace(id);
                        fetchData();
                    }
                }}
            />
            <SpaceModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    fetchData();
                }}
                space={selectedSpace}
                venues={data.venues}
            />
        </AdminPageLayout>
    );
}
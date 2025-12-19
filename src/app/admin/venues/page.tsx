'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getVenuesWithCount, deleteVenue } from '@/app/actions/venues';
import VenuesList from '@/components/VenuesList';
import AdminPageLayout from '@/components/AdminPageLayout';
import VenueModal from '@/components/VenueModal';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VenueOS - Venues",
};

type VenueWithCount = { id: string; name: string; _count?: { spaces: number } };

export default function VenuesPage() {
    const [venues, setVenues] = useState<VenueWithCount[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVenue, setSelectedVenue] = useState<VenueWithCount | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const router = useRouter();

    useEffect(() => {
        getVenuesWithCount().then(setVenues);
    }, []);

    const handleCreate = () => {
        setSelectedVenue(null);
        setIsModalOpen(true);
    };

    const handleEdit = (v: VenueWithCount) => {
        setSelectedVenue(v);
        setIsModalOpen(true);
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedIds.size} venue${selectedIds.size !== 1 ? 's' : ''}? This will remove their spaces as well.`)) {
            return;
        }
        for (const id of selectedIds) {
            await deleteVenue(id);
        }
        setSelectedIds(new Set());
        getVenuesWithCount().then(setVenues); // Refresh data
    };

    const actions = (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {selectedIds.size > 0 && (
                <button onClick={handleBulkDelete} className="btn btn-danger">
                    Delete {selectedIds.size}
                </button>
            )}
            <button onClick={handleCreate} className="btn btn-primary">+ Add Venue</button>
        </div>
    );

    return (
        <AdminPageLayout title="Venues" actions={actions}>
            <VenuesList
                initialVenues={venues}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
                onEdit={handleEdit}
                onDelete={async (id: string) => {
                    if (confirm('Delete this venue? This will remove its spaces as well.')) {
                        await deleteVenue(id);
                        getVenuesWithCount().then(setVenues); // Refresh data
                    }
                }}
            />
            <VenueModal 
                isOpen={isModalOpen} 
                onClose={() => {
                    setIsModalOpen(false);
                    getVenuesWithCount().then(setVenues); // Refresh data on close
                }} 
                venue={selectedVenue} 
            />
        </AdminPageLayout>
    );
}
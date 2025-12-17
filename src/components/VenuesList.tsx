'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import VenueModal from './VenueModal';
import { deleteVenue } from '../app/actions/venues';
import styles from './spaces-list.module.css';

type VenueWithCount = { id: string; name: string; _count?: { spaces: number } };

export default function VenuesList({ initialVenues }: { initialVenues: VenueWithCount[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVenue, setSelectedVenue] = useState<VenueWithCount | null>(null);
    const router = useRouter();

    const handleCreate = () => { setSelectedVenue(null); setIsModalOpen(true); };
    const handleEdit = (v: VenueWithCount) => { setSelectedVenue(v); setIsModalOpen(true); };
    const handleDelete = async (id: string) => {
        if (confirm('Delete this venue? This will remove its spaces as well.')) {
            await deleteVenue(id);
            try { router.refresh(); } catch (e) { /* ignore */ }
        }
    };

    return (
        <>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Venues</h1>
                    <p className={styles.subtitle}>Manage venues (buildings/locations)</p>
                </div>
                <button onClick={handleCreate} className="btn btn-primary">+ Add Venue</button>
            </div>

            <div className={styles.grid}>
                {initialVenues.length === 0 ? (
                    <div className={styles.empty}><p>No venues found.</p></div>
                ) : (
                    initialVenues.map((v) => (
                        <div key={v.id} className={styles.spaceCard}>
                            <div className={styles.spaceInfo}>
                                <h3>{v.name}</h3>
                                <span className={styles.screenCount}>{v._count?.spaces ?? 0} Space{(v._count?.spaces ?? 0) !== 1 ? 's' : ''}</span>
                            </div>
                            <div className={styles.actions}>
                                <button onClick={() => handleEdit(v)} className={styles.actionBtn}>Edit</button>
                                <button onClick={() => handleDelete(v.id)} className={`${styles.actionBtn} ${styles.danger}`}>Delete</button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <VenueModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} venue={selectedVenue} />
        </>
    );
}

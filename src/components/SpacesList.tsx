'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SpaceModal from '@/components/SpaceModal';
import { deleteSpace } from '../app/actions/spaces';
import styles from './spaces-list.module.css';

type SpaceWithDetails = {
    id: string;
    name: string;
    venueId: string;
    venue: { name: string };
    screens: { id: string }[];
};

type Venue = {
    id: string;
    name: string;
};

export default function SpacesList({
    initialVenues,
    initialSpaces,
}: {
    initialVenues: Venue[];
    initialSpaces: SpaceWithDetails[];
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSpace, setSelectedSpace] = useState<SpaceWithDetails | null>(null);
    const router = useRouter();

    const handleCreate = () => {
        setSelectedSpace(null);
        setIsModalOpen(true);
    };

    const handleEdit = (space: SpaceWithDetails) => {
        setSelectedSpace(space);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this space? This action cannot be undone.')) {
            await deleteSpace(id);
            try { router.refresh(); } catch (e) { /* ignore */ }
        }
    };

    // Group spaces by Venue
    const groupedSpaces = initialSpaces.reduce((acc, space) => {
        if (!acc[space.venue.name]) {
            acc[space.venue.name] = [];
        }
        acc[space.venue.name].push(space);
        return acc;
    }, {} as Record<string, SpaceWithDetails[]>);

    return (
        <>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Spaces</h1>
                    <p className={styles.subtitle}>Manage physical locations and rooms</p>
                </div>
                <button onClick={handleCreate} className="btn btn-primary">
                    + Add Space
                </button>
            </div>

            <div className={styles.grid}>
                {Object.entries(groupedSpaces).map(([venueName, spaces]) => (
                    <div key={venueName} className={styles.venueGroup}>
                        <h2 className={styles.venueTitle}>{venueName}</h2>
                        <div className={styles.spaceList}>
                            {spaces.map((space) => (
                                <div key={space.id} className={styles.spaceCard}>
                                    <div className={styles.spaceInfo}>
                                        <h3>{space.name}</h3>
                                        <span className={styles.screenCount}>
                                            {space.screens.length} Screen{space.screens.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div className={styles.actions}>
                                        <button
                                            onClick={() => handleEdit(space)}
                                            className={styles.actionBtn}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(space.id)}
                                            className={`${styles.actionBtn} ${styles.danger}`}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {initialVenues.length === 0 && (
                    <div className={styles.empty}>
                        <p>No venues found. Please seed the database.</p>
                    </div>
                )}
            </div>

            <SpaceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                space={selectedSpace}
                venues={initialVenues}
            />
        </>
    );
}

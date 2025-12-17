'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import styles from './screen-picker.module.css';

type Screen = {
    id: string;
    name: string;
    space: {
        name: string;
        venue: { name: string };
    };
    status: string;
};

export default function ScreenPicker({ screens }: { screens: Screen[] }) {
    const [search, setSearch] = useState('');

    const filteredScreens = useMemo(() => {
        return screens.filter(s =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.space.venue.name.toLowerCase().includes(search.toLowerCase()) ||
            s.space.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [screens, search]);

    // Group by Venue
    const screensByVenue = useMemo(() => {
        const groups: Record<string, Screen[]> = {};
        for (const screen of filteredScreens) {
            const venue = screen.space.venue.name;
            if (!groups[venue]) groups[venue] = [];
            groups[venue].push(screen);
        }
        return groups;
    }, [filteredScreens]);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Connect Display</h1>
                <input
                    type="text"
                    placeholder="Search Screens..."
                    className={styles.search}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </header>

            <div className={styles.content}>
                {Object.keys(screensByVenue).length === 0 ? (
                    <div className={styles.empty}>No screens found</div>
                ) : (
                    Object.entries(screensByVenue).map(([venue, venueScreens]) => (
                        <section key={venue} className={styles.venueSection}>
                            <h2 className={styles.venueTitle}>{venue}</h2>
                            <div className={styles.grid}>
                                {venueScreens.map((screen) => (
                                    <Link
                                        href={`/play/${screen.id}`}
                                        key={screen.id}
                                        className={styles.card}
                                    >
                                        <div className={styles.cardContent}>
                                            <h3 className={styles.screenName}>{screen.name}</h3>
                                            <p className={styles.spaceName}>{screen.space.name}</p>
                                        </div>
                                        <div className={styles.cardArrow}>→</div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ))
                )}
            </div>
        </div>
    );
}

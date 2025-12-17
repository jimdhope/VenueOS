import { prisma } from '@/lib/db';
import Link from 'next/link';
import { isScreenOnline, timeAgo } from '@/lib/utils';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    // Fetch all data in parallel
    const [
        venueCount,
        spaceCount,
        screenCount,
        playlistCount,
        contentCount,
        screens,
        recentScreens
    ] = await Promise.all([
        prisma.venue.count(),
        prisma.space.count(),
        prisma.screen.count(),
        prisma.playlist.count(),
        prisma.content.count(),
        prisma.screen.findMany({ select: { updatedAt: true } }),
        prisma.screen.findMany({
            take: 5,
            orderBy: { updatedAt: 'desc' },
            include: { space: { include: { venue: true } } }
        })
    ]);

    // Calculate real-time online status
    const onlineScreens = screens.filter(s => isScreenOnline(s.updatedAt)).length;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Dashboard Overview</h1>
                <p className={styles.subtitle}>System status and quick access</p>
            </header>

            {/* Main Stats Row */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <h3 className={styles.statTitle}>Screens Online</h3>
                        <span className={styles.statIcon}>🟢</span>
                    </div>
                    <p className={`${styles.statValue} ${onlineScreens > 0 ? styles.success : ''}`}>
                        {onlineScreens}<span style={{ fontSize: '1.5rem', opacity: 0.5 }}>/{screenCount}</span>
                    </p>
                    <p className={styles.statSubtext}>{screenCount === 0 ? 'No screens' : `${Math.round((onlineScreens / screenCount) * 100)}% uptime`}</p>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <h3 className={styles.statTitle}>Venues & Spaces</h3>
                        <span className={styles.statIcon}>🏢</span>
                    </div>
                    <p className={styles.statValue}>{venueCount}</p>
                    <p className={styles.statSubtext}>{spaceCount} total spaces</p>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <h3 className={styles.statTitle}>Total Playlists</h3>
                        <span className={styles.statIcon}>🎬</span>
                    </div>
                    <p className={styles.statValue}>{playlistCount}</p>
                    <p className={styles.statSubtext}>Scheduled content</p>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <h3 className={styles.statTitle}>Media Assets</h3>
                        <span className={styles.statIcon}>🖼️</span>
                    </div>
                    <p className={styles.statValue}>{contentCount}</p>
                    <p className={styles.statSubtext}>Images, videos, links</p>
                </div>
            </div>

            <div className={styles.dashboardGrid}>
                {/* Recent Activity Column */}
                <div className={styles.column}>
                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Recent Screen Activity</h2>
                        </div>
                        <ul className={styles.activityList}>
                            {recentScreens.length === 0 ? (
                                <li className={styles.activityItem}>
                                    <div className={styles.activityContent}>
                                        <p className={styles.activityText}>No recent activity.</p>
                                    </div>
                                </li>
                            ) : (
                                recentScreens.map(screen => (
                                    <li key={screen.id} className={styles.activityItem}>
                                        <div className={styles.activityDot} />
                                        <div className={styles.activityContent}>
                                            <p className={styles.activityText}>
                                                <strong>{screen.name}</strong> checked in
                                            </p>
                                            <p className={styles.activityMeta}>
                                                {screen.space.venue.name} • {screen.space.name} • {timeAgo(screen.updatedAt)}
                                            </p>
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </section>
                </div>

                {/* Quick Actions Column */}
                <div className={styles.column}>
                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Quick Actions</h2>
                        </div>
                        <div className={styles.quickActions}>
                            <Link href="/admin/screens" className={styles.actionCard}>
                                <span className={styles.actionIcon}>📺</span>
                                <span className={styles.actionLabel}>Manage Screens</span>
                            </Link>
                            <Link href="/admin/playlists" className={styles.actionCard}>
                                <span className={styles.actionIcon}>📋</span>
                                <span className={styles.actionLabel}>New Playlist</span>
                            </Link>
                            <Link href="/admin/content" className={styles.actionCard}>
                                <span className={styles.actionIcon}>📤</span>
                                <span className={styles.actionLabel}>Upload Content</span>
                            </Link>
                            <Link href="/play" target="_blank" className={styles.actionCard}>
                                <span className={styles.actionIcon}>🔗</span>
                                <span className={styles.actionLabel}>Connect Player</span>
                            </Link>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

import { prisma } from '@/lib/db';
import ScreensList from '@/components/ScreensList';
import styles from '@/components/screens-list.module.css';

export const dynamic = 'force-dynamic';

export default async function ScreensPage() {
    const [screens, spaces, playlists, timecodes] = await Promise.all([
        prisma.screen.findMany({
            include: {
                space: {
                    include: {
                        venue: true,
                    },
                },
                playlist: true,
            },
            orderBy: { name: 'asc' },
        }),
        prisma.space.findMany({
            include: {
                venue: true,
            },
            orderBy: { venue: { name: 'asc' } },
        }),
        prisma.playlist.findMany({
            orderBy: { name: 'asc' },
        }),
        prisma.timecode.findMany({
            orderBy: { name: 'asc' },
        }),
    ]);

    return (
        <div className={styles.container}>
            <ScreensList initialScreens={screens} initialSpaces={spaces} playlists={playlists} timecodes={timecodes} />
        </div>
    );
}

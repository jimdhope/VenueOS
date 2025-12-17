import { prisma } from '@/lib/db';
import SpacesList from '@/components/SpacesList';
import styles from '@/components/spaces-list.module.css';

export const dynamic = 'force-dynamic';

export default async function SpacesPage() {
    const [venues, spaces] = await Promise.all([
        prisma.venue.findMany({ orderBy: { name: 'asc' } }),
        prisma.space.findMany({
            include: {
                venue: true,
                screens: true,
            },
            orderBy: { name: 'asc' },
        }),
    ]);

    return (
        <div className={styles.container}>
            <SpacesList initialVenues={venues} initialSpaces={spaces} />
        </div>
    );
}

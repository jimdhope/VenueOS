import { prisma } from '@/lib/db';
import VenuesList from '@/components/VenuesList';
import styles from '@/components/spaces-list.module.css';

export const dynamic = 'force-dynamic';

export default async function VenuesPage() {
    const venues = await prisma.venue.findMany({ include: { _count: { select: { spaces: true } } }, orderBy: { name: 'asc' } });

    return (
        <div className={styles.container}>
            <VenuesList initialVenues={venues} />
        </div>
    );
}

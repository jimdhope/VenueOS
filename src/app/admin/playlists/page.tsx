import { prisma } from '@/lib/db';
import PlaylistsList from '@/components/PlaylistsList';

export const dynamic = 'force-dynamic';

export default async function PlaylistsPage() {
    const playlists = await prisma.playlist.findMany({
        include: {
            _count: {
                select: { entries: true, screens: true },
            },
        },
        orderBy: { updatedAt: 'desc' },
    });

    return <PlaylistsList playlists={playlists} />;
}

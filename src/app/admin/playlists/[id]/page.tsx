import { prisma } from '@/lib/db';
import PlaylistEditor from '@/components/PlaylistEditor';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function PlaylistEditorPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const [playlist, content] = await Promise.all([
        prisma.playlist.findUnique({
            where: { id: params.id },
            include: {
                entries: {
                    include: { content: true },
                    orderBy: { order: 'asc' },
                },
            },
        }),
        prisma.content.findMany({
            orderBy: { name: 'asc' },
        }),
    ]);

    if (!playlist) {
        notFound();
    }

    return <PlaylistEditor playlist={playlist} availableContent={content} />;
}

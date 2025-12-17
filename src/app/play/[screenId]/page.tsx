import PlayerEngine from '@/components/PlayerEngine';

export const dynamic = 'force-dynamic';

export default async function PlayerPage(props: { params: Promise<{ screenId: string }> }) {
    const params = await props.params;
    return <PlayerEngine screenId={params.screenId} />;
}

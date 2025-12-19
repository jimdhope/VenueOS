import PlayerEngine from '@/components/PlayerEngine';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VenueOS - Player",
};

export const dynamic = 'force-dynamic';

export default async function PlayerPage(props: { params: Promise<{ screenId: string }> }) {
    const params = await props.params;
    return <PlayerEngine screenId={params.screenId} />;
}

import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getActiveScheduleForScreen } from '@/app/actions/schedules';

export async function GET() {
    try {
        const screens = await prisma.screen.findMany({
            include: {
                space: true,
                schedules: {
                    include: { playlist: true },
                    orderBy: { priority: 'desc' },
                },
            },
        });

        const screenHealth = await Promise.all(
            screens.map(async (screen) => {
                const isOnline = new Date().getTime() - new Date(screen.updatedAt).getTime() < 60000; // 60 seconds
                const activeSchedule = await getActiveScheduleForScreen(screen.id);

                return {
                    id: screen.id,
                    name: screen.name,
                    space: screen.space.name,
                    status: isOnline ? 'online' : 'offline',
                    lastSeen: screen.updatedAt.toISOString(),
                    scheduleCount: screen.schedules.length,
                    activeSchedule: activeSchedule ? {
                        name: activeSchedule.name,
                        playlistName: activeSchedule.playlistName,
                    } : null,
                };
            })
        );

        return NextResponse.json(screenHealth);
    } catch (error) {
        console.error('Failed to fetch screen health:', error);
        return NextResponse.json({ error: 'Failed to fetch screen health' }, { status: 500 });
    }
}

import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const schedules = await prisma.schedule.findMany({
            include: {
                screen: {
                    include: {
                        space: true,
                    }
                },
                playlist: true,
            },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' }
            ]
        });

        return NextResponse.json(schedules);
    } catch (error) {
        console.error('Failed to fetch schedules:', error);
        return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
    }
}

'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const ScheduleSchema = z.object({
    screenId: z.string(),
    playlistId: z.string(),
    priority: z.coerce.number().default(0),
    startDate: z.string().optional().nullable(), // ISO string from form
    endDate: z.string().optional().nullable(),
    startTime: z.string().optional().nullable(), // HH:mm
    endTime: z.string().optional().nullable(),   // HH:mm
    daysOfWeek: z.string().optional().nullable(), // "1,2,3"
    name: z.string().optional().nullable(),
});

export async function createSchedule(prevState: any, formData: FormData) {
    const rawData = {
        screenId: formData.get('screenId'),
        playlistId: formData.get('playlistId'),
        priority: formData.get('priority'),
        startDate: formData.get('startDate') || null,
        endDate: formData.get('endDate') || null,
        startTime: formData.get('startTime') || null,
        endTime: formData.get('endTime') || null,
        daysOfWeek: formData.get('daysOfWeek') || null,
        name: formData.get('name') || null,
    };

    const validated = ScheduleSchema.safeParse(rawData);

    if (!validated.success) {
        return {
            errors: validated.error.flatten().fieldErrors,
            message: 'Failed to Create Schedule.',
        };
    }

    const { data } = validated;

    try {
        await prisma.schedule.create({
            data: {
                screenId: data.screenId,
                playlistId: data.playlistId,
                priority: data.priority,
                startDate: data.startDate ? new Date(data.startDate) : null,
                endDate: data.endDate ? new Date(data.endDate) : null,
                startTime: data.startTime || null,
                endTime: data.endTime || null,
                daysOfWeek: data.daysOfWeek || null,
                name: data.name || 'Untitled Schedule',
            },
        });
    } catch (error) {
        console.error('Create Schedule Error', error);
        return {
            message: 'Database Error: Failed to Create Schedule.',
        };
    }

    revalidatePath(`/admin/screens/${data.screenId}`);
    return { success: true, message: 'Schedule created.' };
}

export async function deleteSchedule(id: string, screenId: string) {
    try {
        await prisma.schedule.delete({
            where: { id },
        });
        revalidatePath(`/admin/screens/${screenId}`);
        revalidatePath(`/admin/schedules`);
        return { message: 'Schedule deleted.' };
    } catch (error) {
        return { message: 'Database Error: Failed to Delete Schedule.' };
    }
}

export async function updateSchedule(id: string, prevState: any, formData: FormData) {
    const rawData = {
        playlistId: formData.get('playlistId'),
        priority: formData.get('priority'),
        startDate: formData.get('startDate') || null,
        endDate: formData.get('endDate') || null,
        startTime: formData.get('startTime') || null,
        endTime: formData.get('endTime') || null,
        daysOfWeek: formData.get('daysOfWeek') || null,
        name: formData.get('name') || null,
    };

    const validated = ScheduleSchema.omit({ screenId: true }).safeParse(rawData);

    if (!validated.success) {
        return {
            errors: validated.error.flatten().fieldErrors,
            message: 'Failed to Update Schedule.',
        };
    }

    const { data } = validated;

    try {
        await prisma.schedule.update({
            where: { id },
            data: {
                playlistId: data.playlistId,
                priority: data.priority,
                startDate: data.startDate ? new Date(data.startDate) : null,
                endDate: data.endDate ? new Date(data.endDate) : null,
                startTime: data.startTime || null,
                endTime: data.endTime || null,
                daysOfWeek: data.daysOfWeek || null,
                name: data.name || 'Untitled Schedule',
            },
        });
    } catch (error) {
        console.error('Update Schedule Error', error);
        return {
            message: 'Database Error: Failed to Update Schedule.',
        };
    }

    revalidatePath(`/admin/schedules`);
    return { success: true, message: 'Schedule updated.' };
}


export async function getSchedulesPageData() {
    try {
        const [schedules, screens, playlists] = await Promise.all([
            prisma.schedule.findMany({
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
            }),
            prisma.screen.findMany({
                include: {
                    space: true,
                }
            }),
            prisma.playlist.findMany(),
        ]);
        return { schedules, screens, playlists };
    } catch (err) {
        console.error('Failed to fetch schedules page data', err);
        return { schedules: [], screens: [], playlists: [] };
    }
}

export async function getActiveScheduleForScreen(screenId: string) {
    'use server';
    
    const now = new Date();
    const dayOfWeek = now.getDay();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateStr = now.toISOString().split('T')[0];

    const activeSchedule = await prisma.schedule.findFirst({
        where: {
            screenId,
            OR: [
                // No start/end date specified (all dates)
                {
                    startDate: null,
                    endDate: null,
                },
                // Within date range
                {
                    startDate: { lte: new Date(dateStr) },
                    endDate: { gte: new Date(dateStr) },
                },
                // Start date only
                {
                    startDate: { lte: new Date(dateStr) },
                    endDate: null,
                },
                // End date only
                {
                    startDate: null,
                    endDate: { gte: new Date(dateStr) },
                },
            ],
        },
        orderBy: { priority: 'desc' },
        include: {
            playlist: true,
        },
    });

    if (!activeSchedule) {
        return null;
    }

    // Check time constraints
    if (activeSchedule.startTime || activeSchedule.endTime) {
        const startTime = activeSchedule.startTime || '00:00';
        const endTime = activeSchedule.endTime || '23:59';
        if (!(timeStr >= startTime && timeStr <= endTime)) {
            return null;
        }
    }

    // Check day of week constraints
    if (activeSchedule.daysOfWeek) {
        const days = activeSchedule.daysOfWeek.split(',').map(d => parseInt(d));
        if (!days.includes(dayOfWeek)) {
            return null;
        }
    }

    return {
        id: activeSchedule.id,
        name: activeSchedule.name || 'Untitled',
        playlistName: activeSchedule.playlist.name,
    };
}

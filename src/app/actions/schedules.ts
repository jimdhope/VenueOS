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
        return { message: 'Schedule deleted.' };
    } catch (error) {
        return { message: 'Database Error: Failed to Delete Schedule.' };
    }
}

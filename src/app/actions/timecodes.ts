'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { notify } from '@/lib/broadcaster';

const TimecodeSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    speed: z.number().min(0.1, 'Speed must be at least 0.1').max(10, 'Speed cannot exceed 10').default(1.0),
});

export async function createTimecode(prevState: any, formData: FormData) {
    const validatedFields = TimecodeSchema.safeParse({
        name: formData.get('name'),
        speed: formData.get('speed') ? parseFloat(formData.get('speed') as string) : 1.0,
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Timecode.',
        };
    }

    const { name, speed } = validatedFields.data;

    try {
        const timecode = await prisma.timecode.create({
            data: {
                name,
                speed,
                startedAt: new Date(),
                isRunning: true,
            },
        });
        revalidatePath('/admin/timecodes');
        return { success: true, message: 'Timecode created successfully.', id: timecode.id };
    } catch (error) {
        return {
            message: 'Database Error: Failed to Create Timecode.',
        };
    }
}

export async function updateTimecode(id: string, prevState: any, formData: FormData) {
    const validatedFields = TimecodeSchema.safeParse({
        name: formData.get('name'),
        speed: formData.get('speed') ? parseFloat(formData.get('speed') as string) : 1.0,
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Update Timecode.',
        };
    }

    const { name, speed } = validatedFields.data;

    try {
        await prisma.timecode.update({
            where: { id },
            data: { name, speed },
        });
        revalidatePath('/admin/timecodes');
        return { success: true, message: 'Timecode updated successfully.' };
    } catch (error) {
        return {
            message: 'Database Error: Failed to Update Timecode.',
        };
    }
}

export async function deleteTimecode(id: string) {
    try {
        await prisma.timecode.delete({
            where: { id },
        });
        revalidatePath('/admin/timecodes');
        return { message: 'Timecode deleted.' };
    } catch (error) {
        return { message: 'Database Error: Failed to Delete Timecode.' };
    }
}

export async function startTimecode(id: string) {
    try {
        const timecode = await prisma.timecode.update({
            where: { id },
            data: {
                isRunning: true,
                startedAt: new Date(),
            },
        });

        // Notify all connected screens using this timecode
        const screensUsingTimecode = await prisma.screen.findMany({
            where: { timecodeId: id },
        });

        for (const screen of screensUsingTimecode) {
            try {
                notify(`screen:${screen.id}`, {
                    type: 'timecode:started',
                    timecodeId: id,
                    startedAt: timecode.startedAt,
                });
            } catch (e) {
                console.error('DEBUG notify timecode:started error', e);
            }
        }

        revalidatePath('/admin/timecodes');
        return { success: true, message: 'Timecode started.' };
    } catch (error) {
        return { message: 'Database Error: Failed to Start Timecode.' };
    }
}

export async function stopTimecode(id: string) {
    try {
        await prisma.timecode.update({
            where: { id },
            data: { isRunning: false },
        });

        // Notify all connected screens using this timecode
        const screensUsingTimecode = await prisma.screen.findMany({
            where: { timecodeId: id },
        });

        for (const screen of screensUsingTimecode) {
            try {
                notify(`screen:${screen.id}`, {
                    type: 'timecode:stopped',
                    timecodeId: id,
                });
            } catch (e) {
                console.error('DEBUG notify timecode:stopped error', e);
            }
        }

        revalidatePath('/admin/timecodes');
        return { success: true, message: 'Timecode stopped.' };
    } catch (error) {
        return { message: 'Database Error: Failed to Stop Timecode.' };
    }
}

export async function getTimecodeStatus(id: string) {
    try {
        const timecode = await prisma.timecode.findUnique({
            where: { id },
        });

        if (!timecode) {
            return null;
        }

        // Compute elapsed time since startedAt, applying speed multiplier
        const elapsedMs = Date.now() - timecode.startedAt.getTime();
        const scaledElapsedMs = timecode.isRunning ? elapsedMs * timecode.speed : 0;

        return {
            id: timecode.id,
            name: timecode.name,
            startedAt: timecode.startedAt,
            speed: timecode.speed,
            isRunning: timecode.isRunning,
            elapsedMs: scaledElapsedMs,
        };
    } catch (error) {
        console.error('Error fetching timecode status:', error);
        return null;
    }
}

export async function assignTimecodeToScreen(screenId: string, timecodeId: string | null) {
    try {
        const screen = await prisma.screen.update({
            where: { id: screenId },
            data: { timecodeId },
        });

        // Notify the screen of timecode assignment
        try {
            notify(`screen:${screenId}`, {
                type: 'timecode:assigned',
                timecodeId,
            });
        } catch (e) {
            console.error('DEBUG notify timecode:assigned error', e);
        }

        revalidatePath('/admin/screens');
        return { success: true, message: 'Timecode assigned to screen.' };
    } catch (error) {
        return { message: 'Database Error: Failed to Assign Timecode.' };
    }
}

export async function getTimecodes() {
    try {
        const timecodes = await prisma.timecode.findMany({
            include: {
                screens: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return timecodes;
    } catch (error) {
        console.error('Error fetching timecodes:', error);
        return [];
    }
}

'use server';

import { prisma } from '@/lib/db';
import { notify } from '@/lib/broadcaster';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const ScreenSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    spaceId: z.string().min(1, 'Space is required'),
    resolution: z.string().optional(),
    orientation: z.enum(['LANDSCAPE', 'PORTRAIT']),
    status: z.enum(['ONLINE', 'OFFLINE']).optional(),
    timecodeId: z.string().optional().nullable(),
    matrixRow: z.number().int().min(0).optional().nullable(),
    matrixCol: z.number().int().min(0).optional().nullable(),
});

export async function createScreen(prevState: any, formData: FormData) {
    // Debug: log incoming form entries to help diagnose missing fields
    try {
        const entries: Record<string, any> = {};
        for (const [k, v] of Array.from(formData.entries())) {
            // Avoid logging large objects
            entries[k] = typeof v === 'string' ? v : (v instanceof File ? `[File:${(v as File).name}]` : String(v));
        }
        console.log('DEBUG createScreen form entries:', entries);
    } catch (e) {
        console.error('DEBUG createScreen failed to enumerate formData', e);
    }

    // Normalize form values: treat empty strings as undefined so optional fields validate correctly
    const rawStatus = formData.get('status');
    const statusVal = rawStatus === null || rawStatus === '' ? undefined : String(rawStatus);
    const rawResolution = formData.get('resolution');
    const resolutionVal = rawResolution === null || rawResolution === '' ? undefined : String(rawResolution);
    const rawOrientation = formData.get('orientation');
    const orientationVal = rawOrientation === null || rawOrientation === '' ? undefined : String(rawOrientation);
    const rawTimecodeId = formData.get('timecodeId');
    const timecodeIdVal = rawTimecodeId === null || rawTimecodeId === '' ? null : String(rawTimecodeId);
    const rawMatrixRow = formData.get('matrixRow');
    const matrixRowVal = rawMatrixRow === null || rawMatrixRow === '' ? null : parseInt(String(rawMatrixRow), 10);
    const rawMatrixCol = formData.get('matrixCol');
    const matrixColVal = rawMatrixCol === null || rawMatrixCol === '' ? null : parseInt(String(rawMatrixCol), 10);

    const validatedFields = ScreenSchema.safeParse({
        name: formData.get('name'),
        spaceId: formData.get('spaceId'),
        resolution: resolutionVal,
        orientation: orientationVal,
        status: statusVal,
        timecodeId: timecodeIdVal,
        matrixRow: isNaN(matrixRowVal as any) ? null : matrixRowVal,
        matrixCol: isNaN(matrixColVal as any) ? null : matrixColVal,
    });

    if (!validatedFields.success) {
        console.log('DEBUG createScreen validation errors:', validatedFields.error.flatten().fieldErrors);
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Screen.',
        };
    }

    const { name, spaceId, resolution, orientation, status, timecodeId, matrixRow, matrixCol } = validatedFields.data;
    const finalStatus = status ?? 'OFFLINE';

    try {
        const created = await prisma.screen.create({
            data: {
                name,
                spaceId,
                resolution: resolution ?? null,
                orientation,
                status: finalStatus,
                timecodeId: timecodeId ?? null,
                matrixRow: matrixRow ?? null,
                matrixCol: matrixCol ?? null,
            },
        });

        // Notify any connected players that this screen was created/updated
        try {
            notify(`screen:${created.id}`, {
                type: 'screen:created',
                screenId: created.id,
            });
        } catch (e) {
            console.error('DEBUG notify createScreen error', e);
        }
    } catch (error) {
        return {
            message: 'Database Error: Failed to Create Screen.',
        };
    }

    revalidatePath('/admin/screens');
    return { success: true, message: 'Screen created successfully.' };
}

export async function updateScreen(
    id: string,
    prevState: any,
    formData: FormData
) {
    try {
        const entries: Record<string, any> = {};
        for (const [k, v] of Array.from(formData.entries())) {
            entries[k] = typeof v === 'string' ? v : (v instanceof File ? `[File:${(v as File).name}]` : String(v));
        }
        console.log('DEBUG updateScreen form entries:', entries);
    } catch (e) {
        console.error('DEBUG updateScreen failed to enumerate formData', e);
    }

    const rawStatusUp = formData.get('status');
    const statusValUp = rawStatusUp === null || rawStatusUp === '' ? undefined : String(rawStatusUp);
    const rawResolutionUp = formData.get('resolution');
    const resolutionValUp = rawResolutionUp === null || rawResolutionUp === '' ? undefined : String(rawResolutionUp);
    const rawOrientationUp = formData.get('orientation');
    const orientationValUp = rawOrientationUp === null || rawOrientationUp === '' ? undefined : String(rawOrientationUp);
    const rawTimecodeIdUp = formData.get('timecodeId');
    const timecodeIdValUp = rawTimecodeIdUp === null || rawTimecodeIdUp === '' ? null : String(rawTimecodeIdUp);
    const rawMatrixRowUp = formData.get('matrixRow');
    const matrixRowValUp = rawMatrixRowUp === null || rawMatrixRowUp === '' ? null : parseInt(String(rawMatrixRowUp), 10);
    const rawMatrixColUp = formData.get('matrixCol');
    const matrixColValUp = rawMatrixColUp === null || rawMatrixColUp === '' ? null : parseInt(String(rawMatrixColUp), 10);

    const validatedFields = ScreenSchema.safeParse({
        name: formData.get('name'),
        spaceId: formData.get('spaceId'),
        resolution: resolutionValUp,
        orientation: orientationValUp,
        status: statusValUp,
        timecodeId: timecodeIdValUp,
        matrixRow: isNaN(matrixRowValUp as any) ? null : matrixRowValUp,
        matrixCol: isNaN(matrixColValUp as any) ? null : matrixColValUp,
    });

    if (!validatedFields.success) {
        console.log('DEBUG updateScreen validation errors:', validatedFields.error.flatten().fieldErrors);
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Update Screen.',
        };
    }

    const { name, spaceId, resolution, orientation, status, timecodeId, matrixRow, matrixCol } = validatedFields.data;
    const finalStatus = status ?? 'OFFLINE';

    try {
        // Build update data dynamically to handle null values properly
        const updateData: any = {
            name,
            spaceId,
            orientation,
            status: finalStatus,
        };

        // Only include fields that have meaningful values
        if (resolution !== undefined) {
            updateData.resolution = resolution;
        }
        if (timecodeId !== null) {
            updateData.timecodeId = timecodeId;
        } else {
            updateData.timecodeId = null;
        }
        
        // Set matrix fields explicitly (null is valid, means no matrix positioning)
        updateData.matrixRow = matrixRow === undefined ? null : matrixRow;
        updateData.matrixCol = matrixCol === undefined ? null : matrixCol;

        const playlistIdVal = formData.get('playlistId') as string;
        updateData.playlistId = playlistIdVal ? playlistIdVal : null;

        const updated = await prisma.screen.update({
            where: { id },
            data: updateData,
        });

        // Notify connected players about the update so they can refresh immediately
        try {
            notify(`screen:${id}`, {
                type: 'screen:updated',
                screenId: id,
                playlistId: updated.playlistId ?? null,
            });
        } catch (e) {
            console.error('DEBUG notify updateScreen error', e);
        }
    } catch (error) {
        console.error('DEBUG updateScreen database error:', error);
        return {
            message: 'Database Error: Failed to Update Screen.',
        };
    }

    revalidatePath('/admin/screens');
    return { success: true, message: 'Screen updated successfully.' };
}


export async function getScreensPageData() {
    try {
        const [screens, spaces, playlists, timecodes] = await Promise.all([
            prisma.screen.findMany({
                include: {
                    space: {
                        include: {
                            venue: true,
                        },
                    },
                    playlist: true,
                    schedules: {
                        include: {
                            playlist: true,
                        },
                        orderBy: {
                            priority: 'desc',
                        },
                    },
                },
                orderBy: { name: 'asc' },
            }),
            prisma.space.findMany({
                include: {
                    venue: true,
                },
                orderBy: { venue: { name: 'asc' } },
            }),
            prisma.playlist.findMany({
                orderBy: { name: 'asc' },
            }),
            prisma.timecode.findMany({
                orderBy: { name: 'asc' },
            }),
        ]);
        return { screens, spaces, playlists, timecodes };
    } catch (err) {
        console.error('Failed to fetch screens page data', err);
        return { screens: [], spaces: [], playlists: [], timecodes: [] };
    }
}

export async function deleteScreen(id: string) {
    try {
        await prisma.screen.delete({
            where: { id },
        });
        revalidatePath('/admin/screens');
        return { message: 'Screen deleted.' };
    } catch (error) {
        return { message: 'Database Error: Failed to Delete Screen.' };
    }
}

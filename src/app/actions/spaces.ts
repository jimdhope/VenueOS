'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const SpaceSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    venueId: z.string().min(1, 'Venue is required'),
});

export async function createSpace(prevState: any, formData: FormData) {
    const validatedFields = SpaceSchema.safeParse({
        name: formData.get('name'),
        venueId: formData.get('venueId'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Space.',
        };
    }

    const { name, venueId } = validatedFields.data;

    try {
        await prisma.space.create({
            data: {
                name,
                venueId,
            },
        });
    } catch (error) {
        return {
            message: 'Database Error: Failed to Create Space.',
        };
    }

    revalidatePath('/admin/spaces');
    return { success: true, message: 'Space created successfully.' };
}

export async function updateSpace(
    id: string,
    prevState: any,
    formData: FormData
) {
    const validatedFields = SpaceSchema.safeParse({
        name: formData.get('name'),
        venueId: formData.get('venueId'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Update Space.',
        };
    }

    const { name, venueId } = validatedFields.data;

    try {
        await prisma.space.update({
            where: { id },
            data: {
                name,
                venueId,
            },
        });
    } catch (error) {
        return {
            message: 'Database Error: Failed to Update Space.',
        };
    }

    revalidatePath('/admin/spaces');
    return { success: true, message: 'Space updated successfully.' };
}


export async function getSpacesPageData() {
    try {
        const [venues, spaces] = await Promise.all([
            prisma.venue.findMany({ orderBy: { name: 'asc' } }),
            prisma.space.findMany({
                include: {
                    venue: true,
                    screens: true,
                },
                orderBy: { name: 'asc' },
            }),
        ]);
        return { venues, spaces };
    } catch (err) {
        console.error('Failed to fetch spaces page data', err);
        return { venues: [], spaces: [] };
    }
}

export async function deleteSpace(id: string) {
    try {
        await prisma.space.delete({
            where: { id },
        });
        revalidatePath('/admin/spaces');
        return { message: 'Space deleted.' };
    } catch (error) {
        return { message: 'Database Error: Failed to Delete Space.' };
    }
}

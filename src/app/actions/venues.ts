'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const VenueSchema = z.object({
    name: z.string().min(1, 'Name is required'),
});

export async function createVenue(prevState: any, formData: FormData) {
    const validatedFields = VenueSchema.safeParse({
        name: formData.get('name'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Venue.',
        };
    }

    const { name } = validatedFields.data;

    try {
        await prisma.venue.create({ data: { name } });
    } catch (error) {
        return { message: 'Database Error: Failed to Create Venue.' };
    }

    revalidatePath('/admin/spaces');
    revalidatePath('/admin/venues');
    return { success: true, message: 'Venue created successfully.' };
}

export async function updateVenue(id: string, prevState: any, formData: FormData) {
    const validatedFields = VenueSchema.safeParse({
        name: formData.get('name'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Update Venue.',
        };
    }

    const { name } = validatedFields.data;

    try {
        await prisma.venue.update({ where: { id }, data: { name } });
    } catch (error) {
        return { message: 'Database Error: Failed to Update Venue.' };
    }

    revalidatePath('/admin/spaces');
    revalidatePath('/admin/venues');
    return { success: true, message: 'Venue updated successfully.' };
}

export async function deleteVenue(id: string) {
    try {
        await prisma.venue.delete({ where: { id } });
        revalidatePath('/admin/spaces');
        revalidatePath('/admin/venues');
        return { message: 'Venue deleted.' };
    } catch (error) {
        return { message: 'Database Error: Failed to Delete Venue.' };
    }
}

export async function getVenues() {
    try {
        const venues = await prisma.venue.findMany({ orderBy: { name: 'asc' } });
        return venues;
    } catch (err) {
        console.error('Failed to fetch venues', err);
        return [];
    }
}

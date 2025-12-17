'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const PlaylistSchema = z.object({
    name: z.string().min(1, 'Name is required'),
});

const EntrySchema = z.object({
    playlistId: z.string(),
    contentId: z.string(),
    duration: z.coerce.number().min(1).optional(),
});

export async function createPlaylist(prevState: any, formData: FormData) {
    const validatedFields = PlaylistSchema.safeParse({
        name: formData.get('name'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Failed to Create Playlist.',
        };
    }

    try {
        await prisma.playlist.create({
            data: {
                name: validatedFields.data.name,
            },
        });
    } catch (error) {
        return {
            message: 'Database Error: Failed to Create Playlist.',
        };
    }

    revalidatePath('/admin/playlists');
    return { success: true, message: 'Playlist created.' };
}

export async function updatePlaylist(id: string, name: string) {
    try {
        await prisma.playlist.update({
            where: { id },
            data: { name },
        });
        revalidatePath('/admin/playlists');
        revalidatePath(`/admin/playlists/${id}`);
        return { success: true, message: 'Playlist updated.' };
    } catch (error) {
        return { success: false, message: 'Failed to update playlist.' };
    }
}

export async function deletePlaylist(id: string) {
    try {
        await prisma.playlist.delete({
            where: { id },
        });
        revalidatePath('/admin/playlists');
        return { message: 'Playlist deleted.' };
    } catch (error) {
        return { message: 'Database Error: Failed to Delete Playlist.' };
    }
}

export async function addPlaylistEntry(playlistId: string, contentId: string) {
    try {
        // Get current max order
        const lastEntry = await prisma.playlistEntry.findFirst({
            where: { playlistId },
            orderBy: { order: 'desc' },
        });
        const newOrder = (lastEntry?.order ?? -1) + 1;

        // Get default duration from content if not specified
        const content = await prisma.content.findUnique({ where: { id: contentId } });
        if (!content) throw new Error('Content not found');

        await prisma.playlistEntry.create({
            data: {
                playlistId,
                contentId,
                order: newOrder,
                duration: content.duration,
            },
        });

        revalidatePath(`/admin/playlists/${playlistId}`);
        return { success: true };
    } catch (error) {
        return { success: false, message: 'Failed to add content.' };
    }
}

export async function removePlaylistEntry(entryId: string, playlistId: string) {
    try {
        await prisma.playlistEntry.delete({
            where: { id: entryId },
        });
        revalidatePath(`/admin/playlists/${playlistId}`);
        return { success: true };
    } catch (error) {
        return { success: false, message: 'Failed to remove content.' };
    }
}

export async function updateEntryDuration(
    entryId: string,
    playlistId: string,
    duration: number
) {
    try {
        await prisma.playlistEntry.update({
            where: { id: entryId },
            data: { duration },
        });
        revalidatePath(`/admin/playlists/${playlistId}`);
        return { success: true };
    } catch (error) {
        return { success: false, message: 'Failed to update duration.' };
    }
}

export async function reorderEntries(
    playlistId: string,
    orderedEntryIds: string[]
) {
    try {
        const transaction = orderedEntryIds.map((id, index) =>
            prisma.playlistEntry.update({
                where: { id },
                data: { order: index },
            })
        );

        await prisma.$transaction(transaction);
        revalidatePath(`/admin/playlists/${playlistId}`);
        return { success: true };
    } catch (error) {
        return { success: false, message: 'Failed to reorder playlist.' };
    }
}

'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const PlaylistSchema = z.object({
    name: z.string().min(1, 'Name is required'),
});

import { notify } from '@/lib/broadcaster';

// Helper to notify all screens watching a playlist
async function notifyPlaylistUpdate(playlistId: string) {
    try {
        const screens = await prisma.screen.findMany({
            where: { playlistId },
        });

        for (const screen of screens) {
            notify(`screen:${screen.id}`, {
                type: 'playlist:updated',
                playlistId,
            });
        }
    } catch (e) {
        console.error('DEBUG notifyPlaylistUpdate error', e);
    }
}

const EntrySchema = z.object({
    playlistId: z.string(),
    contentId: z.string(),
    duration: z.coerce.number().min(1).optional(),
});

export async function createPlaylist(prevState: Record<string, unknown> | null, formData: FormData) {
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

        // Notify screens (if name changes, maybe they need to know? mostly internal though)
        // notifyPlaylistUpdate(id); 

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

        await notifyPlaylistUpdate(playlistId);
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
        await notifyPlaylistUpdate(playlistId);
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
        await notifyPlaylistUpdate(playlistId);
        revalidatePath(`/admin/playlists/${playlistId}`);
        return { success: true };
    } catch (error) {
        return { success: false, message: 'Failed to update duration.' };
    }
}


export async function getPlaylists() {
    try {
        const playlists = await prisma.playlist.findMany({
            include: {
                _count: {
                    select: { entries: true, screens: true },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
        return playlists;
    } catch (err) {
        console.error('Failed to fetch playlists', err);
        return [];
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
        await notifyPlaylistUpdate(playlistId);
        revalidatePath(`/admin/playlists/${playlistId}`);
        return { success: true };
    } catch (error) {
        return { success: false, message: 'Failed to reorder playlist.' };
    }
}

'use server';

import { prisma } from '@/lib/db';
import { inferMatrixDimensions } from '@/lib/matrix';

export async function getScreenConfig(screenId: string) {
    try {
        console.log(`DEBUG: getScreenConfig called for ID: ${screenId}`);
        const screen = await prisma.screen.findUnique({
            where: { id: screenId },
            include: {
                playlist: {
                    include: {
                        entries: {
                            include: {
                                content: true,
                            },
                            orderBy: {
                                order: 'asc',
                            },
                        },
                    },
                },
            },
        });

        if (!screen) {
            console.log('DEBUG: getScreenConfig result: Screen Not Found');
            return null;
        }

        // Hydrate content data using Raw SQL to bypass Prisma staleness
        if (screen?.playlist?.entries) {
            const contentIds = screen.playlist.entries
                .map(e => e.content.id)
                .filter(Boolean);

            if (contentIds.length > 0) {
                const placeholders = contentIds.map(() => '?').join(',');
                const rawContents = await prisma.$queryRawUnsafe<any[]>(
                    `SELECT id, data FROM "Content" WHERE id IN (${placeholders})`,
                    ...contentIds
                );

                const dataMap = new Map(rawContents.map(c => [c.id, c.data]));

                screen.playlist.entries.forEach(entry => {
                    if (dataMap.has(entry.content.id)) {
                        const rawData = dataMap.get(entry.content.id);
                        if (rawData) {
                            entry.content.data = rawData;
                        }
                    }
                });
            }
        }

        // Infer matrix dimensions from all screens in the same space
        const screensInSpace = await prisma.screen.findMany({
            where: { spaceId: screen.spaceId },
        });
        const { totalRows, totalCols } = inferMatrixDimensions(screensInSpace);

        console.log(`DEBUG: getScreenConfig result: Found Screen ${screen.name}, Playlist: ${screen.playlistId}, Matrix: ${totalRows}x${totalCols}`);
        
        return {
            ...screen,
            totalRows,
            totalCols,
        };

    } catch (error) {
        console.error('Error fetching screen config:', error);
        return null;
    }
}

export async function updateScreenStatus(screenId: string, status: string = 'ONLINE') {
    try {
        await prisma.screen.update({
            where: { id: screenId },
            data: {
                status,
                updatedAt: new Date(), // Force update timestamp for heartbeat
            },
        });
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

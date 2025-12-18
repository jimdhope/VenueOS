'use server';

import { prisma } from '@/lib/db';
import { inferMatrixDimensions } from '@/lib/matrix';

export async function getScreenConfig(screenId: string) {
    try {
        // console.log(`DEBUG: getScreenConfig called for ID: ${screenId}`);

        // 1. Fetch Screen metadata + Schedules
        // specialized query to get lightweight info first
        const screenBase = await prisma.screen.findUnique({
            where: { id: screenId },
            include: {
                schedules: {
                    include: {
                        playlist: { select: { id: true, name: true } } // Minimal info for logging
                    }
                }
            }
        });

        if (!screenBase) {
            // console.log('DEBUG: getScreenConfig result: Screen Not Found');
            return null;
        }

        // 2. Resolve Active Playlist ID
        // NOTE: screens no longer carry an "assigned playlist" by design; schedules determine what plays.
        // Default to null and only set when a schedule matches.
        let activePlaylistId: string | null = null;
        let activeScheduleName = null;

        const now = new Date();
        const currentDay = now.getDay(); // 0-6 Sun-Sat
        // Format current time as HH:mm for string comparison
        const currentHm = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

        // Filter valid schedules
        const validSchedules = screenBase.schedules.filter((s: any) => {
            // Date Range
            if (s.startDate && s.startDate > now) return false;
            if (s.endDate && s.endDate < now) return false;

            // Days of Week (e.g., "1,2,3,4,5")
            if (s.daysOfWeek) {
                const days = s.daysOfWeek.split(',').map((d: string) => parseInt(d.trim()));
                if (!days.includes(currentDay)) return false;
            }

            // Time of Day (e.g., 09:00 - 17:00)
            if (s.startTime && s.endTime) {
                if (currentHm < s.startTime || currentHm > s.endTime) return false;
            } else if (s.startTime) {
                if (currentHm < s.startTime) return false; // Open ended start?
            } else if (s.endTime) {
                if (currentHm > s.endTime) return false; // Open ended end?
            }

            return true;
        });

        // Pick highest priority
        if (validSchedules.length > 0) {
            // Sort by Priority DESC, then CreatedAt DESC (newest wins tie)
            validSchedules.sort((a: any, b: any) => {
                if (b.priority !== a.priority) return b.priority - a.priority;
                return b.createdAt.getTime() - a.createdAt.getTime();
            });

            const winner = validSchedules[0];
            activePlaylistId = winner.playlistId;
            activeScheduleName = winner.name;
            // console.log(`DEBUG: Schedule Match: ${winner.name} (ID: ${winner.id}) -> Playlist: ${winner.playlistId}`);
        }

        // 3. Fetch Full Playlist Data
        let fullPlaylist = null;
        if (activePlaylistId) {
            fullPlaylist = await prisma.playlist.findUnique({
                where: { id: activePlaylistId },
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
            });
        }

        // 4. Hydrate Content Data (Raw SQL bypass)
        if (fullPlaylist?.entries) {
            const contentIds = fullPlaylist.entries
                .map((e: any) => e.content.id)
                .filter(Boolean);

            if (contentIds.length > 0) {
                const placeholders = contentIds.map(() => '?').join(',');
                const rawContents = await prisma.$queryRawUnsafe<any[]>(
                    `SELECT id, data FROM "Content" WHERE id IN (${placeholders})`,
                    ...contentIds
                );

                const dataMap = new Map(rawContents.map((c: any) => [c.id, c.data]));

                fullPlaylist.entries.forEach((entry: any) => {
                    if (dataMap.has(entry.content.id)) {
                        const rawData = dataMap.get(entry.content.id);
                        if (rawData) {
                            entry.content.data = rawData;
                        }
                    }
                });
            }
        }

        // 5. Infer Matrix Dimensions
        const screensInSpace = await prisma.screen.findMany({
            where: { spaceId: screenBase.spaceId },
        });
        const { totalRows, totalCols } = inferMatrixDimensions(screensInSpace);

        // console.log(`DEBUG: getScreenConfig: ${screenBase.name} -> Playlist ${activePlaylistId} (Sched: ${activeScheduleName || 'None'})`);

        // Return combined object
        // We attach the resolved 'playlist' to the screen object so the frontend sees it as THE playlist.
        return {
            ...screenBase,
            playlist: fullPlaylist,
            playlistId: activePlaylistId, // Ensure ID matches populated data
            activeScheduleName, // Optional metadata for debugging UI if needed
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

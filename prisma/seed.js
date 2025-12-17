require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding ...');

    // Check if we already have the venue
    const existing = await prisma.venue.findFirst({ where: { name: 'The Spa' } });
    if (existing) {
        console.log('Venue "The Spa" already exists.');
        return;
    }

    const venue = await prisma.venue.create({
        data: {
            name: 'The Spa',
            spaces: {
                create: [
                    {
                        name: 'Box Office',
                        screens: {
                            create: [
                                { name: 'Box Office Matrix', resolution: '3840x2160', status: 'ONLINE' },
                                { name: 'Box Office Rear', resolution: '1920x1080', status: 'ONLINE' },
                            ],
                        },
                    },
                    {
                        name: 'Bar 1',
                        screens: { create: [{ name: 'Bar 1 Menu', status: 'ONLINE' }] },
                    },
                    {
                        name: 'Bar 2',
                        screens: { create: [{ name: 'Bar 2 Menu', status: 'ONLINE' }] },
                    },
                    {
                        name: 'Bar 3',
                        screens: { create: [{ name: 'Bar 3 Menu', status: 'ONLINE' }] },
                    },
                    {
                        name: 'Cafe Bar',
                        screens: { create: [{ name: 'Cafe Bar Menu', status: 'ONLINE' }] },
                    },
                    {
                        name: 'Theatre',
                        screens: { create: [{ name: 'Theatre Entrance', status: 'ONLINE' }] },
                    },
                    {
                        name: 'Main Hall',
                        screens: { create: [{ name: 'Main Hall Entrance', status: 'ONLINE' }] },
                    },
                    {
                        name: 'Meeting Room',
                        screens: { create: [{ name: 'Meeting Room Entrance', status: 'OFFLINE' }] },
                    },
                    {
                        name: 'Board Room',
                        screens: { create: [{ name: 'Board Room Entrance', status: 'OFFLINE' }] },
                    },
                    // Breakout Rooms 1-6
                    ...Array.from({ length: 6 }).map((_, i) => ({
                        name: `Breakout Room ${i + 1}`,
                        screens: {
                            create: [{ name: `Breakout ${i + 1} Entrance`, status: 'OFFLINE' }],
                        },
                    })),
                    {
                        name: 'Public Spaces',
                        screens: {
                            create: [
                                { name: 'Lobby Ad Screen 1', status: 'ONLINE' },
                                { name: 'Lobby Ad Screen 2', status: 'ONLINE' },
                                { name: 'Corridor Screen', status: 'ONLINE' },
                            ],
                        },
                    },
                ],
            },
        },
    });

    console.log(`Created venue with id: ${venue.id}`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const screens = await prisma.screen.findMany();
    console.log('All Screens:', screens);

    const idToCheck = '628731b3-4f99-4d69-a868-c9c05e552504';
    const specific = await prisma.screen.findUnique({
        where: { id: idToCheck }
    });
    console.log('Specific Screen:', specific);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

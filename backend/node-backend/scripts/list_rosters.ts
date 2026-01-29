import prisma from '../src/config/prisma.js';

async function listRosters() {
    console.log('--- Listing Timetable Rosters ---');
    try {
        const rosters = await prisma.timetableRoster.findMany({
            include: {
                class: true,
                course: true
            },
            take: 1
        });
        console.log(JSON.stringify(rosters, null, 2));
    } catch (error) {
        console.error('Failed to list rosters:', error);
    } finally {
        await prisma.$disconnect();
    }
}

listRosters();

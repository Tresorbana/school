import prisma from '../src/config/prisma.js';

async function findData() {
    console.log('--- Finding Attendance Test Data ---');
    try {
        const student = await prisma.student.findFirst({
            where: { class: { class_name: 'S1A' } },
            select: { student_id: true, class_id: true }
        });

        const roster = await prisma.timetableRoster.findFirst({
            where: { class_id: student?.class_id ?? null },
            select: { roster_id: true }
        });

        console.log(JSON.stringify({ student, roster }, null, 2));
    } catch (error) {
        console.error('Failed to find data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

findData();

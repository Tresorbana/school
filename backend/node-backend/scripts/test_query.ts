import prisma from '../src/config/prisma.js';

async function testQuery() {
    console.log('--- Testing findUnique with is_active ---');
    try {
        const email = 'admin@build.com';

        // This is what AuthService does
        const user = await (prisma.user as any).findUnique({
            where: { email, is_active: true }
        });

        console.log('Query result:', user ? 'Found' : 'Not Found');
        if (!user) {
            console.log('Testing with findFirst instead...');
            const userFirst = await prisma.user.findFirst({
                where: { email, is_active: true }
            });
            console.log('findFirst result:', userFirst ? 'Found' : 'Not Found');
        }
    } catch (error) {
        console.error('Query failed with error:', (error as Error).message);
    } finally {
        await prisma.$disconnect();
    }
}

testQuery();

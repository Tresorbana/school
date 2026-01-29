import prisma from '../src/config/prisma.js';

async function listUsers() {
    console.log('--- Listing Users from DB ---');
    try {
        const users = await prisma.user.findMany({
            select: { email: true, is_active: true }
        });
        console.log('Total Users:', users.length);
        console.log(JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Failed to list users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

listUsers();

import prisma from './src/config/prisma.js';

async function testConnection() {
    console.log('--- Inspecting Database Roles ---');
    try {
        await prisma.$connect();
        const roles = await prisma.role.findMany();
        console.log('Roles in DB:', JSON.stringify(roles, null, 2));

        const userWithRoles = await prisma.user.findFirst({
            include: { roles: { include: { role: true } } }
        });
        console.log('Sample User with Roles:', JSON.stringify(userWithRoles, null, 2));

    } catch (error: any) {
        console.error('❌ DB INSPECTION FAILED:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();

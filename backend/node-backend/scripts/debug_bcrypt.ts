import prisma from '../src/config/prisma.js';
import bcrypt from 'bcryptjs';

async function debugLogin() {
    console.log('--- Debugging Bcrypt Comparison ---');
    try {
        const email = 'admin@build.com';
        const pass = 'password123';

        const user = await prisma.user.findUnique({
            where: { email },
            select: { password: true }
        });

        if (!user) {
            console.error('User not found');
            return;
        }

        console.log('Hashed password found in DB:', user.password);
        const match = await bcrypt.compare(pass, user.password);
        console.log('Bcrypt comparison result:', match);

        // Try hashing again and comparing
        const newHash = await bcrypt.hash(pass, 10);
        console.log('New hash generated:', newHash);
        const matchNew = await bcrypt.compare(pass, newHash);
        console.log('Comparison with new hash:', matchNew);

    } catch (error) {
        console.error('Debug failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugLogin();

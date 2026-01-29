import prisma from '../src/config/prisma.js';
import bcrypt from 'bcryptjs';

async function resetAdmin() {
    console.log('--- Resetting Admin Password ---');
    try {
        const hashedPassword = await bcrypt.hash('password123', 10);
        await prisma.user.update({
            where: { email: 'admin@build.com' },
            data: { password: hashedPassword }
        });
        console.log('Admin password reset to password123 with hash:', hashedPassword);
    } catch (error) {
        console.error('Reset failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetAdmin();

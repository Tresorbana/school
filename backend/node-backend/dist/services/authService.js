import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { NameToCodeMap } from '../config/roleCodes.js';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TOKEN_EXPIRY = '24h';
export class AuthService {
    static async login(email, pass) {
        try {
            const user = await prisma.user.findUnique({
                where: { email, is_active: true },
                include: { roles: { include: { role: true } } },
            });
            if (!user || !(await bcrypt.compare(pass, user.password))) {
                return { status: 'error', message: 'Invalid credentials.' };
            }
            const roleNames = user.roles.map((ur) => ur.role.role_name);
            const roleCodes = roleNames.map((name) => NameToCodeMap[name]).filter(Boolean);
            const token = jwt.sign({
                sub: user.user_id,
                roles: roleCodes,
            }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
            return {
                status: 'success',
                user: {
                    id: user.user_id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                },
                roles: roleNames,
                token,
            };
        }
        catch (error) {
            return { status: 'error', message: `Login failed: ${error.message}` };
        }
    }
    static async signup(firstName, lastName, email, pass) {
        try {
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                return { status: 'error', message: 'Email already registered.' };
            }
            const hashedPassword = await bcrypt.hash(pass, 10);
            // Create user and assign 'inactive' role within a transaction
            const result = await prisma.$transaction(async (tx) => {
                const newUser = await tx.user.create({
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        email,
                        password: hashedPassword,
                    },
                });
                const inactiveRole = await tx.role.findFirst({
                    where: { role_name: 'inactive' },
                });
                if (inactiveRole) {
                    await tx.userRole.create({
                        data: {
                            user_id: newUser.user_id,
                            role_id: inactiveRole.role_id,
                        },
                    });
                }
                // Notify admins
                const adminRole = await tx.role.findFirst({
                    where: { role_name: 'admin' },
                });
                if (adminRole) {
                    const admins = await tx.userRole.findMany({
                        where: { role_id: adminRole.role_id },
                    });
                    await tx.notification.createMany({
                        data: admins.map((admin) => ({
                            target_user: admin.user_id,
                            message: 'New user created! Validate them now',
                        })),
                    });
                }
                return newUser;
            });
            return {
                status: 'success',
                message: 'Signup successful. Waiting for admin approval.',
                user_id: result.user_id,
            };
        }
        catch (error) {
            return { status: 'error', message: `Signup failed: ${error.message}` };
        }
    }
    static async getUserWithRoles(userId) {
        try {
            const user = await prisma.user.findUnique({
                where: { user_id: userId, is_active: true },
                include: { roles: { include: { role: true } } },
            });
            if (!user) {
                return { status: 'error', message: 'User not found' };
            }
            return {
                status: 'success',
                user: {
                    id: user.user_id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    roles: user.roles.map((ur) => ({
                        id: ur.role_id,
                        name: ur.role.role_name,
                    })),
                },
            };
        }
        catch (error) {
            return { status: 'error', message: `Database error: ${error.message}` };
        }
    }
    static async updateProfile(userId, data) {
        try {
            if (data.email) {
                const existing = await prisma.user.findFirst({
                    where: { email: data.email, NOT: { user_id: userId } },
                });
                if (existing) {
                    return { status: 'error', message: 'Email address is already in use by another user' };
                }
            }
            const updateData = {};
            if (data.first_name)
                updateData.first_name = data.first_name;
            if (data.last_name)
                updateData.last_name = data.last_name;
            if (data.email)
                updateData.email = data.email;
            if (data.password)
                updateData.password = await bcrypt.hash(data.password, 10);
            await prisma.user.update({
                where: { user_id: userId },
                data: updateData,
            });
            return { status: 'success', message: 'Profile updated successfully' };
        }
        catch (error) {
            return { status: 'error', message: 'Failed to update profile' };
        }
    }
}

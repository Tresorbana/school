import type { Request, Response, NextFunction } from 'express';
import { NameToCodeMap } from '../config/roleCodes.js';

export const roleMiddleware = (allowedRoles: string[]) => {
    const allowedCodes = allowedRoles.map(name => NameToCodeMap[name]).filter(c => c !== undefined);

    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // Check if user roles (codes from JWT) intersect with allowed codes
        const userRoles = user.roles || [];
        const hasAccess = userRoles.some((role: any) => allowedCodes.includes(role));

        if (!hasAccess) {
            console.warn(`Access denied for user ${user.user_id}. Needed one of ${allowedRoles} (${allowedCodes}), but had ${userRoles}`);
            return res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
        }

        next();
    };
};

export const adminOnly = roleMiddleware(['admin']);
export const teacherOnly = roleMiddleware(['teacher']);
export const staffOnly = roleMiddleware(['admin', 'teacher']);

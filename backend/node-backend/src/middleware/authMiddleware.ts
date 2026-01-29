import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('AuthMiddleware: No Bearer token found in header');
        return res.status(401).json({ status: 'error', message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        console.warn('AuthMiddleware: Token split failed');
        return res.status(401).json({ status: 'error', message: 'No token provided' });
    }

    try {
        const secret = process.env.JWT_SECRET || 'your-secret-key';
        console.log('AuthMiddleware: Verifying with secret EXISTS:', !!process.env.JWT_SECRET, 'length:', secret.length);
        const decoded = jwt.verify(token, secret);
        console.log('AuthMiddleware: SUCCESS. Payload:', decoded);
        (req as any).user = decoded;
        next();
    } catch (error) {
        console.error('AuthMiddleware: FAIL:', (error as Error).message);
        return res.status(401).json({ status: 'error', message: 'Invalid token' });
    }
};

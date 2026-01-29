import type { Request, Response } from 'express';
import { AuthService } from '../services/authService.js';

export class AuthController {
    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ status: 'error', message: 'Email and password are required' });
            }

            const result = await AuthService.login(email, password);

            if (result.status === 'error') {
                return res.status(401).json(result);
            }

            return res.json(result);
        } catch (error: any) {
            console.error('[AuthController.login] Unexpected error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error'
            });
        }
    }

    static async signup(req: Request, res: Response) {
        const { first_name, last_name, email, password } = req.body;
        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({ status: 'error', message: 'All fields are required' });
        }
        const result = await AuthService.signup(first_name, last_name, email, password);
        res.json(result);
    }

    static async me(req: Request, res: Response) {
        console.log('AuthController.me: req.user =', (req as any).user);
        const userId = (req as any).user?.user_id;
        if (!userId) {
            console.warn('AuthController.me: No user_id found in req.user');
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }
        const result = await AuthService.getUserWithRoles(userId);
        if (result.status === 'error') {
            return res.status(404).json({ status: 'error', message: result.message });
        }
        res.json(result);
    }

    static async updateProfile(req: Request, res: Response) {
        const userId = (req as any).user?.user_id;
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }
        const result = await AuthService.updateProfile(userId, req.body);
        res.json(result);
    }
}

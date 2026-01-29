import { AuthService } from '../services/authService.js';
export class AuthController {
    static async login(req, res) {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ status: 'error', message: 'Email and password are required' });
        }
        const result = await AuthService.login(email, password);
        res.json(result);
    }
    static async signup(req, res) {
        const { first_name, last_name, email, password } = req.body;
        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({ status: 'error', message: 'All fields are required' });
        }
        const result = await AuthService.signup(first_name, last_name, email, password);
        res.json(result);
    }
    static async me(req, res) {
        const userId = req.user?.sub;
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }
        const result = await AuthService.getUserWithRoles(userId);
        if (result.status === 'error') {
            return res.status(404).json({ status: 'error', message: result.message });
        }
        res.json(result);
    }
    static async updateProfile(req, res) {
        const userId = req.user?.sub;
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }
        const result = await AuthService.updateProfile(userId, req.body);
        res.json(result);
    }
}

import type { Request, Response } from 'express';
import { IntakeService } from '../services/intakeService.js';

export class IntakeController {
    static async index(req: Request, res: Response) {
        try {
            const intakes = await IntakeService.getAllIntakes();
            res.json({ success: true, data: intakes });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async show(req: Request, res: Response) {
        try {
            const intake = await IntakeService.getIntakeById(req.params.id as string);
            if (!intake) {
                return res.status(404).json({ success: false, message: 'Intake not found' });
            }
            res.json({ success: true, data: intake });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const intake = await IntakeService.createIntake(req.body);
            res.status(201).json({ success: true, data: intake });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const intake = await IntakeService.updateIntake(req.params.id as string, req.body);
            res.json({ success: true, data: intake });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }

    static async promote(req: Request, res: Response) {
        try {
            const intake = await IntakeService.promoteIntake(req.params.id as string);
            res.json({ success: true, data: intake });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }

    static async toggleStatus(req: Request, res: Response) {
        try {
            const { is_active } = req.body;
            const intake = await IntakeService.setStatus(req.params.id as string, !!is_active);
            res.json({ success: true, data: intake });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            await IntakeService.deleteIntake(req.params.id as string);
            res.json({ success: true, message: 'Intake deleted successfully' });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }
}

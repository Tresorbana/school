import type { Request, Response } from 'express';
import { DeliberationService } from '../services/deliberationService.js';

export class DeliberationController {
    static async createRule(req: Request, res: Response) {
        try {
            const rule = await DeliberationService.createRule(req.body);
            res.status(201).json({ success: true, data: rule });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }

    static async getRules(req: Request, res: Response) {
        try {
            const rules = await DeliberationService.getRules();
            res.json({ success: true, data: rules });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async getGrade(req: Request, res: Response) {
        try {
            const { score } = (req as any).query;
            if (!score) return res.status(400).json({ success: false, message: 'Score is required' });
            const grade = await DeliberationService.getGradeForScore(parseFloat(String(score)));
            res.json({ success: true, data: grade });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async generateReport(req: Request, res: Response) {
        try {
            const { studentId } = req.params;
            const query = req.query as unknown as { year: string, term: string };
            const { year, term } = query;
            if (!year || !term) return res.status(400).json({ success: false, message: 'Year and term are required' });
            if (!studentId) return res.status(400).json({ success: false, message: 'Student ID is required' });

            const report = await DeliberationService.generateStudentReport(
                String(studentId),
                parseInt(String(year)),
                parseInt(String(term))
            );
            res.json({ success: true, data: report });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }
}

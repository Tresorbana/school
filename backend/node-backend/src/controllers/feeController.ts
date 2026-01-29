import type { Request, Response } from 'express';
import { FeeService } from '../services/feeService.js';

export class FeeController {
    static async recordPayment(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.user_id;
            const payment = await FeeService.recordPayment({
                ...req.body,
                received_by: userId
            });
            res.status(201).json({ success: true, data: payment });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }

    static async getStudentPayments(req: Request, res: Response) {
        try {
            const { studentId } = req.params;
            const payments = await FeeService.getStudentPayments(String(studentId));
            res.json({ success: true, data: payments });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async getFeeSummary(req: Request, res: Response) {
        try {
            const { academic_year, term } = req.query as any;
            const summary = await FeeService.getFeeSummary(
                academic_year ? parseInt(String(academic_year)) : undefined,
                term ? parseInt(String(term)) : undefined
            );
            res.json({ success: true, data: summary });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async getDefaulters(req: Request, res: Response) {
        try {
            const { academic_year, term, target } = req.query as any;
            if (!academic_year || !term || !target) {
                return res.status(400).json({ success: false, message: 'Missing parameters: academic_year, term, target' });
            }
            const defaulters = await FeeService.getDefaulters(
                parseInt(String(academic_year)),
                parseInt(String(term)),
                parseFloat(String(target))
            );
            res.json({ success: true, data: defaulters });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }
}

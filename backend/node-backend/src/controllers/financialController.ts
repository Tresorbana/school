import type { Request, Response } from 'express';
import { FinancialService } from '../services/financialService.js';

export class FinancialController {
    static async recordTransaction(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.user_id;
            const transaction = await FinancialService.recordTransaction({
                ...req.body,
                created_by: userId
            });
            res.status(201).json({ success: true, data: transaction });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }

    static async getFinancialSummary(req: Request, res: Response) {
        try {
            const { start, end } = (req as any).query;
            const summary = await FinancialService.getFinancialSummary(
                start ? new Date(String(start)) : undefined,
                end ? new Date(String(end)) : undefined
            );
            res.json({ success: true, data: summary });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async getTransactions(req: Request, res: Response) {
        try {
            const { type, limit } = (req as any).query;
            const transactions = await FinancialService.getTransactions(
                type as any, // Bypass TransactionType import issue
                limit ? parseInt(String(limit)) : undefined
            );
            res.json({ success: true, data: transactions });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }
}

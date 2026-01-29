import type { Request, Response } from 'express';
import { ReportService } from '../services/reportService.js';

export class ReportController {

    static async getOverview(req: Request, res: Response) {
        try {
            const dateStr = req.query.date as string | undefined;
            const date = dateStr ? new Date(dateStr) : new Date();
            const result = await ReportService.getAttendanceOverview(date);
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async getByClass(req: Request, res: Response) {
        try {
            const { date } = req.query as any;
            const targetDate = date ? new Date(date) : new Date();
            const result = await ReportService.getClassAttendanceStats(targetDate);
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }


    static async getTopAbsent(req: Request, res: Response) {
        try {
            const { start_date, end_date, limit } = req.query as any;
            if (!start_date || !end_date) {
                return res.status(400).json({ success: false, message: 'start_date and end_date required' });
            }
            const result = await ReportService.getTopAbsentStudents(
                new Date(String(start_date)),
                new Date(String(end_date)),
                limit ? Number(limit) : 10
            );
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async getStudentDetails(req: Request, res: Response) {
        try {
            const { student_id, start_date, end_date } = req.query as any;
            if (!student_id || !start_date || !end_date) {
                return res.status(400).json({ success: false, message: 'student_id, start_date and end_date required' });
            }
            const result = await ReportService.getStudentAttendanceDetails(
                String(student_id),
                new Date(String(start_date)),
                new Date(String(end_date))
            );
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }
}

import type { Request, Response } from 'express';
import { AttendanceService } from '../services/attendanceService.js';

export class AttendanceController {
    static async submitCourse(req: Request, res: Response) {
        try {
            const { roster_id, attendance } = req.body;
            const userId = (req as any).user.user_id; // From auth middleware
            const result = await AttendanceService.submitCourseAttendance(roster_id as string, attendance, userId);
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }

    static async getByClassAndDate(req: Request, res: Response) {
        try {
            const { classId } = req.params;
            const dateStr = req.query.date as string | undefined;
            const date = new Date(dateStr || new Date().toISOString());
            const records = await AttendanceService.getAttendanceByClassAndDate(classId as string, date);
            res.json({ success: true, data: records });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async requestPermission(req: Request, res: Response) {
        try {
            const teacherId = (req as any).user.user_id;
            const result = await AttendanceService.requestPermission({ ...req.body, teacher_id: teacherId });
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }

    static async approvePermission(req: Request, res: Response) {
        try {
            const adminId = (req as any).user.user_id;
            const { requestId } = req.params;
            const { comments } = req.body;
            const result = await AttendanceService.approvePermission(requestId as string, adminId, comments);
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }

    static async getPermissionRequests(req: Request, res: Response) {
        try {
            const result = await AttendanceService.getPermissionRequests();
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async getAllRecords(req: Request, res: Response) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
            const result = await AttendanceService.getAllRecords(limit);
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async getStatus(req: Request, res: Response) {

        try {
            const { rosterId } = req.params;
            const dateStr = req.query.date as string | undefined;
            const date = new Date(dateStr || new Date().toISOString());
            const status = await AttendanceService.getPeriodStatus(rosterId as string, date);
            res.json({ success: true, data: { status } });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }
}

import type { Request, Response } from 'express';
import { DashboardService } from '../services/dashboardService.js';

export class DashboardController {

    static async getDashboard(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            const roles = user.roles || [];

            let data;
            if (roles.includes('admin')) {
                data = await DashboardService.getAdminDashboard();
            } else if (roles.includes('teacher')) {
                data = await DashboardService.getTeacherDashboard(user.user_id);
            } else {
                return res.status(403).json({ success: false, message: 'Access denied: Unknown role for dashboard' });
            }

            res.json({ success: true, data });

        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async getSelfStudyStatus(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

            const status = await DashboardService.getSelfStudyStatus(user.user_id);
            res.json({ success: true, data: status });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async getAbsentStudents(req: Request, res: Response) {
        try {
            const data = await DashboardService.getAbsentStudents();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async getSickStudents(req: Request, res: Response) {
        try {
            const data = await DashboardService.getSickStudents();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async getClasses(req: Request, res: Response) {
        try {
            const data = await DashboardService.getAllClasses();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async getTimetablePeriods(req: Request, res: Response) {
        try {
            const { class_id, date } = req.body;
            const data = await DashboardService.getTimetablePeriods(class_id, new Date(date));
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async getAttendanceGraph(req: Request, res: Response) {
        try {
            const { class_id, period_id, date } = req.body;
            const data = await DashboardService.getAttendanceGraph(class_id, period_id, new Date(date));
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async getSelfStudyAttendance(req: Request, res: Response) {
        try {
            const { class_id, date, period } = req.body;
            const data = await DashboardService.getSelfStudyAttendance(class_id, new Date(date), period);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async getAllAbsentStudents(req: Request, res: Response) {
        try {
            const data = await DashboardService.getAllAbsentStudents();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async getAdminDashboard(req: Request, res: Response) {
        try {
            const data = await DashboardService.getAdminDashboard();
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async getPeriodRecordingStatus(req: Request, res: Response) {
        try {
            const date = req.query.date ? new Date(req.query.date as string) : new Date();
            const data = await DashboardService.getPeriodRecordingStatus(date);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async getSelfStudyPerformance(req: Request, res: Response) {
        try {
            const { class_id, start_date, end_date } = req.query;
            if (!class_id) return res.status(400).json({ success: false, message: 'class_id is required' });

            const data = await DashboardService.getSelfStudyPerformance(
                class_id as string,
                new Date(start_date as string),
                new Date(end_date as string)
            );
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async getAttendanceTrends(req: Request, res: Response) {
        try {
            const { class_id } = req.query;
            if (!class_id) return res.status(400).json({ success: false, message: 'class_id is required' });

            const data = await DashboardService.getAttendanceTrends(class_id as string);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async getTeacherReportStats(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

            const data = await DashboardService.getTeacherReportStats(user.user_id);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async getRecentActions(req: Request, res: Response) {
        try {
            const { limit } = req.query;
            const data = await DashboardService.getRecentActions(limit ? Number(limit) : 10);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async getHealthStatisticsByClass(req: Request, res: Response) {
        try {
            const { class_id } = req.body;
            // Stub implementation
            res.json({ success: true, data: { healthy: 0, sick: 0, total: 0 } });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }
}

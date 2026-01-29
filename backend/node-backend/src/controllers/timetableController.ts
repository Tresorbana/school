import type { Request, Response } from 'express';
import { TimetableService } from '../services/timetableService.js';

export class TimetableController {
    static async create(req: Request, res: Response) {
        try {
            const { academic_year, class_id, term } = req.body;
            const timetable = await TimetableService.createTimetable(academic_year as string, class_id as string, parseInt(term as string));
            res.status(201).json({ success: true, data: timetable });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }

    static async assignSlot(req: Request, res: Response) {
        try {
            const { roster_id, assignment_id } = req.body;
            const result = await TimetableService.assignSlot(roster_id as string, assignment_id as string);
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }

    static async activate(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const result = await TimetableService.activateTimetable(id as string);
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }

    static async getClassTimetable(req: Request, res: Response) {
        try {
            const { classId } = req.params;
            const result = await TimetableService.getClassTimetable(classId as string);
            if (!result) {
                return res.status(404).json({ success: false, message: 'Active timetable not found for this class' });
            }
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async getTeacherSchedule(req: Request, res: Response) {
        try {
            const teacherId = (req as any).user.user_id;
            const schedule = await TimetableService.getTeacherTodaySchedule(teacherId);
            res.json({ success: true, data: schedule });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }
}

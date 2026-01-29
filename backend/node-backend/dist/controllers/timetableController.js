import { TimetableService } from '../services/timetableService.js';
export class TimetableController {
    static async create(req, res) {
        try {
            const { academic_year, class_id, term } = req.body;
            const timetable = await TimetableService.createTimetable(academic_year, class_id, parseInt(term));
            res.status(201).json({ success: true, data: timetable });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async assignSlot(req, res) {
        try {
            const { roster_id, assignment_id } = req.body;
            const result = await TimetableService.assignSlot(roster_id, assignment_id);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async activate(req, res) {
        try {
            const { id } = req.params;
            const result = await TimetableService.activateTimetable(id);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async getClassTimetable(req, res) {
        try {
            const { classId } = req.params;
            const result = await TimetableService.getClassTimetable(classId);
            if (!result) {
                return res.status(404).json({ success: false, message: 'Active timetable not found for this class' });
            }
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getTeacherSchedule(req, res) {
        try {
            const teacherId = req.user.id;
            const schedule = await TimetableService.getTeacherTodaySchedule(teacherId);
            res.json({ success: true, data: schedule });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

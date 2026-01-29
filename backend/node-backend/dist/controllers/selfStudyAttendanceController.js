import { SelfStudyAttendanceService } from '../services/selfStudyAttendanceService.js';
export class SelfStudyAttendanceController {
    static async createSession(req, res) {
        try {
            const userId = req.user.id;
            const { class_id, period, attendance_date, notes } = req.body;
            const result = await SelfStudyAttendanceService.createAttendanceSession(class_id, period, attendance_date, notes, userId);
            res.status(201).json({ success: true, data: result });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async submitAttendance(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const { absent_students } = req.body;
            const result = await SelfStudyAttendanceService.submitAttendance(id, absent_students, userId);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async getSessions(req, res) {
        try {
            const { class_id, period, created_by, date_from, date_to, limit, offset } = req.query;
            const filters = {};
            if (class_id)
                filters.classId = class_id;
            if (period)
                filters.period = period;
            if (created_by)
                filters.createdBy = created_by;
            if (date_from)
                filters.dateFrom = new Date(date_from);
            if (date_to)
                filters.dateTo = new Date(date_to);
            const result = await SelfStudyAttendanceService.getAttendanceSessions(filters, limit ? Number(limit) : undefined, offset ? Number(offset) : undefined);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async deleteSession(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            await SelfStudyAttendanceService.deleteSession(id, userId);
            res.json({ success: true, message: 'Session deleted' });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

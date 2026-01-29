import { AttendanceService } from '../services/attendanceService.js';
export class AttendanceController {
    static async submitCourse(req, res) {
        try {
            const { roster_id, attendance } = req.body;
            const userId = req.user.id; // From auth middleware
            const result = await AttendanceService.submitCourseAttendance(roster_id, attendance, userId);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async getByClassAndDate(req, res) {
        try {
            const { classId } = req.params;
            const dateStr = req.query.date;
            const date = new Date(dateStr || new Date().toISOString());
            const records = await AttendanceService.getAttendanceByClassAndDate(classId, date);
            res.json({ success: true, data: records });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async requestPermission(req, res) {
        try {
            const teacherId = req.user.id;
            const result = await AttendanceService.requestPermission({ ...req.body, teacher_id: teacherId });
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async approvePermission(req, res) {
        try {
            const adminId = req.user.id;
            const { requestId } = req.params;
            const { comments } = req.body;
            const result = await AttendanceService.approvePermission(requestId, adminId, comments);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async getStatus(req, res) {
        try {
            const { rosterId } = req.params;
            const dateStr = req.query.date;
            const date = new Date(dateStr || new Date().toISOString());
            const status = await AttendanceService.getPeriodStatus(rosterId, date);
            res.json({ success: true, data: { status } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

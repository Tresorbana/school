import { ReportService } from '../services/reportService.js';
export class ReportController {
    static async getOverview(req, res) {
        try {
            const date = req.query.date ? new Date(req.query.date) : new Date();
            const result = await ReportService.getAttendanceOverview(date);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getByClass(req, res) {
        try {
            const { start_date, end_date } = req.query;
            if (!start_date || !end_date) {
                return res.status(400).json({ success: false, message: 'start_date and end_date required' });
            }
            const result = await ReportService.getAttendanceByClass(new Date(start_date), new Date(end_date));
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getHealthStats(req, res) {
        try {
            const { start_date, end_date } = req.query;
            if (!start_date || !end_date) {
                return res.status(400).json({ success: false, message: 'start_date and end_date required' });
            }
            const result = await ReportService.getHealthStatistics(new Date(start_date), new Date(end_date));
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getTopAbsent(req, res) {
        try {
            const { start_date, end_date, limit } = req.query;
            if (!start_date || !end_date) {
                return res.status(400).json({ success: false, message: 'start_date and end_date required' });
            }
            const result = await ReportService.getTopAbsentStudents(new Date(start_date), new Date(end_date), limit ? Number(limit) : 10);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getStudentDetails(req, res) {
        try {
            const { student_id, start_date, end_date } = req.query;
            if (!student_id || !start_date || !end_date) {
                return res.status(400).json({ success: false, message: 'student_id, start_date and end_date required' });
            }
            const result = await ReportService.getStudentAttendanceDetails(student_id, new Date(start_date), new Date(end_date));
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

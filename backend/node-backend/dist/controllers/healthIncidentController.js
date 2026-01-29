import { HealthIncidentService } from '../services/healthIncidentService.js';
import { IncidentType } from '@prisma/client';
export class HealthIncidentController {
    static async recordSickness(req, res) {
        try {
            const { student_id, illness, notes } = req.body;
            const userId = req.user.id;
            const result = await HealthIncidentService.recordSickness(student_id, illness, notes, userId);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async markHealed(req, res) {
        try {
            const { student_id, notes } = req.body;
            const userId = req.user.id;
            const result = await HealthIncidentService.markHealed(student_id, notes, userId);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async logIncident(req, res) {
        try {
            const { student_id, incident_type, notes } = req.body;
            const userId = req.user.id;
            // Validate incident type
            if (!Object.values(IncidentType).includes(incident_type)) {
                return res.status(400).json({ success: false, message: 'Invalid incident type' });
            }
            const result = await HealthIncidentService.logIncident(student_id, incident_type, notes, userId);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async getIncidents(req, res) {
        try {
            const { studentId, date, limit } = req.query;
            const filters = {};
            if (studentId)
                filters.studentId = studentId;
            if (date)
                filters.date = new Date(date);
            const result = await HealthIncidentService.getIncidents(filters, limit ? Number(limit) : undefined);
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

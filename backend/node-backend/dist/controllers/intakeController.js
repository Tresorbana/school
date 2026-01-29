import { IntakeService } from '../services/intakeService.js';
export class IntakeController {
    static async index(req, res) {
        try {
            const intakes = await IntakeService.getAllIntakes();
            res.json({ success: true, data: intakes });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async show(req, res) {
        try {
            const intake = await IntakeService.getIntakeById(req.params.id);
            if (!intake) {
                return res.status(404).json({ success: false, message: 'Intake not found' });
            }
            res.json({ success: true, data: intake });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async create(req, res) {
        try {
            const intake = await IntakeService.createIntake(req.body);
            res.status(201).json({ success: true, data: intake });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async update(req, res) {
        try {
            const intake = await IntakeService.updateIntake(req.params.id, req.body);
            res.json({ success: true, data: intake });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async promote(req, res) {
        try {
            const intake = await IntakeService.promoteIntake(req.params.id);
            res.json({ success: true, data: intake });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async toggleStatus(req, res) {
        try {
            const { is_active } = req.body;
            const intake = await IntakeService.setStatus(req.params.id, !!is_active);
            res.json({ success: true, data: intake });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async delete(req, res) {
        try {
            await IntakeService.deleteIntake(req.params.id);
            res.json({ success: true, message: 'Intake deleted successfully' });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

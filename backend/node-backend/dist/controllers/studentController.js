import { StudentService } from '../services/studentService.js';
export class StudentController {
    static async index(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const search = req.query.search || '';
            const sortBy = req.query.sort_by || 'first_name';
            const sortOrder = req.query.sort_order?.toLowerCase() === 'desc' ? 'desc' : 'asc';
            const filters = {};
            if (req.query.class_id)
                filters.class_id = req.query.class_id;
            if (req.query.intake_id)
                filters.intake_id = req.query.intake_id;
            const result = await StudentService.getAllStudents({
                page,
                limit,
                search,
                sortBy,
                sortOrder: sortOrder,
                filters,
            });
            res.json({ success: true, ...result });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async create(req, res) {
        try {
            const student = await StudentService.createStudent(req.body);
            res.json({ success: true, data: student });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async show(req, res) {
        try {
            const student = await StudentService.getStudentById(req.params.id);
            if (!student) {
                return res.status(404).json({ success: false, message: 'Student not found' });
            }
            res.json({ success: true, data: student });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async update(req, res) {
        try {
            const student = await StudentService.updateStudent(req.params.id, req.body);
            res.json({ success: true, data: student });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async assignToClass(req, res) {
        try {
            const { student_ids, class_id } = req.body;
            const count = await StudentService.assignToClass(student_ids, class_id);
            res.json({ success: true, message: `Successfully assigned ${count} students`, count });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

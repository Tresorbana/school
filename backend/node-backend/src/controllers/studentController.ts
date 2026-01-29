import type { Request, Response } from 'express';
import { StudentService } from '../services/studentService.js';

export class StudentController {
    static async index(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const search = (req.query.search as string) || '';
            const sortBy = (req.query.sort_by as string) || 'first_name';
            const sortOrder = (req.query.sort_order as string)?.toLowerCase() === 'desc' ? 'desc' : 'asc';

            const filters: any = {};
            if (req.query.class_id) filters.class_id = req.query.class_id;
            if (req.query.intake_id) filters.intake_id = req.query.intake_id;

            const result = await StudentService.getAllStudents({
                page,
                limit,
                search,
                sortBy,
                sortOrder: sortOrder as 'asc' | 'desc',
                filters,
            });

            res.json({ success: true, ...result });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const student = await StudentService.createStudent(req.body);
            res.json({ success: true, data: student });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }

    static async show(req: Request, res: Response) {
        try {
            const student = await StudentService.getStudentById(req.params.id as string);
            if (!student) {
                return res.status(404).json({ success: false, message: 'Student not found' });
            }
            res.json({ success: true, data: student });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const student = await StudentService.updateStudent(req.params.id as string, req.body);
            res.json({ success: true, data: student });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }

    static async assignToClass(req: Request, res: Response) {
        try {
            const { student_ids, class_id } = req.body;
            const count = await StudentService.assignToClass(student_ids, class_id);
            res.json({ success: true, message: `Successfully assigned ${count} students`, count });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }
}

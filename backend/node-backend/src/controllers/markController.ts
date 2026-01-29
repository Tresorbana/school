import type { Request, Response } from 'express';
import { MarkService } from '../services/markService.js';

export class MarkController {
    static async bulkUpsert(req: Request, res: Response) {
        try {
            const { academic_year, term, course_id, marks } = req.body;
            const teacher_id = (req as any).user.user_id;

            if (!academic_year || !term || !course_id || !Array.isArray(marks)) {
                return res.status(400).json({ success: false, message: 'Invalid data' });
            }

            const results = await Promise.all(marks.map(m =>
                MarkService.upsertMark({
                    student_id: m.student_id,
                    course_id,
                    teacher_id,
                    score: m.score,
                    academic_year,
                    term,
                    comments: m.comments
                })
            ));

            res.json({ success: true, data: results });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async getByClass(req: Request, res: Response) {
        try {
            const { class_id, academic_year, term } = req.query as any;
            if (!class_id || !academic_year || !term) {
                return res.status(400).json({ success: false, message: 'Missing parameters' });
            }

            const results = await MarkService.getMarksByClass(class_id, Number(academic_year), Number(term));
            res.json({ success: true, data: results });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async getStudentMarks(req: Request, res: Response) {
        try {
            const { student_id, academic_year } = req.query as any;
            if (!student_id || !academic_year) {
                return res.status(400).json({ success: false, message: 'Missing parameters' });
            }

            const results = await MarkService.getStudentMarks(student_id, Number(academic_year));
            res.json({ success: true, data: results });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }
}

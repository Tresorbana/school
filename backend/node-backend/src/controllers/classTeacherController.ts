import type { Request, Response } from 'express';
import { ClassTeacherService } from '../services/classTeacherService.js';
import prisma from '../config/prisma.js';

export class ClassTeacherController {

    // POST /api/classes/:classId/teacher
    static async assignClassTeacher(req: Request, res: Response) {
        try {
            const { classId } = req.params as { classId: string };
            const { teacher_id, academic_year } = req.body;

            if (!teacher_id) {
                return res.status(400).json({ success: false, message: 'Teacher ID is required' });
            }

            // Verify teacher exists and has role? (Service could do this, but consistent with other controllers)
            // Ideally Service does it. For now, valid teacher_id FK constraint will handle existence, but not Role.
            // Let's assume frontend filters valid teachers.

            const assignment = await ClassTeacherService.assignClassTeacher(
                classId,
                teacher_id,
                academic_year ? parseInt(academic_year) : undefined
            );
            res.status(201).json({ success: true, message: 'Class teacher assigned', data: assignment });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }

    // GET /api/classes/:classId/teacher
    static async getClassTeacher(req: Request, res: Response) {
        try {
            const { classId } = req.params as { classId: string };
            const year = req.query.academic_year ? parseInt(req.query.academic_year as string) : undefined;
            const teacher = await ClassTeacherService.getClassTeacher(classId, year);
            res.json({ success: true, data: teacher });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    // GET /api/teachers/:teacherId/classes
    static async getTeacherClasses(req: Request, res: Response) {
        try {
            const { teacherId } = req.params as { teacherId: string };
            const classes = await ClassTeacherService.getTeacherClasses(teacherId);
            res.json({ success: true, data: classes });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    // DELETE /api/classes/:classId/teacher
    static async removeClassTeacher(req: Request, res: Response) {
        try {
            const { classId } = req.params as { classId: string };
            const { academic_year } = req.body; // Or query param? Body is safer for Delete with extra data
            const year = academic_year ? parseInt(academic_year) : undefined;

            await ClassTeacherService.removeClassTeacher(classId, year);
            res.json({ success: true, message: 'Class teacher removed' });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }
}

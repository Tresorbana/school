import type { Request, Response } from 'express';
import { CourseAssignmentService } from '../services/courseAssignmentService.js';
import prisma from '../config/prisma.js';

export class CourseAssignmentController {

    // POST /api/classes/:classId/courses
    static async assignCourse(req: Request, res: Response) {
        try {
            const { classId } = req.params as { classId: string };
            const { course_id, teacher_id } = req.body;

            if (!course_id) {
                return res.status(400).json({ success: false, message: 'Course ID is required' });
            }

            const assignment = await CourseAssignmentService.assignCourseToClass(classId, course_id, teacher_id);
            res.status(201).json({ success: true, message: 'Course assigned successfully', data: assignment });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }

    // POST /api/classes/:classId/courses/bulk
    static async assignMultipleCourses(req: Request, res: Response) {
        try {
            const { classId } = req.params as { classId: string };
            const { assignments } = req.body; // Expect array of { course_id, teacher_id? }

            if (!Array.isArray(assignments)) {
                return res.status(400).json({ success: false, message: 'Assignments must be an array' });
            }

            const results = await CourseAssignmentService.assignMultipleCourses(classId, assignments);
            res.status(201).json({ success: true, message: `Created ${results.length} assignments`, data: results });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }

    // DELETE /api/classes/:classId/courses/:courseId
    static async removeCourse(req: Request, res: Response) {
        try {
            const { classId, courseId } = req.params as { classId: string, courseId: string };
            await CourseAssignmentService.removeCourseFromClass(classId, courseId);
            res.json({ success: true, message: 'Course removed from class' });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }

    // GET /api/classes/:classId/courses
    static async getClassCourses(req: Request, res: Response) {
        try {
            const { classId } = req.params as { classId: string };
            const courses = await CourseAssignmentService.getClassCourses(classId);
            res.json({ success: true, data: courses });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }

    // GET /api/classes/:classId/courses/available
    static async getAvailableCourses(req: Request, res: Response) {
        try {
            const { classId } = req.params as { classId: string };
            const classInfo = await prisma.class.findUnique({ where: { class_id: classId } });
            if (!classInfo) return res.status(404).json({ success: false, message: 'Class not found' });

            const courses = await CourseAssignmentService.getAvailableCourses(classId, classInfo.year_level);
            res.json({ success: true, data: courses });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }

    // PUT /api/classes/:classId/courses/:courseId/teacher
    static async assignTeacher(req: Request, res: Response) {
        try {
            const { classId, courseId } = req.params as { classId: string, courseId: string };
            const { teacher_id } = req.body;

            if (!teacher_id) {
                return res.status(400).json({ success: false, message: 'Teacher ID is required' });
            }

            const updated = await CourseAssignmentService.assignTeacher(classId, courseId, teacher_id);
            res.json({ success: true, message: 'Teacher assigned successfully', data: updated });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }

    // DELETE /api/classes/:classId/courses/:courseId/teacher
    static async removeTeacher(req: Request, res: Response) {
        try {
            const { classId, courseId } = req.params as { classId: string, courseId: string };
            await CourseAssignmentService.removeTeacher(classId, courseId);
            res.json({ success: true, message: 'Teacher removed from course' });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }

    // GET /api/teachers/:teacherId/assignments
    static async getTeacherAssignments(req: Request, res: Response) {
        try {
            const { teacherId } = req.params as { teacherId: string };
            const assignments = await CourseAssignmentService.getTeacherAssignments(teacherId);
            res.json({ success: true, data: assignments });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }
}

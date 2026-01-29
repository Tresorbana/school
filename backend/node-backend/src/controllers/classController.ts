import type { Request, Response } from 'express';
import { ClassService } from '../services/classService.js';

export class ClassController {
    static async index(req: Request, res: Response) {
        try {
            const withCourses = req.query.with_courses === 'true';
            const classes = await ClassService.getAllClasses(withCourses);
            res.json({ success: true, data: classes });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async show(req: Request, res: Response) {
        try {
            const classData = await ClassService.getClassById(req.params.id as string);
            if (!classData) {
                return res.status(404).json({ success: false, message: 'Class not found' });
            }
            res.json({ success: true, data: classData });
        } catch (error) {
            res.status(500).json({ success: false, message: (error as Error).message });
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const { class_name, year_level } = req.body;
            const classData = await ClassService.createClass({ class_name, year_level: parseInt(year_level) });
            res.status(201).json({ success: true, data: classData });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const classData = await ClassService.updateClass(req.params.id as string, req.body);
            res.json({ success: true, data: classData });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            await ClassService.deleteClass(req.params.id as string);
            res.json({ success: true, message: 'Class deleted successfully' });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }

    static async getByYearLevel(req: Request, res: Response) {
        try {
            const yearLevel = parseInt(req.params.yearLevel as string);
            const classes = await ClassService.getClassesByYearLevel(yearLevel);
            res.json({ success: true, data: classes });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }
}

import { CourseService } from '../services/courseService.js';
export class CourseController {
    static async index(req, res) {
        try {
            const courses = await CourseService.getAllCourses();
            res.json({ success: true, data: courses });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async show(req, res) {
        try {
            const course = await CourseService.getCourseById(req.params.id);
            if (!course) {
                return res.status(404).json({ success: false, message: 'Course not found' });
            }
            res.json({ success: true, data: course });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async create(req, res) {
        try {
            const { course_name, year_level } = req.body;
            const course = await CourseService.createCourse({ course_name, year_level: parseInt(year_level) });
            res.status(201).json({ success: true, data: course });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async update(req, res) {
        try {
            const course = await CourseService.updateCourse(req.params.id, req.body);
            res.json({ success: true, data: course });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async assignTeacher(req, res) {
        try {
            const { course_id, class_id, teacher_id } = req.body;
            const assignment = await CourseService.assignTeacher(course_id, class_id, teacher_id);
            res.json({ success: true, data: assignment });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async getTeacherCourses(req, res) {
        try {
            const courses = await CourseService.getTeacherCourses(req.params.teacherId);
            res.json({ success: true, data: courses });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async stats(req, res) {
        try {
            const stats = await CourseService.getCourseStats();
            res.json({ success: true, data: stats });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

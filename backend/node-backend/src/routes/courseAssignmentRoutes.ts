import { Router } from 'express';
import { CourseAssignmentController } from '../controllers/courseAssignmentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all routes
router.use(authMiddleware);

// Class Course Assignments
router.post('/classes/:classId/courses', CourseAssignmentController.assignCourse);
router.post('/classes/:classId/courses/bulk', CourseAssignmentController.assignMultipleCourses);
router.get('/classes/:classId/courses', CourseAssignmentController.getClassCourses);
router.delete('/classes/:classId/courses/:courseId', CourseAssignmentController.removeCourse);
router.get('/classes/:classId/courses/available', CourseAssignmentController.getAvailableCourses);

// Teacher Assignments within a Class Course
router.put('/classes/:classId/courses/:courseId/teacher', CourseAssignmentController.assignTeacher);
router.delete('/classes/:classId/courses/:courseId/teacher', CourseAssignmentController.removeTeacher);

// Teacher's view
router.get('/teachers/:teacherId/assignments', CourseAssignmentController.getTeacherAssignments);

export default router;

import { Router } from 'express';
import { ClassTeacherController } from '../controllers/classTeacherController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/classes/:classId/teacher', ClassTeacherController.assignClassTeacher);
router.get('/classes/:classId/teacher', ClassTeacherController.getClassTeacher);
router.delete('/classes/:classId/teacher', ClassTeacherController.removeClassTeacher);

router.get('/teachers/:teacherId/classes', ClassTeacherController.getTeacherClasses);

export default router;

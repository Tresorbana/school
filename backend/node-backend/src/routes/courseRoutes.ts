import { Router } from 'express';
import { CourseController } from '../controllers/courseController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', CourseController.index);
router.get('/stats', CourseController.stats);
router.get('/:id', CourseController.show);
router.post('/', CourseController.create);
router.put('/:id', CourseController.update);
router.post('/assign-teacher', CourseController.assignTeacher);
router.get('/teacher/:teacherId', CourseController.getTeacherCourses);

export default router;

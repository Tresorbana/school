import { Router } from 'express';
import { TimetableController } from '../controllers/timetableController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/', TimetableController.create);
router.post('/assign', TimetableController.assignSlot);
router.post('/:id/activate', TimetableController.activate);
router.get('/class/:classId', TimetableController.getClassTimetable);
router.get('/teacher/today', TimetableController.getTeacherSchedule);

export default router;

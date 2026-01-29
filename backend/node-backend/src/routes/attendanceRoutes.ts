import { Router } from 'express';
import { AttendanceController } from '../controllers/attendanceController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/submit', AttendanceController.submitCourse);
router.get('/class/:classId', AttendanceController.getByClassAndDate);
router.post('/permission', AttendanceController.requestPermission);
router.post('/permission/:requestId/approve', AttendanceController.approvePermission);
router.get('/status/:rosterId', AttendanceController.getStatus);

export default router;

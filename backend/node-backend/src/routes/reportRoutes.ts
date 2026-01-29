import { Router } from 'express';
import { ReportController } from '../controllers/reportController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/overview', ReportController.getOverview);
router.get('/by-class', ReportController.getByClass);
router.get('/top-absent', ReportController.getTopAbsent);
router.get('/student-details', ReportController.getStudentDetails);

export default router;

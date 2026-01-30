import { Router } from 'express';
import { FeeController } from '../controllers/feeController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { staffOnly, adminOnly } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/payment', staffOnly, FeeController.recordPayment);
router.get('/student/:studentId', staffOnly, FeeController.getStudentPayments);
router.get('/summary', adminOnly, FeeController.getFeeSummary);
router.get('/transactions/recent', adminOnly, FeeController.getRecentTransactions);
router.get('/defaulters', adminOnly, FeeController.getDefaulters);

export default router;

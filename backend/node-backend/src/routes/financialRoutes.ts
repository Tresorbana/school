import { Router } from 'express';
import { FinancialController } from '../controllers/financialController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/transaction', adminOnly, FinancialController.recordTransaction);
router.get('/summary', adminOnly, FinancialController.getFinancialSummary);
router.get('/transactions', adminOnly, FinancialController.getTransactions);

export default router;

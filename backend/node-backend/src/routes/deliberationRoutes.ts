import { Router } from 'express';
import { DeliberationController } from '../controllers/deliberationController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminOnly, staffOnly } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/rules', adminOnly, DeliberationController.createRule);
router.get('/rules', staffOnly, DeliberationController.getRules);
router.get('/grade', staffOnly, DeliberationController.getGrade);
router.get('/report/:studentId', staffOnly, DeliberationController.generateReport);

export default router;

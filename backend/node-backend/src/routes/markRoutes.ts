import { Router } from 'express';
import { MarkController } from '../controllers/markController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { staffOnly } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/bulk', staffOnly, MarkController.bulkUpsert);
router.get('/class', staffOnly, MarkController.getByClass);
router.get('/student', MarkController.getStudentMarks);

export default router;

import { Router } from 'express';
import { HealthController } from '../controllers/healthController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { staffOnly } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/record', staffOnly, HealthController.recordHealthStatus);
router.get('/records/:classId/:date', staffOnly, HealthController.getHealthRecords);
router.get('/records/all', staffOnly, HealthController.getAllHealthRecords);

export default router;

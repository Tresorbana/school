import { Router } from 'express';
import { IntakeController } from '../controllers/intakeController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', IntakeController.index);
router.get('/:id', IntakeController.show);
router.post('/', IntakeController.create);
router.put('/:id', IntakeController.update);
router.post('/:id/promote', IntakeController.promote);
router.post('/:id/status', IntakeController.toggleStatus);
router.delete('/:id', IntakeController.delete);

export default router;

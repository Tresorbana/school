import { Router } from 'express';
import { ClassController } from '../controllers/classController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', ClassController.index);
router.get('/:id', ClassController.show);
router.post('/', ClassController.create);
router.put('/:id', ClassController.update);
router.delete('/:id', ClassController.delete);
router.get('/year-level/:yearLevel', ClassController.getByYearLevel);

export default router;

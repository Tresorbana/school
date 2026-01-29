import { Router } from 'express';
import { StudentController } from '../controllers/studentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', StudentController.index);
router.post('/', StudentController.create);
router.get('/:id', StudentController.show);
router.put('/:id', StudentController.update);
router.post('/assign-class', StudentController.assignToClass);

export default router;

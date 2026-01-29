import { Router } from 'express';
import multer from 'multer';
import { UploadController } from '../controllers/uploadController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
const upload = multer({ dest: 'uploads/' });
const router = Router();
router.use(authMiddleware);
router.post('/students', upload.single('file'), UploadController.importStudents);
export default router;

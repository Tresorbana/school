import { UploadService } from '../services/uploadService.js';
export class UploadController {
    static async importStudents(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No file uploaded' });
            }
            const result = await UploadService.importStudentsFromCsv(req.file.path);
            if (result.status === 'error') {
                return res.status(400).json({ success: false, message: result.message });
            }
            res.json({ success: true, data: result });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

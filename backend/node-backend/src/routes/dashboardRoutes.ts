import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', DashboardController.getDashboard);
router.get('/self-study-status', DashboardController.getSelfStudyStatus);
router.get('/absent-students', DashboardController.getAbsentStudents);
router.get('/sick-students', DashboardController.getSickStudents);
router.get('/classes', DashboardController.getClasses);
router.post('/timetable-periods', DashboardController.getTimetablePeriods);
router.post('/attendance-graph', DashboardController.getAttendanceGraph);
router.get('/self-study-attendance', DashboardController.getSelfStudyAttendance);
router.get('/absent-students/all', DashboardController.getAllAbsentStudents);
router.get('/admin', DashboardController.getAdminDashboard);
router.get('/period-recording-status', DashboardController.getPeriodRecordingStatus);
router.get('/self-study-performance', DashboardController.getSelfStudyPerformance);
router.get('/attendance-trends', DashboardController.getAttendanceTrends);
router.post('/teacher-report-stats', DashboardController.getTeacherReportStats);
router.get('/recent-actions', DashboardController.getRecentActions);
router.post('/health-statistics-by-class', DashboardController.getHealthStatisticsByClass);

export default router;

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import './config/prisma.js'; // Force initialization
import authRoutes from './routes/authRoutes.js';
import classRoutes from './routes/classRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import courseAssignmentRoutes from './routes/courseAssignmentRoutes.js';
import classTeacherRoutes from './routes/classTeacherRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import intakeRoutes from './routes/intakeRoutes.js';
import timetableRoutes from './routes/timetableRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import feeRoutes from './routes/feeRoutes.js';
import financialRoutes from './routes/financialRoutes.js';
import deliberationRoutes from './routes/deliberationRoutes.js';
import markRoutes from './routes/markRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { staffOnly } from './middleware/roleMiddleware.js';
import { authMiddleware } from './middleware/authMiddleware.js';

const app = express();
const port = process.env.PORT || 3000;

console.log('--- Server Startup ---');
console.log('Environment: PORT =', port);

app.use(cors());
app.use(express.json());

// Register routes
app.use('/api/auth', authRoutes);

// Specific routes with auth and role protection
app.use('/api/classes', authMiddleware, staffOnly, classRoutes);
app.use('/api/courses', authMiddleware, staffOnly, courseRoutes);
app.use('/api/assignments', authMiddleware, staffOnly, courseAssignmentRoutes);
app.use('/api/class-teachers', authMiddleware, staffOnly, classTeacherRoutes);
app.use('/api/students', authMiddleware, staffOnly, studentRoutes);
app.use('/api/intakes', authMiddleware, staffOnly, intakeRoutes);
app.use('/api/timetables', authMiddleware, staffOnly, timetableRoutes);
app.use('/api/attendance', authMiddleware, staffOnly, attendanceRoutes);
app.use('/api/uploads', authMiddleware, staffOnly, uploadRoutes);
app.use('/api/reports', authMiddleware, staffOnly, reportRoutes);
app.use('/api/dashboard', authMiddleware, staffOnly, dashboardRoutes);
app.use('/api/fees', authMiddleware, staffOnly, feeRoutes);
app.use('/api/financial', authMiddleware, staffOnly, financialRoutes);
app.use('/api/deliberation', authMiddleware, staffOnly, deliberationRoutes);
app.use('/api/marks', authMiddleware, markRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);

app.get('/', (req, res) => {
    res.send('RCAspire Backend API');
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('SERVER ERROR:', err.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

const server = app.listen(port, () => {
    console.log(`Server successfully listening on port ${port}`);
});

server.on('error', (e: any) => {
    console.error('SERVER LISTEN ERROR:', e);
});

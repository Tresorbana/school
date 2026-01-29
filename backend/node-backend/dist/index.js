import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import intakeRoutes from './routes/intakeRoutes.js';
import classRoutes from './routes/classRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import timetableRoutes from './routes/timetableRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import selfStudyRoutes from './routes/selfStudyRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/intakes', intakeRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/timetables', timetableRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/self-study-attendance', selfStudyRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reports', reportRoutes);
app.get('/', (req, res) => {
    res.send('Build Backend API is running');
});
// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        res.status(200).json({ status: 'healthy', database: 'connected' });
    }
    catch (error) {
        res.status(500).json({ status: 'unhealthy', database: 'disconnected', error: error.message });
    }
});
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
export { app, prisma };

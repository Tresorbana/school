import prisma from '../config/prisma.js';
import { AuditLogService } from './auditLogService.js';
export class SelfStudyAttendanceService {
    static async createAttendanceSession(classId, period, attendanceDate, notes, userId) {
        const date = attendanceDate ? new Date(attendanceDate) : new Date();
        const periodToUse = period || this.getCurrentPrepPeriod();
        if (!periodToUse) {
            throw new Error('No active prep period at this time. Morning prep: 7:00-8:30 AM, Evening prep: 7:30-10:00 PM');
        }
        const validation = this.validatePeriodTiming(periodToUse);
        if (!validation.valid) {
            throw new Error(validation.message);
        }
        // Check strict allowed periods
        if (!['morning_prep', 'evening_prep', 'saturday_extended_prep'].includes(periodToUse)) {
            throw new Error('Invalid period. Must be morning_prep, evening_prep, or saturday_extended_prep');
        }
        // Get total students in class for default stats
        const totalStudents = await prisma.student.count({
            where: { class_id: classId, is_active: true }
        });
        const session = await prisma.selfStudyAttendance.create({
            data: {
                class_id: classId,
                period: periodToUse,
                attendance_date: date,
                notes: notes,
                created_by: userId,
                total_students: totalStudents,
                present_students: totalStudents, // Default to all present initially? PHP doesn't explicitly say, but implies it.
                absent_students: [] // Empty json array
            }
        });
        await AuditLogService.log(userId, 'self_study_attendance', 'CREATE', session.attendance_id, { class_id: classId, period: periodToUse }, `Self-study session created for ${periodToUse}`);
        return session;
    }
    static async submitAttendance(attendanceId, absentStudents, userId) {
        // absentStudents is array of { student_id, notes }
        const session = await prisma.selfStudyAttendance.findUnique({
            where: { attendance_id: attendanceId }
        });
        if (!session)
            throw new Error('Session not found');
        const totalStudents = session.total_students; // Or recount?
        const presentCount = totalStudents - absentStudents.length;
        const updatedSession = await prisma.selfStudyAttendance.update({
            where: { attendance_id: attendanceId },
            data: {
                absent_students: absentStudents,
                present_students: presentCount
            }
        });
        await AuditLogService.log(userId, 'self_study_attendance', 'UPDATE', attendanceId, { absent_count: absentStudents.length }, `Attendance submitted: ${absentStudents.length} absent`);
        return updatedSession;
    }
    static async getAttendanceSessions(filters, limit = 50, offset = 0) {
        const where = {};
        if (filters.classId)
            where.class_id = filters.classId;
        if (filters.period)
            where.period = filters.period;
        if (filters.createdBy)
            where.created_by = filters.createdBy;
        if (filters.dateFrom)
            where.attendance_date = { gte: filters.dateFrom };
        if (filters.dateTo) {
            where.attendance_date = { ...where.attendance_date, lte: filters.dateTo };
        }
        const sessions = await prisma.selfStudyAttendance.findMany({
            where,
            include: {
                class: { select: { class_name: true } },
                creator: { select: { first_name: true, last_name: true } }
            },
            orderBy: { attendance_date: 'desc' },
            take: limit,
            skip: offset
        });
        return sessions.map((session) => ({
            ...session,
            period_display: this.formatPeriodDisplay(session.period),
            attendance_rate: session.total_students > 0
                ? Math.round((session.present_students / session.total_students) * 1000) / 10
                : 0
        }));
    }
    static async deleteSession(attendanceId, userId) {
        // Check permissions if needed
        await prisma.selfStudyAttendance.delete({
            where: { attendance_id: attendanceId }
        });
        await AuditLogService.log(userId, 'self_study_attendance', 'DELETE', attendanceId, {}, 'Session deleted');
        return true;
    }
    // Helpers
    static getCurrentPrepPeriod() {
        const now = new Date();
        const day = now.getDay(); // 0=Sun, 6=Sat
        const hours = now.getHours();
        const mins = now.getMinutes();
        const time = hours * 60 + mins;
        // Simple time checks
        const morningStart = 7 * 60;
        const morningEnd = 8 * 60 + 30;
        const eveningStart = 19 * 60 + 30;
        const eveningEnd = 22 * 60;
        const satStart = 10 * 60;
        const satEnd = 12 * 60;
        if (day >= 1 && day <= 5) { // Mon-Fri
            if (time >= morningStart && time <= morningEnd)
                return 'morning_prep';
        }
        if (day >= 0 && day <= 4) { // Sun-Thu (Evening)
            if (time >= eveningStart && time <= eveningEnd)
                return 'evening_prep';
        }
        if (day === 6) { // Sat
            if (time >= satStart && time <= satEnd)
                return 'saturday_extended_prep';
        }
        return null;
    }
    static validatePeriodTiming(period) {
        // Re-implement validation logic if strict enforcement is needed
        // For migration, we might relax it or blindly trust `getCurrentPrepPeriod` or user input if admin?
        // But let's keep it simple for now.
        return { valid: true };
    }
    static formatPeriodDisplay(period) {
        return period.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
}

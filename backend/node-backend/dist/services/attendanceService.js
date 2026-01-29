import prisma from '../config/prisma.js';
import { PeriodHelper } from '../utils/periodHelper.js';
export class AttendanceService {
    static async submitCourseAttendance(rosterId, attendanceData, userId) {
        const roster = await prisma.timetableRoster.findUnique({
            where: { roster_id: rosterId },
            include: { timetable: true }
        });
        if (!roster)
            throw new Error('Roster slot not found');
        // Get students in this class
        const students = await prisma.student.findMany({
            where: { class_id: roster.class_id, is_active: true }
        });
        return prisma.$transaction(async (tx) => {
            // Create record session
            const record = await tx.record.create({
                data: {
                    timetable_roster_id: rosterId,
                    recording_status: 'on_time'
                }
            });
            // Create attendance entries
            const attendanceEntries = students.map(student => ({
                student_id: student.student_id,
                record_id: record.record_id,
                is_present: !!attendanceData[student.student_id],
                is_sick: false // Sick flag can be updated later if needed
            }));
            await tx.attendance.createMany({
                data: attendanceEntries
            });
            return {
                record_id: record.record_id,
                present: attendanceEntries.filter(e => e.is_present).length,
                absent: attendanceEntries.filter(e => !e.is_present).length,
                total: students.length
            };
        });
    }
    static async getAttendanceByClassAndDate(classId, date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        return prisma.record.findMany({
            where: {
                timetable_roster: { class_id: classId },
                created_at: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            include: {
                timetable_roster: {
                    include: {
                        course: true,
                        user: true
                    }
                },
                attendance: {
                    include: { student: true }
                }
            }
        });
    }
    static async requestPermission(data) {
        return prisma.attendancePermissionRequest.create({
            data: {
                teacher_id: data.teacher_id,
                timetable_roster_id: data.roster_id,
                class_id: data.class_id,
                period_date: new Date(data.period_date),
                period_number: data.period_number,
                reason_category: data.reason_category,
                reason_notes: data.reason_notes ?? null,
                status: 'pending'
            }
        });
    }
    static async approvePermission(requestId, adminId, comments) {
        return prisma.attendancePermissionRequest.update({
            where: { request_id: requestId },
            data: {
                status: 'approved',
                approved_by: adminId,
                approved_at: new Date(),
                admin_comments: comments ?? null
            }
        });
    }
    static async getStudentAttendanceHistory(studentId, startDate, endDate) {
        return prisma.attendance.findMany({
            where: {
                student_id: studentId,
                record: {
                    created_at: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            },
            include: {
                record: {
                    include: {
                        timetable_roster: {
                            include: { course: true }
                        }
                    }
                }
            },
            orderBy: { record: { created_at: 'desc' } }
        });
    }
    static async getPeriodStatus(rosterId, date) {
        const roster = await prisma.timetableRoster.findUnique({
            where: { roster_id: rosterId },
            include: { timetable: true }
        });
        if (!roster)
            return 'UNKNOWN';
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        const record = await prisma.record.findFirst({
            where: {
                timetable_roster_id: rosterId,
                created_at: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });
        if (record)
            return 'COMPLETED';
        // Time-based determination
        const now = new Date();
        const isToday = now.toDateString() === date.toDateString();
        if (date > now && !isToday)
            return 'FUTURE';
        if (date < now && !isToday)
            return 'MISSED';
        if (isToday) {
            const periodInfo = PeriodHelper.getPeriodInfo(roster.period);
            if (!periodInfo)
                return 'UNKNOWN';
            const [startTimeStr, endTimeStr] = periodInfo.time.split('-');
            if (!startTimeStr || !endTimeStr)
                return 'UNKNOWN';
            const [startH, startM] = startTimeStr.split(':').map(Number);
            const [endH, endM] = endTimeStr.split(':').map(Number);
            if (startH === undefined || startM === undefined || endH === undefined || endM === undefined)
                return 'UNKNOWN';
            const periodStart = new Date(now);
            periodStart.setHours(startH, startM, 0, 0);
            const periodEnd = new Date(now);
            periodEnd.setHours(endH, endM, 0, 0);
            if (now < periodStart)
                return 'YET_TO_START';
            if (now > periodEnd)
                return 'MISSED';
            return 'PENDING';
        }
        return 'MISSED';
    }
}

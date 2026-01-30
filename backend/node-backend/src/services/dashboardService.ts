import prisma from '../config/prisma.js';
import { ReportService } from './reportService.js';
import { AttendanceService } from './attendanceService.js';
import { TimetableService } from './timetableService.js';
import { AuditLogService } from './auditLogService.js';

export class DashboardService {

    // --- Admin Dashboard ---
    // --- Admin Dashboard ---
    static async getAdminDashboard() {
        const today = new Date();
        const startOfDay = new Date(new Date(today).setHours(0, 0, 0, 0));
        const endOfDay = new Date(new Date(today).setHours(23, 59, 59, 999));

        // Attendance Overview
        const totalStudents = await prisma.student.count({ where: { is_active: true } });
        const presentToday = await prisma.attendance.count({
            where: {
                is_present: true,
                record: { created_at: { gte: startOfDay, lte: endOfDay } }
            }
        });

        // Class Stats
        const totalClasses = await prisma.class.count();
        const activeClasses = await prisma.timetable.count({ where: { is_active: true } });

        // User Stats (Roles)
        const roles = await prisma.role.findMany({
            include: {
                users: {
                    where: { user: { is_active: true } },
                    include: { user: true }
                }
            }
        });
        const userStats: Record<string, number> = {};
        roles.forEach((r: any) => {
            userStats[r.role_name] = r.users.length;
        });

        // Recent Activities (Audit Log or Records)
        // Frontend AnalyticsView expects 'action' and 'created_at'
        const recentActivities = await prisma.record.findMany({
            take: 10,
            orderBy: { created_at: 'desc' },
            include: {
                timetable_roster: {
                    include: {
                        class: true,
                        course: true,
                        user: true
                    }
                }
            }
        });

        return {
            attendance_overview: {
                total_students: totalStudents,
                present_students: presentToday,
                sick_students: 0 // Placeholder
            },
            class_stats: {
                total_classes: totalClasses,
                active_classes: activeClasses,
                total_students: totalStudents
            },
            user_stats: userStats,
            recent_activities: recentActivities.map(act => ({
                id: act.record_id,
                created_at: act.created_at,
                action: `${act.timetable_roster?.user?.first_name || 'Teacher'} recorded attendance for ${act.timetable_roster?.class?.class_name || 'Unknown Class'} - ${act.timetable_roster?.course?.course_name || 'General'}`
            }))
        };
    }

    static async getPeriodRecordingStatus(date: Date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = days[date.getDay()];

        // Get all roster items for this day
        const rosterItems = await prisma.timetableRoster.findMany({
            where: {
                day_of_week: dayName as any,
                timetable: { is_active: true }
            },
            include: {
                class: true,
                course: true
            }
        });

        if (rosterItems.length === 0) {
            return { has_classes: false, message: "No regular classes scheduled for this day" };
        }

        // Get records for these roster items on this date
        const records = await prisma.record.findMany({
            where: {
                timetable_roster_id: { in: rosterItems.map(r => r.roster_id) },
                created_at: { gte: startOfDay, lte: endOfDay }
            }
        });

        const recordedRosterIds = new Set(records.map(r => r.timetable_roster_id));

        const periods = rosterItems.map(item => ({
            roster_id: item.roster_id,
            class_name: item.class?.class_name || 'Unknown Class',
            period: item.period,
            course_name: item.course?.course_name || 'Unknown',
            status: recordedRosterIds.has(item.roster_id) ? 'recorded' : 'pending'
        }));

        const recordedCount = periods.filter(p => p.status === 'recorded').length;
        const totalCount = periods.length;

        return {
            has_classes: true,
            total_periods: totalCount,
            recorded_count: recordedCount,
            pending_count: totalCount - recordedCount,
            recorded_percentage: totalCount > 0 ? Math.round((recordedCount / totalCount) * 100) : 0,
            pending_percentage: totalCount > 0 ? Math.round(((totalCount - recordedCount) / totalCount) * 100) : 0,
            periods,
            day_of_week: dayName,
            date: date.toISOString().split('T')[0]
        };
    }

    static async getSelfStudyPerformance(classId: string, startDate: Date, endDate: Date) {
        // Find all records for this class within the range that are for self-study (prep) periods
        // For simplicity, we'll assume periods are identified by their names in this implementation
        // Real logic would depend on how periods are categorized in the system

        const records = await prisma.record.findMany({
            where: {
                timetable_roster: {
                    class_id: classId,
                    // We'd need a way to filter for "prep" periods. 
                    // Let's assume period numbers or course names indicate this for now.
                },
                created_at: { gte: startDate, lte: endDate }
            },
            include: {
                attendance: true,
                timetable_roster: true
            },
            orderBy: { created_at: 'asc' }
        });

        // Group by date
        const groupedByDate: any = {};
        records.forEach(rec => {
            const dateStr = rec.created_at.toISOString().split('T')[0] as string;
            if (!groupedByDate[dateStr]) {
                groupedByDate[dateStr] = { date: dateStr, periods: [] };
            }
            groupedByDate[dateStr].periods.push({
                period: rec.timetable_roster?.period || 'Unknown',
                present_students: rec.attendance.filter(a => a.is_present).length
            });
        });

        return Object.values(groupedByDate);
    }

    static async getAttendanceTrends(classId: string) {
        const weeks: any[] = [];
        const today = new Date();

        for (let i = 3; i >= 0; i--) {
            const endOfWeek = new Date(today);
            endOfWeek.setDate(today.getDate() - (i * 7));
            const startOfWeek = new Date(endOfWeek);
            startOfWeek.setDate(endOfWeek.getDate() - 6);

            const start = new Date(startOfWeek.setHours(0, 0, 0, 0));
            const end = new Date(endOfWeek.setHours(23, 59, 59, 999));

            const totalExpected = await prisma.attendance.count({
                where: {
                    student: { class_id: classId },
                    record: { created_at: { gte: start, lte: end } }
                }
            });

            const totalPresent = await prisma.attendance.count({
                where: {
                    student: { class_id: classId },
                    is_present: true,
                    record: { created_at: { gte: start, lte: end } }
                }
            });

            weeks.push({
                start_date: start.toISOString().split('T')[0],
                end_date: end.toISOString().split('T')[0],
                class_attendance: totalExpected > 0 ? Math.round((totalPresent / totalExpected) * 100) : 0,
                self_study_attendance: 0 // Placeholder
            });
        }

        return weeks;
    }

    static async getTeacherDashboard(userId: string) {
        const today = new Date();

        // Personal Timetable (Today)
        const schedule = await TimetableService.getTeacherTodaySchedule(userId, today);

        // Pending Attendance
        const pendingAttendance = await AttendanceService.getTeacherPendingAttendance(userId);

        // Today Stats
        const lessonsCount = schedule.filter((s: any) => !!s.course_id).length;

        const records = await prisma.record.findMany({
            where: {
                timetable_roster: { user_id: userId },
                created_at: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    lte: new Date(new Date().setHours(23, 59, 59, 999))
                }
            },
            include: {
                attendance: true
            }
        });

        let presentCount = 0;
        let absentCount = 0;
        records.forEach(r => {
            presentCount += r.attendance.filter(a => a.is_present).length;
            absentCount += r.attendance.filter(a => !a.is_present).length;
        });

        const todayStats = {
            lessons: lessonsCount,
            present: presentCount,
            absent: absentCount
        };

        const cards = [
            { title: 'Lessons', date: 'Today', number: lessonsCount, comment: lessonsCount > 0 ? 'Scheduled' : 'No lessons' },
            { title: 'Pending Attendance', number: pendingAttendance.length, comment: 'To submit' },
            { title: 'Present', date: 'Today', number: presentCount, comment: 'Students attended' },
            { title: 'Absent', date: 'Today', number: absentCount, comment: 'Students absent' }
        ];

        return {
            personal_timetable: schedule,
            pending_attendance: pendingAttendance,
            today_stats: todayStats,
            teacher_cards: cards
        };
    }

    static async getSelfStudyStatus(userId: string) {
        // Find if the user is a class teacher (Patron)
        const teacherClass = await prisma.classTeacher.findFirst({
            where: {
                user_id: userId,
                is_active: true
            },
            include: { class: true }
        });

        if (!teacherClass) {
            return {
                is_class_teacher: false,
                class_name: null,
                attendance_status: 'NOT_APPLICABLE'
            };
        }

        // Check if attendance was taken for self-study today
        // Assuming "Self Study" is a specific course or period type, OR it's a general daily check
        // For now, let's assume it checks if any attendance record exists for this class today in a specific "Self Study" period or generally

        const today2 = new Date();
        const startOfDay = new Date(today2);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today2);
        endOfDay.setHours(23, 59, 59, 999);

        // This logic might need adjustment based on how 'Self Study' is defined in the roster
        // For now, returning a mock status or based on any record found
        const record = await prisma.record.findFirst({
            where: {
                timetable_roster: { class_id: teacherClass.class_id },
                created_at: { gte: startOfDay, lte: endOfDay }
            }
        });

        return {
            is_class_teacher: true,
            class_name: teacherClass.class.class_name,
            attendance_status: record ? 'COMPLETED' : 'PENDING'
        };
    }

    static async getAbsentStudents(date: Date = new Date()) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const absences = await prisma.attendance.findMany({
            where: {
                is_present: false,
                record: {
                    created_at: { gte: startOfDay, lte: endOfDay }
                }
            },
            include: {
                student: { include: { class: true } }
            },
            take: 10,
            orderBy: { created_at: 'desc' }
        });

        return absences.map(a => ({
            first_name: a.student.first_name,
            last_name: a.student.last_name,
            class_name: a.student.class?.class_name || 'N/A',
            reason: 'Absent from class'
        }));
    }

    static async getSickStudents(date: Date = new Date()) {
        // Return empty until health/symptom logging is fully implemented in schema
        return [];
    }

    static async getAllClasses() {
        return prisma.class.findMany({
            select: {
                class_id: true,
                class_name: true,
                year_level: true
            },
            orderBy: { class_name: 'asc' }
        });
    }

    static async getTimetablePeriods(classId: string, date: Date) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = days[date.getDay()];

        const rosterItems = await prisma.timetableRoster.findMany({
            where: {
                class_id: classId,
                day_of_week: dayName as any,
                timetable: { is_active: true }
            },
            include: {
                course: true,
                user: true
            },
            orderBy: { period: 'asc' }
        });

        const { PeriodHelper } = await import('../utils/periodHelper.js');

        return Promise.all(rosterItems.map(async (item) => {
            const status = await AttendanceService.getPeriodStatus(item.roster_id, date);
            return {
                roster_id: item.roster_id,
                period: item.period,
                period_time: PeriodHelper.getPeriodInfo(item.period)?.time || 'Unknown',
                course_name: item.course?.course_name || 'No course',
                teacher_name: item.user ? `${item.user.first_name} ${item.user.last_name}` : 'No teacher',
                teacher_id: item.user_id,
                status: status.toLowerCase()
            };
        }));
    }

    static async getAttendanceGraph(classId: string, periodId: string, date: Date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const record = await prisma.record.findFirst({
            where: {
                timetable_roster_id: periodId,
                created_at: { gte: startOfDay, lte: endOfDay }
            },
            include: {
                attendance: true,
                timetable_roster: {
                    include: { course: true, user: true }
                }
            }
        });

        if (!record) {
            return { status: 'no_data' };
        }

        const present = record.attendance.filter(a => a.is_present).length;
        const absent = record.attendance.filter(a => !a.is_present).length;

        return {
            status: 'completed',
            present,
            absent,
            total: record.attendance.length,
            period: record.timetable_roster.period,
            course_name: record.timetable_roster.course?.course_name,
            teacher_name: record.timetable_roster.user ? `${record.timetable_roster.user.first_name} ${record.timetable_roster.user.last_name}` : null,
            recorded_at: record.created_at
        };
    }

    static async getSelfStudyAttendance(classId: string, date: Date, period: string) {
        // Basic placeholder for self-study attendance
        return {
            status: 'no_data',
            message: 'Self-study analysis not yet available for this period'
        };
    }

    static async getAllAbsentStudents(date: Date = new Date()) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const absences = await prisma.attendance.findMany({
            where: {
                is_present: false,
                record: {
                    created_at: { gte: startOfDay, lte: endOfDay }
                }
            },
            include: {
                student: { include: { class: true } }
            },
            orderBy: { created_at: 'desc' }
        });

        return absences.map(a => ({
            first_name: a.student.first_name,
            last_name: a.student.last_name,
            class_name: a.student.class?.class_name || 'N/A',
            reason: 'Absent from class',
            marked_absent_at: a.created_at
        }));
    }

    static async getTeacherReportStats(userId: string) {
        // Stats for teacher reports page
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        // Get classes assigned to teacher
        const teacherClasses = await prisma.classTeacher.findMany({
            where: { user_id: userId, is_active: true },
            select: { class_id: true }
        });
        const classIds = teacherClasses.map(tc => tc.class_id);

        // 1. Total Students in their classes
        const totalStudents = await prisma.student.count({
            where: {
                class_id: { in: classIds },
                is_active: true
            }
        });

        // 2. Average Attendance Rate (This Month)
        const totalAttendance = await prisma.attendance.count({
            where: {
                student: { class_id: { in: classIds } },
                record: { created_at: { gte: startOfMonth, lte: endOfMonth } }
            }
        });
        const presentAttendance = await prisma.attendance.count({
            where: {
                student: { class_id: { in: classIds } },
                is_present: true,
                record: { created_at: { gte: startOfMonth, lte: endOfMonth } }
            }
        });
        const attendanceRate = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 0;

        // 3. Classes Taught (This Month) - Count of unique records/lessons
        const classesTaught = await prisma.record.count({
            where: {
                timetable_roster: { user_id: userId },
                created_at: { gte: startOfMonth, lte: endOfMonth }
            }
        });

        // 4. Pending Reports (Drafts or issues) - Stub for now
        const pendingReports = 0;

        return [
            { title: 'Total Students', value: totalStudents, subtitle: 'In your classes', iconType: 'users' },
            { title: 'Attendance Rate', value: `${attendanceRate}%`, subtitle: 'This Month', iconType: 'percent' },
            { title: 'Classes Taught', value: classesTaught, subtitle: 'This Month', iconType: 'book' },
            { title: 'Pending Reports', value: pendingReports, subtitle: 'Action Required', iconType: 'alert' }
        ];
    }

    static async getRecentActions(limit: number = 10) {
        // Return recent system activities
        // Re-using similar logic from AdminDashboard recent_activities but formatted for the feed
        const recentActivities = await prisma.record.findMany({
            take: limit,
            orderBy: { created_at: 'desc' },
            include: {
                timetable_roster: {
                    include: {
                        class: true,
                        course: true,
                        user: true
                    }
                }
            }
        });

        return recentActivities.map(act => ({
            message: `${act.timetable_roster?.user?.first_name || 'Teacher'} recorded attendance for ${act.timetable_roster?.class?.class_name || 'Unknown Class'}`,
            timestamp: act.created_at.toISOString(),
            type: 'attendance_submission'
        }));
    }
}

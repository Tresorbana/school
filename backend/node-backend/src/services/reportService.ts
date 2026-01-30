import prisma from '../config/prisma.js';

export class ReportService {

    static async getAttendanceOverview(date: Date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const total = await prisma.attendance.count({
            where: {
                record: {
                    created_at: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                }
            }
        });

        const present = await prisma.attendance.count({
            where: {
                is_present: true,
                record: {
                    created_at: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                }
            }
        });

        const absent = await prisma.attendance.count({
            where: {
                is_present: false,
                record: {
                    created_at: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                }
            }
        });

        const attendanceRate = total > 0 ? (present / total) * 100 : 0;

        return {
            present,
            absent,
            total,
            attendance_rate: Math.round(attendanceRate * 100) / 100
        };
    }

    static async getTopAbsentStudents(startDate: Date, endDate: Date, limit = 10) {
        const absences = await prisma.attendance.groupBy({
            by: ['student_id'],
            where: {
                is_present: false,
                record: {
                    created_at: { gte: startDate, lte: endDate }
                }
            },
            _count: {
                attendance_id: true
            },
            orderBy: {
                _count: {
                    attendance_id: 'desc'
                }
            },
            take: limit
        });

        const details = await Promise.all(absences.map(async (item) => {
            const student = await prisma.student.findUnique({
                where: { student_id: item.student_id },
                select: { first_name: true, last_name: true }
            });
            return {
                student_id: item.student_id,
                first_name: student?.first_name,
                last_name: student?.last_name,
                absences: item._count.attendance_id
            };
        }));

        return details;
    }

    static async getStudentAttendanceDetails(studentId: string, startDate: Date, endDate: Date) {
        const records = await prisma.attendance.findMany({
            where: {
                student_id: studentId,
                record: {
                    created_at: { gte: startDate, lte: endDate }
                }
            },
            include: {
                record: {
                    select: { created_at: true }
                }
            },
            orderBy: {
                record: { created_at: 'desc' }
            }
        });

        const stats = {
            total: records.length,
            present: records.filter(r => r.is_present).length,
            absent: records.filter(r => !r.is_present).length,
            attendance_rate: records.length > 0 ? (records.filter(r => r.is_present).length / records.length) * 100 : 0,
            records: records.map(r => ({
                ...r,
                date: r.record.created_at
            }))
        };
        return stats;

    }

    static async getClassAttendanceStats(date: Date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const classes = await prisma.class.findMany({
            include: {
                _count: {
                    select: { students: { where: { is_active: true } } } // Count active students
                }
            }
        });

        const stats = await Promise.all(classes.map(async (cls) => {
            const attendance = await prisma.attendance.findMany({
                where: {
                    student: { class_id: cls.class_id },
                    record: {
                        created_at: { gte: startOfDay, lte: endOfDay }
                    }
                }
            });

            const present = attendance.filter(a => a.is_present).length;
            const absent = attendance.filter(a => !a.is_present).length;
            // Note: Total expected might differ if not all students have records yet
            // Using class student count as base
            const totalStudents = cls._count.students;

            return {
                class_name: cls.class_name,
                total_students: totalStudents,
                present,
                absent,
                attendance_rate: totalStudents > 0 ? (present / totalStudents) * 100 : 0
            };
        }));

        return stats;
    }

    static async getTeacherMostAbsentStudents(userId: string, page: number = 1, limit: number = 10) {
        // Get classes teacher is responsible for
        const teacherClasses = await prisma.classTeacher.findMany({
            where: { user_id: userId, is_active: true },
            select: { class_id: true }
        });
        const classIds = teacherClasses.map(tc => tc.class_id);

        if (classIds.length === 0) {
            return {
                students: [],
                pagination: { current_page: page, total_pages: 0, total_count: 0, per_page: limit, has_next: false, has_prev: false }
            };
        }

        const skip = (page - 1) * limit;

        // 1. Get all students in teacher's classes
        const totalStudents = await prisma.student.count({
            where: { class_id: { in: classIds }, is_active: true }
        });

        const students = await prisma.student.findMany({
            where: { class_id: { in: classIds }, is_active: true },
            select: {
                student_id: true,
                first_name: true,
                last_name: true,
                email: true,
                class: { select: { class_name: true } }
            },
            take: limit,
            skip: skip
        });

        // 2. Hydrate with absence data
        const studentsWithStats = await Promise.all(students.map(async (s) => {
            const absences = await prisma.attendance.count({
                where: { student_id: s.student_id, is_present: false }
            });
            const total = await prisma.attendance.count({
                where: { student_id: s.student_id }
            });

            return {
                student_id: s.student_id,
                first_name: s.first_name,
                last_name: s.last_name,
                email: s.email,
                class_name: s.class?.class_name || 'N/A',
                absence_count: absences,
                total_records: total,
                attendance_rate: total > 0 ? Math.round(((total - absences) / total) * 100) : 100
            };
        }));

        // Sort by absences descending (in memory for now, limit is small)
        studentsWithStats.sort((a, b) => b.absence_count - a.absence_count);

        return {
            students: studentsWithStats,
            pagination: {
                current_page: page,
                total_pages: Math.ceil(totalStudents / limit),
                total_count: totalStudents,
                per_page: limit,
                has_next: page * limit < totalStudents,
                has_prev: page > 1
            }
        };
    }

    static async getTeacherRecordedAttendances(userId: string, page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;

        const totalRecords = await prisma.record.count({
            where: { timetable_roster: { user_id: userId } }
        });

        const records = await prisma.record.findMany({
            where: { timetable_roster: { user_id: userId } },
            include: {
                timetable_roster: {
                    include: { class: true, course: true }
                },
                attendance: true
            },
            orderBy: { created_at: 'desc' },
            take: limit,
            skip: skip
        });

        const formattedRecords = records.map(r => {
            const total = r.attendance.length;
            const present = r.attendance.filter(a => a.is_present).length;
            // Sick count calculation removed due to missing 'remarks' field
            const sick = 0;

            return {
                record_id: r.record_id,
                created_at: r.created_at.toISOString(),
                class_name: r.timetable_roster.class?.class_name || 'Unknown',
                course_name: r.timetable_roster.course?.course_name || 'Unknown',
                period: r.timetable_roster.period,
                day_of_week: r.timetable_roster.day_of_week,
                total_students: total,
                present_count: present,
                absent_count: total - present,
                sick_count: sick
            };
        });

        return {
            records: formattedRecords,
            pagination: {
                current_page: page,
                total_pages: Math.ceil(totalRecords / limit),
                total_count: totalRecords,
                per_page: limit,
                has_next: page * limit < totalRecords,
                has_prev: page > 1
            }
        };
    }
}

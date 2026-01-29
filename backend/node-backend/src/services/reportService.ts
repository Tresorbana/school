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
}

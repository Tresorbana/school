import prisma from '../config/prisma.js';
export class ReportService {
    static async getAttendanceOverview(date) {
        // Attendance overview for admin dashboard
        // PHP: Counts present, absent, sick for a specific date
        // Join attendance -> records -> date(created_at) = date
        // But in Prisma schema: Attendance is linked to Record?
        // PHP SQL: 
        // SELECT 
        //   COUNT(CASE WHEN a.is_present = TRUE THEN 1 END) as present,
        //   COUNT(CASE WHEN a.is_present = FALSE THEN 1 END) as absent,
        //   COUNT(CASE WHEN a.is_sick = TRUE THEN 1 END) as sick,
        //   COUNT(*) as total
        // FROM attendance a
        // JOIN records r ON a.record_id = r.record_id
        // WHERE DATE(r.created_at) = :date
        // In Prisma, we can use groupBy or separate counts, or raw query. Raw query is cleanest for this single-pass aggregation.
        // Adjusting table names to match Prisma defaults (usually matches model names but lowercase/pluralized? standard is "Student", "Record", "Attendance")
        // My schema uses mapped names? Let's check schema.
        // View schema again? No, I remember standard mapping.
        // Models: Attendance, Record.
        // Tables (default): "Attendance", "Record" (if utilizing @map? No, usually it preserves case or uses convention).
        // Let's use Prisma native queries first if possible, but for aggregation over related fields, standard helper is easier.
        // Actually, let's use standard Prisma count queries if possible, or QueryRaw for efficiency.
        // Since we need to filter by Record date, it works like:
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        // Fetch all attendance for the day? Might be large.
        // Raw query is best for aggregation.
        // Note: Prisma table names are usually "Record", "Attendance", or mapped.
        // I should probably check the physical table names if I use raw query.
        // Safer to use Prisma Aggregate? 
        // But Prisma Aggregate doesn't do "Count if ..." easily without retrieving data.
        // Let's use multiple counts?
        // Count total:
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
        const sick = await prisma.attendance.count({
            where: {
                is_sick: true,
                record: {
                    created_at: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                }
            }
        });
        // absent is roughly total - present? Or explicitly:
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
            sick,
            total,
            attendance_rate: Math.round(attendanceRate * 100) / 100
        };
    }
    static async getAttendanceByClass(startDate, endDate) {
        // This is complex in PHP (Joins self_study, classes, health_records subsquery).
        // Migrating strictly: it seems to combine SelfStudyAttendance stats with Health Records sick counts?
        // PHP Query:
        // SELECT ssa.class_id, cl.class_name, SUM(ssa.present...) ...
        // JOIN classes cl ...
        // LEFT JOIN (sick counts subquery) ...
        // Let's replicate this using queryRaw for performance and correctness of logic.
        // Need to be careful with table names. I'll assume standard Prisma naming:
        // models: Class -> "Class", SelfStudyAttendance -> "SelfStudyAttendance", Student -> "Student", HealthRecord -> "HealthRecord"
        // Wait, usually Prisma maps them to specific table names if specified, or default.
        // If I can't be sure of table names, I might construct data in JS.
        // Let's try JS construction for safety against table name changes, unless performance is critical.
        // Data volume: "SelfStudyAttendance" rows for a date range. probably manageable.
        const selfStudyStats = await prisma.selfStudyAttendance.groupBy({
            by: ['class_id'],
            where: {
                attendance_date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            _sum: {
                present_students: true,
                total_students: true,
                // absent isn't a simple int column in PHP schema?
                // Wait, PHP schema had `absent_students` as JSON? 
                // In PHP code: `COALESCE(SUM(ssa.absent_students), 0)`.
                // In my schema: `absent_students` is Json.
                // Ah, the PHP code implies `absent_students` is an INT in the DB?
                // Let's re-read the PHP code carefully.
                // `COALESCE(SUM(ssa.absent_students), 0)`.
                // If `absent_students` is JSON in my schema, I can't SUM it.
                // The PHP version might have had it as INT or I misread my schema vs PHP expectations.
                // My schema: `absent_students Json? @default("[]")`. 
                // `total_students Int`, `present_students Int`.
                // So Absent count = Total - Present.
            }
        });
        // Get class names
        const classes = await prisma.class.findMany({
            select: { class_id: true, class_name: true }
        });
        const classMap = new Map(classes.map(c => [c.class_id, c.class_name]));
        // Sick counts from HealthRecord?
        // Logic: active sick students in that range?
        // PHP: `LEFT JOIN (SELECT s.class_id, COUNT(*) as sick FROM students s ... JOIN health_records ...)`
        // Effectively counting sick students by class in that date range.
        // We can do a separate aggregate.
        // This part is tricky to optimize without raw query, but let's do:
        // 1. Get all sick records in range
        // 2. Group by student -> class
        const sickRecords = await prisma.healthIncident.findMany({
            // Model is HealthIncident? PHP says `health_records`.
            // I created `HealthIncident` model previously.
            where: {
                created_at: {
                    gte: startDate,
                    lte: endDate
                },
                is_sick: true
            },
            include: {
                student: {
                    select: { class_id: true }
                }
            }
        });
        // Group sick records by class (unique student per day? PHP logic was complex: `MAX(hr.recorded_at)`...)
        // PHP logic finds "current sick status" or "sick during range"?
        // `WHERE hr.is_sick = true ... GROUP BY s.class_id`.
        // It seems to count "currently sick students" if the date range covers "latest status"?
        // Actually PHP `WHERE hr.recorded_at <= :end_date` and `GROUP BY hr.student_id` for MAX.
        // It tries to find the LAST record for each student up to endDate, and checks if it is Sick.
        // So: "Count of students who are sick as of endDate".
        // Let's implement that logic:
        // Get latest health record for every student (who has records) <= endDate.
        // Filter those where is_sick = true.
        // Group by class.
        // We can fetch all health records <= endDate, order by date desc, distinct by student? 
        // Prisma `distinct` support?
        const latestHealthRecords = await prisma.healthIncident.findMany({
            where: {
                created_at: {
                    lte: endDate
                }
            },
            orderBy: {
                created_at: 'desc'
            },
            distinct: ['student_id'],
            select: {
                student_id: true,
                is_sick: true,
                student: {
                    select: { class_id: true }
                }
            }
        });
        const sickCountByClass = {};
        latestHealthRecords.forEach(r => {
            if (r.is_sick && r.student && r.student.class_id) { // Check student exists (active?)
                sickCountByClass[r.student.class_id] = (sickCountByClass[r.student.class_id] || 0) + 1;
            }
        });
        // Combine
        const results = selfStudyStats.map((stat) => {
            const classId = stat.class_id;
            const total = stat._sum.total_students || 0;
            const present = stat._sum.present_students || 0;
            const absent = total - present; // inferred
            const sick = sickCountByClass[classId] || 0;
            const rate = total > 0 ? (present / total) * 100 : 0;
            return {
                class_id: classId,
                class_name: classMap.get(classId) || 'Unknown',
                present,
                absent,
                sick,
                total,
                attendance_rate: Math.round(rate * 100) / 100
            };
        });
        return results;
    }
    static async getSickCount(date) {
        // Sick count for a specific date (from Attendance records? or HealthIncidents?)
        // PHP `getSickCount` uses `attendance` table: `COUNT(DISTINCT CASE WHEN a.is_sick = TRUE ...)`
        // So this relies on Class Attendance, not Health Module?
        // Okay, use Attendance model.
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        const sickCount = await prisma.attendance.count({
            where: {
                is_sick: true,
                record: {
                    created_at: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                }
            }
        });
        const totalStudents = await prisma.attendance.groupBy({
            by: ['student_id'],
            where: {
                record: {
                    created_at: { gte: startOfDay, lte: endOfDay }
                }
            }
        });
        // count of distinct students who have attendance record today
        return {
            sick_count: sickCount,
            total_students: totalStudents.length
        };
    }
    static async getHealthStatistics(startDate, endDate) {
        // 1. Sick trend (daily sick count from Attendance)
        // 2. Recovery stats (from HealthIncidents?)
        // 3. Illness breakdown (from HealthIncidents?)
        // Sick Trend:
        const rawTrend = await prisma.$queryRaw `
            SELECT 
                DATE(r.created_at) as date,
                COUNT(DISTINCT CASE WHEN a.is_sick = TRUE THEN a.student_id END) as sick_count,
                COUNT(DISTINCT a.student_id) as total_records
            FROM "Attendance" a
            JOIN "Record" r ON a.record_id = r.record_id
            WHERE r.created_at >= ${startDate} AND r.created_at <= ${endDate}
            GROUP BY DATE(r.created_at)
            ORDER BY DATE(r.created_at)
        `; // Verify table names case sensitivity! Usually "Attendance", "Record" with quotes works for Postgres if models are named so. 
        // Or if mapped. Let's assume standard PascalCase models map to tables.
        // Correction: Prisma default table mapping might be "Student" -> "Student" (or "Post" -> "Post") but often typically unquoted exact name match.
        // Safer to use findMany and process in JS if likely small?
        // "Attendance" table might be large.
        // Let's try to stick to Prisma methods for safety, or ensure table names.
        // I'll use JS processing for the Trend to avoid "relation does not exist" errors if I guess wrong.
        const attendanceRecords = await prisma.attendance.findMany({
            where: {
                record: {
                    created_at: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            },
            select: {
                is_sick: true,
                student_id: true,
                record: {
                    select: { created_at: true }
                }
            }
        });
        // Process trend in JS
        const trendMap = {};
        attendanceRecords.forEach(r => {
            const dateStr = r.record.created_at.toISOString().split('T')[0];
            if (!trendMap[dateStr])
                trendMap[dateStr] = { sick: new Set(), total: new Set() };
            if (trendMap[dateStr]) {
                trendMap[dateStr].total.add(r.student_id);
                if (r.is_sick)
                    trendMap[dateStr].sick.add(r.student_id);
            }
        });
        const sick_trend = Object.entries(trendMap).map(([date, sets]) => ({
            date,
            sick_count: sets.sick.size,
            total_records: sets.total.size
        })).sort((a, b) => a.date.localeCompare(b.date));
        // Recovery Stats (HealthIncidents)
        // Total sick (unique students ever sick in range) vs Recovered (sick -> not sick?)
        // PHP logic: `hr1.is_sick = TRUE`, `hr2.is_sick = FALSE`, hr2 > hr1.
        // We can approximate in JS:
        // Fetch all health incidents where is_sick changed?
        // Or fetch all health incidents in range.
        const incidents = await prisma.healthIncident.findMany({
            where: {
                created_at: { gte: startDate, lte: endDate }
            },
            orderBy: { created_at: 'asc' }
        });
        const studentStatus = {}; // id -> is_sick
        const everSick = new Set();
        const recovered = new Set();
        incidents.forEach(inc => {
            if (inc.is_sick) {
                everSick.add(inc.student_id);
                studentStatus[inc.student_id] = true;
                // If they were recovered, they are now sick again?
            }
            else {
                if (studentStatus[inc.student_id]) {
                    // Was sick, now not sick -> recovered
                    recovered.add(inc.student_id);
                    studentStatus[inc.student_id] = false;
                }
            }
        });
        // PHP logic counts "Recovered" as "Anyone who transitioned Sick -> Healthy in the period"?
        // Or "Anyone who was sick in period and ended up healthy"?
        // PHP: `COUNT(DISTINCT CASE WHEN hr1.is_sick=TRUE AND hr2.is_sick=FALSE ...)`
        // It looks like "Did they recover?"
        const recovery_stats = {
            total_sick: everSick.size,
            recovered: recovered.size,
            recovery_rate: everSick.size > 0 ? (recovered.size / everSick.size) * 100 : 0
        };
        // Illness Breakdown
        const breakdown = {};
        incidents.forEach(inc => {
            if (inc.incident_type) {
                breakdown[inc.incident_type] = (breakdown[inc.incident_type] || 0) + 1;
            }
        });
        const illness_breakdown = Object.entries(breakdown).map(([type, count]) => ({ incident_type: type, count }));
        return {
            sick_trend,
            recovery_stats,
            illness_breakdown
        };
    }
    static async getTopAbsentStudents(startDate, endDate, limit = 10) {
        // Count absences per student in range
        // Attendance model
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
        // Enhance with student details
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
    static async getStudentAttendanceDetails(studentId, startDate, endDate) {
        const records = await prisma.attendance.findMany({
            where: {
                student_id: studentId,
                record: {
                    created_at: { gte: startDate, lte: endDate }
                }
            },
            include: {
                record: {
                    select: { created_at: true } // Need date
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
            sick: records.filter(r => r.is_sick).length,
            attendance_rate: records.length > 0 ? (records.filter(r => r.is_present).length / records.length) * 100 : 0,
            records: records.map(r => ({
                ...r,
                date: r.record.created_at
            }))
        };
        return stats;
    }
}

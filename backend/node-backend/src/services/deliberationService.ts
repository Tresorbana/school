import prisma from '../config/prisma.js';

export class DeliberationService {
    static async createRule(data: {
        min_score: number;
        max_score: number;
        grade: string;
        comment?: string;
    }) {
        return prisma.deliberationRule.create({
            data
        });
    }

    static async getRules() {
        return prisma.deliberationRule.findMany({
            where: { is_active: true },
            orderBy: { min_score: 'asc' }
        });
    }

    static async getGradeForScore(score: number) {
        const rules = await prisma.deliberationRule.findMany({
            where: {
                is_active: true,
                min_score: { lte: score },
                max_score: { gte: score }
            }
        });
        return rules[0] || null; // Return the first matching rule
    }

    static async generateStudentReport(studentId: string, academic_year: number, term: number) {
        // This is a placeholder for a complex report.
        // It should calculate average scores and assign grades.

        // Fetch student info
        const student = await prisma.student.findUnique({
            where: { student_id: studentId },
            include: { class: true }
        });

        if (!student) throw new Error('Student not found');

        // Fetch attendance stats
        const startOfYear = new Date(academic_year, 0, 1);
        const endOfYear = new Date(academic_year, 11, 31);

        const attendanceRecords = await prisma.attendance.findMany({
            where: {
                student_id: studentId,
                record: {
                    created_at: { gte: startOfYear, lte: endOfYear }
                }
            }
        });

        const totalAttendance = attendanceRecords.length;
        const presentCount = attendanceRecords.filter(r => r.is_present).length;
        const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

        // Fetch Fee status
        const payments = await prisma.feePayment.findMany({
            where: { student_id: studentId, academic_year, term }
        });
        const totalPaid = payments.reduce((sum, p) => sum + (p.amount as any), 0);

        // Placeholder for academic performance
        // In a real app, we'd fetch scores from a Marks/Grades table.
        // For now, we'll return the summary we have.

        return {
            student_info: {
                name: `${student.first_name} ${student.last_name}`,
                class: student.class?.class_name || 'N/A'
            },
            attendance: {
                total: totalAttendance,
                present: presentCount,
                rate: Math.round(attendanceRate * 100) / 100
            },
            financials: {
                total_paid: totalPaid
            }
        };
    }
}

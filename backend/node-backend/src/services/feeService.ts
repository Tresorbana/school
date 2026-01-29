import prisma from '../config/prisma.js';

export class FeeService {
    static async recordPayment(data: {
        student_id: string;
        amount: number;
        academic_year: number;
        term: number;
        category: string;
        received_by?: string;
        description?: string;
    }) {
        return prisma.feePayment.create({
            data: {
                student_id: data.student_id,
                amount: data.amount,
                academic_year: data.academic_year,
                term: data.term,
                category: data.category,
                received_by: data.received_by ?? null,
                description: data.description ?? null
            }
        });
    }

    static async getStudentPayments(studentId: string) {
        return prisma.feePayment.findMany({
            where: { student_id: studentId },
            orderBy: { payment_date: 'desc' }
        });
    }

    static async getFeeSummary(academic_year?: number, term?: number) {
        const where: any = {};
        if (academic_year) where.academic_year = academic_year;
        if (term) where.term = term;

        const totalCollected = await prisma.feePayment.aggregate({
            where,
            _sum: { amount: true }
        });

        const categoryBreakdown = await prisma.feePayment.groupBy({
            by: ['category'],
            where,
            _sum: { amount: true }
        });

        return {
            total_collected: totalCollected._sum.amount || 0,
            category_breakdown: categoryBreakdown.map((c: any) => ({
                category: c.category,
                amount: c._sum.amount || 0
            }))
        };
    }

    static async getDefaulters(academic_year: number, term: number, targetAmount: number) {
        // Find students whose total payments for the term are less than targetAmount
        // This logic depends on what students "should" pay. 
        // For simplicity, we compare their total payments to a fixed threshold.
        const payments = await prisma.feePayment.groupBy({
            by: ['student_id'],
            where: { academic_year, term },
            _sum: { amount: true }
        });

        const studentIdsWithPayments = payments.map((p: any) => p.student_id);

        // Students with NO payments
        const studentsWithNoPayments = await prisma.student.findMany({
            where: {
                is_active: true,
                student_id: { notIn: studentIdsWithPayments }
            },
            select: { student_id: true, first_name: true, last_name: true }
        });

        // Students with partial payments
        const partialPayments = payments.filter((p: any) => (p._sum.amount as any) < targetAmount);
        const partialStudentIds = partialPayments.map((p: any) => p.student_id);
        const partialStudents = await prisma.student.findMany({
            where: { student_id: { in: partialStudentIds } },
            select: { student_id: true, first_name: true, last_name: true }
        });

        return {
            no_payments: studentsWithNoPayments,
            partial_payments: partialStudents.map(s => {
                const p = partialPayments.find((p: any) => p.student_id === s.student_id);
                return {
                    ...s,
                    paid: p?._sum.amount || 0,
                    balance: targetAmount - (p?._sum.amount as any || 0)
                };
            })
        };
    }
}

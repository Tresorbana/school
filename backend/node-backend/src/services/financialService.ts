import prisma from '../config/prisma.js';
import { TransactionType } from '@prisma/client';

export class FinancialService {
    static async recordTransaction(data: {
        type: TransactionType;
        amount: number;
        category: string;
        description?: string;
        created_by?: string;
    }) {
        return prisma.financialRecord.create({
            data: {
                type: data.type,
                amount: data.amount,
                category: data.category,
                description: data.description ?? null,
                created_by: data.created_by ?? null
            }
        });
    }

    static async getFinancialSummary(startDate?: Date, endDate?: Date) {
        const where: any = {};
        if (startDate || endDate) {
            where.created_at = {};
            if (startDate) where.created_at.gte = startDate;
            if (endDate) where.created_at.lte = endDate;
        }

        const totals = await prisma.financialRecord.groupBy({
            by: ['type'],
            where,
            _sum: { amount: true }
        });

        const income = totals.find(t => t.type === TransactionType.INCOME)?._sum.amount || 0;
        const expenses = totals.find(t => t.type === TransactionType.EXPENSE)?._sum.amount || 0;

        const recentTransactions = await prisma.financialRecord.findMany({
            where,
            orderBy: { created_at: 'desc' },
            take: 5,
            include: { creator: { select: { first_name: true, last_name: true } } }
        });

        return {
            total_income: income,
            total_expense: expenses,
            net_balance: (income as number) - (expenses as number),
            recent_transactions: recentTransactions.map(tx => ({
                transaction_id: tx.record_id,
                type: tx.type.toLowerCase(),
                category: tx.category,
                amount: tx.amount,
                description: tx.description,
                date: tx.created_at,
                recorded_by: tx.creator ? `${tx.creator.first_name} ${tx.creator.last_name}` : 'System'
            }))
        };
    }

    static async getTransactions(type?: TransactionType, limit = 50) {
        return prisma.financialRecord.findMany({
            where: type ? { type } : {},
            orderBy: { created_at: 'desc' },
            take: limit,
            include: { creator: { select: { first_name: true, last_name: true } } }
        });
    }
}

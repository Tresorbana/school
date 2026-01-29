import { apiClient } from '../utils/apiClient';

export interface Transaction {
    transaction_id: string;
    type: 'income' | 'expense';
    category: string;
    amount: number;
    description: string;
    date: string;
    recorded_by: string;
}

export interface FinancialSummary {
    total_income: number;
    total_expense: number;
    net_balance: number;
    recent_transactions: Transaction[];
}

export interface CreateTransactionRequest {
    type: 'income' | 'expense';
    category: string;
    amount: number;
    description: string;
}

export const financialService = {
    /**
     * Record a new financial transaction (Admin only)
     */
    async recordTransaction(data: CreateTransactionRequest): Promise<{ success: boolean; message: string; data?: any }> {
        return apiClient.post('/api/financial/transaction', data);
    },

    /**
     * Get financial summary (Admin only)
     */
    async getFinancialSummary(): Promise<{ success: boolean; data: FinancialSummary }> {
        return apiClient.get('/api/financial/summary');
    },

    /**
     * Get all transactions list (Admin only)
     */
    async getTransactions(): Promise<{ success: boolean; data: Transaction[] }> {
        return apiClient.get('/api/financial/transactions');
    }
};

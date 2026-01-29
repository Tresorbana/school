import { apiClient } from '../utils/apiClient';

export interface PaymentRequest {
    student_id: string;
    amount: number;
    payment_method: string;
    reference_number?: string;
    notes?: string;
    term?: number;
    academic_year?: string;
}

export interface PaymentRecord {
    payment_id: string;
    student_id: string;
    amount: number;
    date: string;
    method: string;
    reference: string;
    status: string;
}

export interface FeeSummary {
    total_collected: number;
    total_expected: number;
    outstanding_balance: number;
    collection_rate: number;
    by_term: Record<string, number>;
}

export interface Defaulter {
    student_id: string;
    student_name: string;
    class_name: string;
    total_paid: number;
    balance: number;
    parent_phone: string;
    days_overdue: number;
}

export const feeService = {
    /**
     * Record a new payment
     */
    async recordPayment(data: PaymentRequest): Promise<{ success: boolean; message: string; data?: any }> {
        return apiClient.post('/api/fees/payment', data);
    },

    /**
     * Get student payment history
     */
    async getStudentPayments(studentId: string): Promise<{ success: boolean; data: PaymentRecord[] }> {
        return apiClient.get(`/api/fees/student/${studentId}`);
    },

    /**
     * Get overall fee summary (Admin only)
     */
    async getFeeSummary(): Promise<{ success: boolean; data: FeeSummary }> {
        return apiClient.get('/api/fees/summary');
    },

    /**
     * Get list of fee defaulters (Admin only)
     */
    async getDefaulters(): Promise<{ success: boolean; data: Defaulter[] }> {
        return apiClient.get('/api/fees/defaulters');
    }
};

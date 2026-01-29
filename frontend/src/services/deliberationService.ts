import { apiClient } from '../utils/apiClient';

export interface DeliberationRule {
    rule_id: string;
    name: string;
    description: string;
    min_average: number;
    allowed_failures: number;
    promotion_decision: 'promote' | 'repeat' | 'dismiss';
    created_at: string;
}

export interface StudentReport {
    student_id: string;
    student_name: string;
    total_marks: number;
    average: number;
    rank: number;
    decision: string;
    subjects: Array<{
        subject: string;
        marks: number;
        grade: string;
    }>;
}

export const deliberationService = {
    /**
     * Create a new deliberation rule (Admin only)
     */
    async createRule(data: Partial<DeliberationRule>): Promise<{ success: boolean; message: string; data?: any }> {
        return apiClient.post('/api/deliberation/rules', data);
    },

    /**
     * Get all deliberation rules
     */
    async getRules(): Promise<{ success: boolean; data: DeliberationRule[] }> {
        return apiClient.get('/api/deliberation/rules');
    },

    /**
     * Calculate grade for a specific score
     */
    async getGrade(score: number): Promise<{ success: boolean; grade: string }> {
        return apiClient.get(`/api/deliberation/grade?score=${score}`);
    },

    /**
     * Generate deliberation report for a student
     */
    async generateReport(studentId: string): Promise<{ success: boolean; data: StudentReport }> {
        return apiClient.get(`/api/deliberation/report/${studentId}`);
    }
};

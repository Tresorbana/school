import { apiClient } from '../utils/apiClient';

// Types
export interface SickStudent {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  illness?: string;
  sick_since?: string;
}

export interface ClassHealthOverview {
  class_id: string;
  class_name: string;
  year_level: number;
  total_students: number;
  sick_students: number;
  healthy_students: number;
  status: 'Submitted' | 'Pending';
  can_record: boolean;
  can_view: boolean;
  last_updated?: string;
  sick_student_details: SickStudent[];
}

export interface HealthRecord {
  student_id: string;
  is_sick: boolean;
  illness?: string;
  notes?: string;
}

export interface ApiResponse {
  success?: boolean;
  status?: string;
  data?: any;
  message?: string;
}

export const healthService = {


  /**
   * Record health status for multiple students
   */
  recordHealthStatus: async (classId: string, healthRecords: HealthRecord[]): Promise<ApiResponse> => {
    try {
      return await apiClient.post('/api/health/record', {
        class_id: classId,
        health_records: healthRecords,
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error: any) {
      console.error('Health service - recordHealthStatus failed:', error);
      throw error;
    }
  },

  /**
   * Get health records for a specific class and date
   */
  getHealthRecords: async (classId: string, date: string): Promise<ApiResponse> => {
    try {
      return await apiClient.get(`/api/health/records/${classId}/${date}`);
    } catch (error: any) {
      console.error('Health service - getHealthRecords failed:', error);
      throw error;
    }
  },

  /**
   * Get health statistics by class (healthy vs sick counts)
   */
  getHealthStatisticsByClass: async (classId?: string): Promise<ApiResponse> => {
    try {
      return await apiClient.post('/api/dashboard/health-statistics-by-class', {
        class_id: classId || null
      });
    } catch (error: any) {
      console.error('Health service - getHealthStatisticsByClass failed:', error);
      throw error;
    }
  },

  /**
   * Get all health records with filters and pagination
   */
  getAllHealthRecords: async (filters?: {
    class_id?: string;
    date?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> => {
    try {
      const params = new URLSearchParams();
      if (filters?.class_id) params.append('class_id', filters.class_id);
      if (filters?.date) params.append('date', filters.date);
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      return await apiClient.get(`/api/health/records/all?${params.toString()}`);
    } catch (error: any) {
      console.error('Health service - getAllHealthRecords failed:', error);
      throw error;
    }
  },


};

export default healthService;
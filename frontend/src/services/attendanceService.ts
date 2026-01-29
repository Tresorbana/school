import { apiClient } from '../utils/apiClient';

// Types for attendance data
export interface AttendanceRecord {
  student_id: string;
  status: 'present' | 'absent';
  notes?: string;
}

export interface RecordAttendanceRequest {
  class_id: string;
  subject: string;
  period: string;
  day: string;
  date: string; // YYYY-MM-DD format
  attendance_records: AttendanceRecord[];
}

export interface AttendanceResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface AttendancePermissionRequestPayload {
  timetable_roster_id: string;
  class_id: string;
  period_date: string;
  reason: string;
  reason_notes?: string;
}

export interface AttendanceSlotStatus {
  canRecord: boolean;
  canView: boolean;
  status: 'before_period' | 'during_period' | 'after_period' | 'future_day' | 'past_day';
  message: string;
  hasExistingRecord: boolean;
  existingRecord?: any;
}

export interface AttendanceByClassReportItem {
  class_id: string;
  class_name: string;
  present: number;
  absent: number;
  sick: number;
  total: number;
  attendance_rate: number;
}

export interface AttendanceByClassReportResponse {
  status: string;
  data?: AttendanceByClassReportItem[];
  message?: string;
}

// Self-Study Attendance Types
export interface SelfStudyAttendanceSession {
  self_study_attendance_id: string;
  class_id: string;
  class_name: string;
  period: 'morning_prep' | 'evening_prep' | 'saturday_extended_prep';
  period_display: string;
  attendance_date: string;
  total_students: number;
  present_students: number;
  absent_students: number;
  attendance_rate: number;
  status: string;
  notes?: string;
  created_at: string;
  created_by: string;
  created_by_name: string;
  can_edit: boolean;
  status_info: {
    status: string;
    message: string;
  };
}

export interface SelfStudyStudent {
  student_id: string;
  student_name: string;
  student_email: string;
  class_name?: string;
  is_absent: boolean;
  status: 'present' | 'absent';
  notes?: string;
}

export interface AbsentStudent {
  student_id: string;
  notes?: string;
}

export interface CurrentPeriodInfo {
  current_time: string;
  current_day: string;
  day_of_week: number;
  current_period: {
    period: string;
    display: string;
    time_range: string;
    start_time: string;
    end_time: string;
  } | null;
  next_period: {
    period: string;
    display: string;
    time_range: string;
    starts_in: string;
  } | null;
  can_record_attendance: boolean;
  weekly_schedule: Record<string, Record<string, string>>;
  periods: Record<string, {
    display: string;
    time_range: string;
    days: string[];
    start_time: string;
    end_time: string;
  }>;
}

export const attendanceService = {
  /**
   * Check if attendance can be recorded for a specific slot
   */
  async checkSlotStatus(classId: string, day: string, period: string): Promise<AttendanceSlotStatus> {
    return apiClient.post('/api/attendance/slot-status', {
      class_id: classId,
      day: day,
      period: period
    });
  },

  /**
   * Record attendance for a class session
   */
  async recordAttendance(data: RecordAttendanceRequest): Promise<AttendanceResponse> {
    return apiClient.post('/api/attendance/record', data);
  },

  /**
   * Get attendance records for a class on a specific date
   */
  async getAttendanceByDate(classId: string, date: string, period?: string, subject?: string): Promise<AttendanceResponse> {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    if (subject) params.append('subject', subject);
    
    const queryString = params.toString() ? `?${params}` : '';
    
    return apiClient.get(`/api/attendance/class/${classId}/date/${date}${queryString}`);
  },

  /**
   * Get student attendance history
   */
  async getStudentAttendance(studentId: string, startDate?: string, endDate?: string): Promise<AttendanceResponse> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const queryString = params.toString() ? `?${params}` : '';
    
    return apiClient.get(`/api/attendance/student/${studentId}${queryString}`);
  },

  /**
   * Get teacher's today schedule with attendance status
   */
  async getTeacherTodaySchedule(teacherId: string): Promise<AttendanceResponse> {
    return apiClient.post('/api/attendance/teacher-today-schedule', {
      teacher_id: teacherId
    });
  },

  /**
   * Request permission to record late attendance
   */
  async requestPermission(payload: AttendancePermissionRequestPayload): Promise<AttendanceResponse> {
    return apiClient.post('/api/attendance/request-permission', payload);
  },

  /**
   * Get attendance by class for a date range (report endpoint).
   */
  async getAttendanceByClassReport(params: {
    start_date: string;
    end_date: string;
  }): Promise<AttendanceByClassReportResponse> {
    return apiClient.post('/api/report/by-class', params);
  },

  // ===== SELF-STUDY ATTENDANCE METHODS =====

  /**
   * Get current period information with day-specific schedule
   */
  async getCurrentPeriod(): Promise<{ success: boolean; data?: CurrentPeriodInfo; message?: string }> {
    try {
      return await apiClient.get('/api/self-study-attendance/current-period');
    } catch (error) {
      console.error('Error getting current period:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get current period'
      };
    }
  },

  /**
   * Get students by self-study attendance status (present/absent/sick)
   */
  async getSelfStudyAttendanceStatusStudents(params: {
    status: 'present' | 'absent' | 'sick';
    start_date: string;
    end_date: string;
    class_id?: string;
  }): Promise<{ success: boolean; data?: SelfStudyStudent[]; message?: string }> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('status', params.status);
      queryParams.append('start_date', params.start_date);
      queryParams.append('end_date', params.end_date);

      if (params.class_id) {
        queryParams.append('class_id', params.class_id);
      }

      return await apiClient.get(`/api/self-study-attendance/status-students?${queryParams.toString()}`);
    } catch (error) {
      console.error('Error getting self-study attendance status students:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get attendance status students'
      };
    }
  },

  /**
   * Create a new self-study attendance session
   */
  async createSelfStudySession(
    classId: string,
    period?: string,
    attendanceDate?: string,
    notes?: string
  ): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      return await apiClient.post('/api/self-study-attendance', {
        class_id: classId,
        period,
        attendanceDate,
        notes
      });
    } catch (error) {
      console.error('Error creating self-study session:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create self-study session'
      };
    }
  },

  /**
   * Submit self-study attendance (record absent students)
   */
  async submitSelfStudyAttendance(
    attendanceId: string,
    absentStudents: AbsentStudent[]
  ): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      return await apiClient.put(`/api/self-study-attendance/${attendanceId}/submit`, {
        absent_students: absentStudents
      });
    } catch (error) {
      console.error('Error submitting self-study attendance:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to submit self-study attendance'
      };
    }
  },

  /**
   * Get self-study attendance sessions with filtering
   */
  async getSelfStudySessions(filters?: {
    class_id?: string;
    period?: string;
    supervisor_id?: string;
    supervisor_name?: string;
    date_from?: string;
    date_to?: string;
    date?: string;
    status?: string;
    limit?: number;
    offset?: number;
    page?: number;
  }): Promise<{ success: boolean; data?: SelfStudyAttendanceSession[]; message?: string }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }

      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      
      return await apiClient.get(`/api/self-study-attendance${queryString}`);
    } catch (error) {
      console.error('Error getting self-study sessions:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get self-study sessions'
      };
    }
  },

  /**
   * Get students for self-study attendance taking
   */
  async getSelfStudyClassStudents(
    classId: string,
    attendanceId?: string
  ): Promise<{ success: boolean; data?: SelfStudyStudent[]; message?: string }> {
    try {
      const queryString = attendanceId ? `?attendance_id=${attendanceId}` : '';
      
      return await apiClient.get(`/api/self-study-attendance/class/${classId}/students${queryString}`);
    } catch (error) {
      console.error('Error getting self-study class students:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get self-study class students'
      };
    }
  },

  /**
   * Get teacher attendance chart data for date range
   */
  async getTeacherAttendanceChart(userId: string, startDate: string, endDate: string, classId?: string): Promise<{
    success: boolean;
    data?: Array<{
      date: string;
      present: number;
      absent: number;
    }>;
    message?: string;
  }> {
    try {
      const requestData = {
        user_id: userId,
        start_date: startDate,
        end_date: endDate,
        class_id: classId || undefined
      };

      const response = await apiClient.post('/api/dashboard/teacher-attendance-chart', requestData);

      // Handle both wrapped and direct array responses
      if (Array.isArray(response.data)) {
        // Direct array response
        return {
          success: true,
          data: response.data
        };
      } else if (response.data.status === 'success') {
        // Wrapped response
        return {
          success: true,
          data: response.data.data
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to load attendance chart data'
        };
      }
    } catch (error) {
      console.error('Failed to get teacher attendance chart:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get teacher attendance chart'
      };
    }
  },

  /**
   * Get self-study status for bar chart
   */
  async getSelfStudyStatus(params: {
    date: string;
    class_id?: string;
  }): Promise<AttendanceResponse> {
    try {
      const response = await apiClient.post('/api/dashboard/self-study-status', params);
      
      if (response.status === 'success') {
        return {
          success: true,
          message: 'Self-study status loaded successfully',
          data: response.data
        };
      } else {
        return {
          success: false,
          message: response.message || 'Failed to load self-study status'
        };
      }
    } catch (error) {
      console.error('Failed to get self-study status:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get self-study status'
      };
    }
  }
};
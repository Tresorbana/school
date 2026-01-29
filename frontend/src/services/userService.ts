import { apiClient } from '../utils/apiClient';

export interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  roles: string[]; // Keep as string[] for backward compatibility
  role_name: string;
}

export interface UserWithRoleObjects {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  roles: Array<{ id: string; name: string }>;
  role_name: string;
}

export interface UsersResponse {
  status: string;
  data: User[];
  count: number;
}

export interface UserRoleManagement {
  user_id: string;
  role_name: string; // Required for both assign and remove
  action: 'assign' | 'remove';
}

export interface UserRoleUpdate {
  user_id: string;
  role_id: string;
}

export interface UserUpdate {
  user_id: string;
  firstname: string;
  lastname: string;
  email: string;
  role_id: string;
  password: string | null;
}

export interface ApiResponse {
  status: string;
  message: string;
  data?: any;
}

export interface CurrentUserResponse {
  status: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    roles: Array<{ id: string; name: string; role_name: string }>;
  };
}

export interface DashboardCard {
  title: string;
  date?: string;
  comment: string;
  number: number | string;
}



export const userService = {
  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<CurrentUserResponse> {
    return apiClient.get('/api/auth/me');
  },

  /**
   * Update current user profile
   */
  async updateCurrentUser(profileData: {
    first_name: string;
    last_name: string;
    email: string;
    password?: string
  }): Promise<ApiResponse> {
    return apiClient.put('/api/auth/profile', profileData);
  },

  /**
   * Get all users (excluding the requesting user)
   * Admin only endpoint
   */
  async getAllUsers(excludeUserId?: string, roleFilter?: string): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (excludeUserId) params.append('exclude_user_id', excludeUserId);
    if (roleFilter) params.append('role_filter', roleFilter);
    return apiClient.get(`/api/users?${params.toString()}`);
  },

  /**
   * Get all users for maintainer role
   */
  async getAllUsersForMaintainer(excludeUserId?: string, roleFilter?: string): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (excludeUserId) params.append('exclude_user_id', excludeUserId);
    if (roleFilter) params.append('role_filter', roleFilter);
    return apiClient.get(`/api/users/maintainer?${params.toString()}`);
  },

  /**
   * Update user role
   */
  async updateUserRole(userRoleUpdate: UserRoleUpdate): Promise<ApiResponse> {
    return apiClient.put('/api/users/role', userRoleUpdate);
  },

  /**
   * Update user information
   */
  async updateUser(userUpdate: UserUpdate): Promise<ApiResponse> {
    try {
      return await apiClient.put(`/api/users/${userUpdate.user_id}`, userUpdate);
    } catch (error) {
      console.log(error);
      throw error;
    }
  },

  /**
   * Get all roles
   */
  async getRoles(): Promise<{ status: string; data: Array<{ id: string; name: string }> }> {
    try {
      return await apiClient.get('/api/roles');
    } catch (error) {
      console.error('GetRoles error:', error);
      throw error;
    }
  },

  /**
   * Manage user role (assign or remove)
   */
  async manageUserRole(data: UserRoleManagement): Promise<ApiResponse> {
    try {
      return await apiClient.post('/api/roles/manage', data);
    } catch (error: any) {
      console.error('Role management API error:', error);
      throw error;
    }
  },

  /**
   * Get users by role
   */
  async getUsersByRole(roleName: string): Promise<{ status: string; data: User[] }> {
    return apiClient.get(`/api/users/role/${roleName}`);
  },

  /**
   * Get teacher dashboard cards
   */
  async getTeacherDashboardCards(userId: string): Promise<{
    success: boolean;
    data?: DashboardCard[];
    message?: string;
  }> {
    try {
      const response = await apiClient.post('/api/dashboard/teacher-cards', {
        user_id: userId
      });

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
          message: response.data.message || 'Failed to load teacher dashboard cards'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to load teacher dashboard cards'
      };
    }
  },

  /**
   * Get nurse dashboard cards
   */
  async getNurseDashboardCards(_userId: string): Promise<{
    success: boolean;
    data?: DashboardCard[];
    message?: string;
  }> {
    // console.log('UserService::getNurseDashboardCards - Starting with userId:', userId);

    try {
      const response = await apiClient.get('/api/dashboard/nurse-cards');
      // console.log('UserService::getNurseDashboardCards - API response:', {
      //   status: response.data?.status,
      //   data: response.data?.data,
      //   fullResponse: response.data
      // });

      // Handle both wrapped and direct array responses
      if (Array.isArray(response.data)) {
        // Direct array response (some endpoints return arrays directly)
        // console.log('UserService::getNurseDashboardCards - Success (direct array), returning data:', response.data);
        return {
          success: true,
          data: response.data
        };
      } else if (response.data?.status === 'success') {
        // Wrapped response
        console.log('UserService::getNurseDashboardCards - Success (wrapped), returning data:', response.data.data);
        return {
          success: true,
          data: response.data.data
        };
      } else {
        console.log('UserService::getNurseDashboardCards - API returned error:', {
          status: response.data?.status,
          message: response.data?.message
        });
        return {
          success: false,
          message: response.data?.message || 'Failed to load nurse dashboard cards'
        };
      }
    } catch (error: any) {
      console.error('UserService::getNurseDashboardCards - Caught error:', {
        error: error,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to load nurse dashboard cards'
      };
    }
  },

  /**
   * Get discipline dashboard cards
   */
  async getDisciplineDashboardCards(userId: string): Promise<{
    success: boolean;
    data?: DashboardCard[];
    message?: string;
  }> {
    try {
      const response = await apiClient.post('/api/dashboard/discipline-cards', {
        user_id: userId
      });

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
          message: response.data.message || 'Failed to load discipline dashboard cards'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to load discipline dashboard cards'
      };
    }
  },

  /**
   * Get teacher's most absent students with pagination
   */
  async getTeacherMostAbsentStudents(userId: string, page: number = 1, limit: number = 10): Promise<{
    success: boolean;
    data?: {
      students: Array<{
        student_id: string;
        first_name: string;
        last_name: string;
        email: string;
        class_name: string;
        absence_count: number;
        total_records: number;
        attendance_rate: number;
      }>;
      pagination: {
        current_page: number;
        total_pages: number;
        total_count: number;
        per_page: number;
        has_next: boolean;
        has_prev: boolean;
      };
    };
    message?: string;
  }> {
    try {
      const response = await apiClient.post('/api/reports/teacher-most-absent-students', {
        user_id: userId,
        page,
        limit
      });

      // The response structure is: response.status = 'success', response.data = actual_data
      if (response.status === 'success' && response.data) {
        return {
          success: true,
          data: response.data
        };
      } else {
        return {
          success: false,
          message: 'Unexpected response format'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get most absent students'
      };
    }
  },

  /**
   * Get teacher's recorded attendances with pagination
   */
  async getTeacherRecordedAttendances(userId: string, page: number = 1, limit: number = 10): Promise<{
    success: boolean;
    data?: {
      records: Array<{
        record_id: string;
        created_at: string;
        class_name: string;
        course_name: string;
        period: number;
        day_of_week: string;
        total_students: number;
        present_count: number;
        absent_count: number;
        sick_count: number;
      }>;
      pagination: {
        current_page: number;
        total_pages: number;
        total_count: number;
        per_page: number;
        has_next: boolean;
        has_prev: boolean;
      };
    };
    message?: string;
  }> {
    try {
      const response = await apiClient.post('/api/reports/teacher-recorded-attendances', {
        user_id: userId,
        page,
        limit
      });

      // The response structure is: response.status = 'success', response.data = actual_data
      if (response.status === 'success' && response.data) {
        return {
          success: true,
          data: response.data
        };
      } else {
        return {
          success: false,
          message: 'Unexpected response format'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get recorded attendances'
      };
    }
  },

  /**
   * Get teacher report statistics
   */
  async getTeacherReportStats(userId: string): Promise<{
    success: boolean;
    data?: Array<{
      title: string;
      value: string | number;
      subtitle: string;
      iconType: string;
    }>;
    message?: string;
  }> {
    try {
      const response = await apiClient.post('/api/dashboard/teacher-report-stats', {
        user_id: userId
      });

      // The response structure is: response.status = 'success', response.data = Array
      if (response.status === 'success' && Array.isArray(response.data)) {
        return {
          success: true,
          data: response.data
        };
      } else {
        return {
          success: false,
          message: 'Unexpected response format'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get teacher report stats'
      };
    }
  },

  /**
   * Get recent system actions for dashboard feed
   */
  async getRecentActions(limit: number = 10): Promise<{
    success: boolean;
    data?: Array<{
      message: string;
      timestamp: string;
      type: string;
    }>;
    message?: string;
  }> {
    try {
      const response = await apiClient.get(`/api/dashboard/recent-actions?limit=${limit}`);

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
          message: response.data.message || 'Failed to load recent actions'
        };
      }
    } catch (error) {
      console.error('Failed to get recent actions:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get recent actions'
      };
    }
  },
};

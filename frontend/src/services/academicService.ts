import { apiClient } from '../utils/apiClient';
import { isAdmin, isTeacher, isNurse, isDiscipline } from '../utils/auth';

// Types
export interface Student {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  intake_id?: string;
  class_id?: string;
  is_active: boolean;
  is_sick?: boolean;
  current_illness?: string;
  sick_since?: string;
  intake_name?: string;
  class_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Intake {
  intake_id: string;
  intake_name: string;
  start_year: number;
  end_year: number;
  current_year_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Class {
  class_id: string;
  class_name: string;
  year_level: number;
  created_at: string;
  updated_at: string;
}

export interface Course {
  course_id: string;
  course_name: string;
  year_level: number;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  count?: number;
}

// Student Management
export const studentService = {
  // Get students with pagination and search
  getStudents: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
    filter?: string;
    class_id?: string;
    intake_id?: string;
  }): Promise<PaginatedResponse<Student>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order);
    if (params?.filter) queryParams.append('filter', params.filter);
    if (params?.class_id) queryParams.append('class_id', params.class_id);
    if (params?.intake_id) queryParams.append('intake_id', params.intake_id);
    
    const queryString = queryParams.toString() ? `?${queryParams}` : '';
    
    return apiClient.get(`/api/students${queryString}`);
  },

  // Get single student
  getStudent: async (studentId: string): Promise<ApiResponse> => {
    return apiClient.get(`/api/students/${studentId}`);
  },

  // Update student
  updateStudent: async (studentId: string, data: Partial<Student>): Promise<ApiResponse> => {
    return apiClient.put(`/api/students/${studentId}`, data);
  },

  // Create single student
  createStudent: async (student: {
    first_name: string;
    last_name: string;
    email: string;
    gender: string;
  }): Promise<ApiResponse> => {
    return apiClient.post('/api/students', student);
  },

  // Toggle student active status
  toggleActive: async (studentId: string, isActive: boolean): Promise<ApiResponse> => {
    console.log('toggleActive called with:', { studentId, isActive, type: typeof isActive });
    
    const requestBody = { is_active: isActive };
    console.log('Request body:', requestBody);
    
    try {
      const result = await apiClient.put(`/api/students/${studentId}/toggle-active`, requestBody);
      console.log('Success response:', result);
      return result;
    } catch (error) {
      console.log('Error response:', error);
      throw error;
    }
  },

  // Find student by email
  findByEmail: async (email: string): Promise<ApiResponse> => {
    return apiClient.get(`/api/students/find-by-email?email=${encodeURIComponent(email)}`);
  },

  // Get student statistics
  getStats: async (): Promise<ApiResponse> => {
    return apiClient.get('/api/students/stats');
  },

  // Bulk assign to intake
  bulkAssignToIntake: async (studentIds: string[], intakeId: string): Promise<ApiResponse> => {
    return apiClient.post('/api/students/bulk-assign-to-intake', { student_ids: studentIds, intake_id: intakeId });
  },

  // Bulk create students
  bulkCreate: async (students: Array<{
    first_name: string;
    last_name: string;
    email: string;
    gender: string;
  }>): Promise<ApiResponse> => {
    return apiClient.post('/api/students/bulk-create', { students });
  },

  // Bulk assign to class
  bulkAssignToClass: async (studentIds: string[], classId: string): Promise<ApiResponse> => {
    return apiClient.post('/api/students/bulk-assign-to-class', { student_ids: studentIds, class_id: classId });
  },

  // Get sick students
  getSickStudents: async (): Promise<ApiResponse> => {
    return apiClient.get('/api/students/sick');
  },

  // Get sick count
  getSickCount: async (): Promise<ApiResponse> => {
    return apiClient.get('/api/students/sick-count');
  },
};

// Intake Management
export const intakeService = {
  // Get all intakes with pagination and search
  getIntakes: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
  }): Promise<PaginatedResponse<Intake> | ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order);
    
    const url = queryParams.toString() ? `/api/intakes?${queryParams}` : '/api/intakes';
    
    return apiClient.get(url);
  },

  // Get single intake
  getIntake: async (intakeId: string): Promise<ApiResponse> => {
    return apiClient.get(`/api/intakes/${intakeId}`);
  },

  // Create intake
  createIntake: async (data: Omit<Intake, 'intake_id' | 'created_at' | 'updated_at'>): Promise<ApiResponse> => {
    return apiClient.post('/api/intakes', data);
  },

  // Update intake
  updateIntake: async (intakeId: string, data: Partial<Intake>): Promise<ApiResponse> => {
    return apiClient.put(`/api/intakes/${intakeId}`, data);
  },

  // Delete intake
  deleteIntake: async (intakeId: string): Promise<ApiResponse> => {
    return apiClient.delete(`/api/intakes/${intakeId}`);
  },

  // Promote intake
  promoteIntake: async (intakeId: string): Promise<ApiResponse> => {
    return apiClient.put(`/api/intakes/${intakeId}/promote`);
  },

  // Activate intake
  activateIntake: async (intakeId: string): Promise<ApiResponse> => {
    return apiClient.put(`/api/intakes/${intakeId}/activate`);
  },

  // Deactivate intake
  deactivateIntake: async (intakeId: string): Promise<ApiResponse> => {
    return apiClient.put(`/api/intakes/${intakeId}/deactivate`);
  },

  // Get students in intake
  getStudents: async (intakeId: string): Promise<ApiResponse> => {
    return apiClient.get(`/api/intakes/${intakeId}/students`);
  },

  // Get intake statistics
  getStatistics: async (): Promise<ApiResponse> => {
    return apiClient.get('/api/intakes/statistics');
  },
};

// Class Management
export const classService = {
  // Get all classes with pagination and search (role-aware)
  getClasses: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
    with_courses?: boolean;
  }): Promise<PaginatedResponse<Class> | ApiResponse> => {
    
    // Check user role and handle accordingly
    if (!isAdmin() && !isTeacher() && !isNurse() && !isDiscipline()) {
      // For non-admin/teacher/nurse/discipline roles, return empty result
      return {
        success: true,
        data: [],
        message: 'Access restricted for your role'
      };
    }

    // For admins, nurses, and discipline users, get all classes using admin endpoint
    if (isAdmin() || isNurse() || isDiscipline()) {
      try {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
        if (params?.sort_order) queryParams.append('sort_order', params.sort_order);
        if (params?.with_courses) queryParams.append('with_courses', 'true');
        
        const url = queryParams.toString() ? `/api/classes?${queryParams}` : '/api/classes';
        
        return apiClient.get(url);
      } catch (error: any) {
        console.error('Admin/Nurse/Discipline classes fetch failed:', error);
        throw error;
      }
    }

    // For teachers (non-admin), get only their assigned classes
    if (isTeacher() && !isAdmin()) {
      try {
        return await classService.getTeacherClasses();
      } catch (error: any) {
        console.warn('Teacher classes endpoint not available, returning empty result');
        return {
          success: true,
          data: [],
          message: 'No classes assigned'
        };
      }
    }

    // Fallback (should not reach here)
    return {
      success: true,
      data: [],
      message: 'No access'
    };
  },

  // Get teacher's assigned classes (for teachers only)
  getTeacherClasses: async (): Promise<ApiResponse> => {
    return apiClient.get('/api/teachers/classes');
  },

  // Get single class
  getClass: async (classId: string): Promise<ApiResponse> => {
    return apiClient.get(`/api/classes/${classId}`);
  },

  // Create class
  createClass: async (data: Omit<Class, 'class_id' | 'created_at' | 'updated_at'>): Promise<ApiResponse> => {
    return apiClient.post('/api/classes', data);
  },

  // Update class
  updateClass: async (classId: string, data: Partial<Class>): Promise<ApiResponse> => {
    return apiClient.put(`/api/classes/${classId}`, data);
  },

  // Delete class
  deleteClass: async (classId: string): Promise<ApiResponse> => {
    return apiClient.delete(`/api/classes/${classId}`);
  },

  // Get students in class
  getStudents: async (classId: string): Promise<ApiResponse> => {
    return apiClient.get(`/api/classes/${classId}/students`);
  },

  // Get students by class (alias for getStudents for consistency)
  getStudentsByClass: async (classId: string): Promise<ApiResponse> => {
    return classService.getStudents(classId);
  },

  // Add student to class
  addStudent: async (classId: string, studentId: string, academicYear?: number): Promise<ApiResponse> => {
    return apiClient.post(`/api/classes/${classId}/students`, { 
      student_id: studentId, 
      academic_year: academicYear || new Date().getFullYear() 
    });
  },

  // Remove student from class
  removeStudent: async (classId: string, studentId: string): Promise<ApiResponse> => {
    return apiClient.delete(`/api/classes/${classId}/students/${studentId}`);
  },
};

// Course Management
export const courseService = {
  // Get all courses with pagination and search
  getCourses: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
    year_level?: number;
  }): Promise<PaginatedResponse<Course> | ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order);
    if (params?.year_level) queryParams.append('year_level', params.year_level.toString());
    
    const url = queryParams.toString() ? `/api/courses?${queryParams}` : '/api/courses';
    
    return apiClient.get(url);
  },

  // Get single course
  getCourse: async (courseId: string): Promise<ApiResponse> => {
    return apiClient.get(`/api/courses/${courseId}`);
  },

  // Create course
  createCourse: async (data: Omit<Course, 'course_id' | 'created_at' | 'updated_at'>): Promise<ApiResponse> => {
    return apiClient.post('/api/courses', data);
  },

  // Update course
  updateCourse: async (courseId: string, data: Partial<Course>): Promise<ApiResponse> => {
    return apiClient.put(`/api/courses/${courseId}`, data);
  },

  // Delete course
  deleteCourse: async (courseId: string): Promise<ApiResponse> => {
    return apiClient.delete(`/api/courses/${courseId}`);
  },

  // Get courses by year level
  getCoursesByYearLevel: async (yearLevel: number): Promise<ApiResponse> => {
    return apiClient.get(`/api/courses/year/${yearLevel}`);
  },

  // Assign teacher to course
  assignTeacher: async (courseId: string, teacherEmail: string, classId: string): Promise<ApiResponse> => {
    return apiClient.post(`/api/courses/${courseId}/teachers`, { 
      teacher_email: teacherEmail, 
      class_id: classId 
    });
  },

  // Remove teacher from course
  removeTeacher: async (courseId: string, teacherId: string): Promise<ApiResponse> => {
    return apiClient.delete(`/api/courses/${courseId}/teachers/${teacherId}`);
  },

  // Get teachers for course
  getTeachers: async (courseId: string): Promise<ApiResponse> => {
    return apiClient.get(`/api/courses/${courseId}/teachers`);
  },

  // Get courses for teacher
  getTeacherCourses: async (teacherId: string): Promise<ApiResponse> => {
    return apiClient.get(`/api/teachers/${teacherId}/courses`);
  },

  // Get course statistics
  getStatistics: async (): Promise<ApiResponse> => {
    return apiClient.get('/api/courses/statistics');
  },
};

// Health Management
export const healthService = {
  // Record sick student
  recordSickness: async (studentId: string, illness: string, notes?: string): Promise<ApiResponse> => {
    return apiClient.post('/api/health/record-sick', { student_id: studentId, illness, notes });
  },

  // Mark student as healed
  markHealed: async (studentId: string): Promise<ApiResponse> => {
    return apiClient.post('/api/health/mark-healed', { student_id: studentId });
  },
};

// Class-Course-Teacher Assignment Service
export const classCourseService = {
  // Assign course to class (create the connection)
  assignCourseToClass: async (classId: string, courseId: string): Promise<ApiResponse> => {
    return apiClient.post(`/api/classes/${classId}/courses`, { course_id: courseId });
  },

  // Assign teacher to course in specific class
  assignTeacherToCourse: async (classId: string, courseId: string, teacherEmail: string): Promise<ApiResponse> => {
    return apiClient.post(`/api/classes/${classId}/courses/${courseId}/teacher`, { teacher_email: teacherEmail });
  },

  // Remove teacher from course in specific class
  removeTeacherFromCourse: async (classId: string, courseId: string): Promise<ApiResponse> => {
    return apiClient.delete(`/api/classes/${classId}/courses/${courseId}/teacher`);
  },

  // Get class assignments (courses with assigned teachers)
  getClassAssignments: async (classId: string): Promise<ApiResponse> => {
    return apiClient.get(`/api/classes/${classId}/courses`);
  },

  // Get course assignments (classes where this course is taught with teachers)
  getCourseAssignments: async (courseId: string): Promise<ApiResponse> => {
    return apiClient.get(`/api/courses/${courseId}/classes`);
  },
};

// Simple Re-record Request Service
export const rerecordService = {
  // Request re-record permission
  requestRerecord: async (requestData: {
    timetable_roster_id: string;
    class_id: string;
    period_date: string;
    reason: string;
  }): Promise<ApiResponse> => {
    return apiClient.post('/api/attendance/request-rerecord', requestData);
  },

  // Approve re-record request (admin only)
  approveRerecord: async (recordId: string): Promise<ApiResponse> => {
    return apiClient.post('/api/attendance/approve-rerecord', { record_id: recordId });
  },
};
import { apiClient } from '../utils/apiClient';

// Types based on backend API structure
export interface TimetableDetails {
  timetable_id: string;
  academic_year: string;
  class_id: string;
  class_name: string;
  term: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimetableSlot {
  slot_id: string;
  timetable_id: string;
  day_of_week: string;
  period_number: number;
  assignment_id: string | null;
  course_name?: string;
  teacher_name?: string;
  period_time?: string;
  period_type?: 'lesson' | 'break' | 'lunch';
}

export interface CreateTimetableRequest {
  academic_year: string;
  class_id: string;
  term: number;
}

export interface AssignSlotRequest {
  slot_id: string;
  assignment_id: string;
}

export interface TimetableResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface TimetableGrid {
  details: TimetableDetails;
  slots: TimetableSlot[][];
}



export const timetableService = {
  /**
   * Get all timetables (Admin only)
   */
  async getAllTimetables(): Promise<{ success: boolean; data: TimetableDetails[] }> {
    return apiClient.get('/api/timetables');
  },

  /**
   * Create new timetable
   */
  async createTimetable(data: CreateTimetableRequest): Promise<TimetableResponse> {
    return apiClient.post('/api/timetables', data);
  },

  /**
   * Get timetable by ID
   */
  async getTimetableById(timetableId: string): Promise<{ success: boolean; data: TimetableGrid }> {
    return apiClient.get(`/api/timetables/${timetableId}`);
  },

  /**
   * Get active timetables (Public)
   */
  async getActiveTimetables(): Promise<{ success: boolean; data: TimetableDetails[] }> {
    return apiClient.get('/api/timetables/active');
  },

  /**
   * Get random active timetable
   */
  async getRandomActiveTimetable(): Promise<{ success: boolean; data: any; message?: string }> {
    return apiClient.get('/api/timetables/active/random');
  },

  /**
   * Get active timetable for specific class
   */
  async getActiveForClass(classId: string): Promise<{ success: boolean; data: TimetableGrid }> {
    return apiClient.post('/api/timetables/active/class', { class_id: classId });
  },

  /**
   * Get academic years for class and term
   */
  async getAcademicYearsForClassTerm(classId: string, term: number): Promise<{ success: boolean; data: string[] }> {
    return apiClient.post('/api/timetables/academic-years', { class_id: classId, term });
  },

  /**
   * Get class timetable by specific academic year and term
   */
  async getClassTimetableByYearAndTerm(classId: string, academicYear: string, term: number): Promise<{ success: boolean; data: any }> {
    return apiClient.post('/api/timetables/class/search', { 
      class_id: classId,
      academic_year: academicYear,
      term: term
    });
  },

  /**
   * Assign course-teacher to slot
   */
  async assignSlot(data: AssignSlotRequest): Promise<TimetableResponse> {
    return apiClient.post('/api/timetables/slots/assign', data);
  },

  /**
   * Remove assignment from slot
   */
  async unassignSlot(slotId: string): Promise<TimetableResponse> {
    return apiClient.post('/api/timetables/slots/unassign', { slot_id: slotId });
  },

  /**
   * Get available slots for assignment
   */
  async getAvailableSlots(timetableId: string): Promise<{ success: boolean; data: TimetableSlot[] }> {
    return apiClient.post('/api/timetables/slots/available', { timetable_id: timetableId });
  },

  /**
   * Bulk assign multiple slots
   */
  async bulkAssign(assignments: AssignSlotRequest[]): Promise<TimetableResponse> {
    return apiClient.post('/api/timetables/slots/bulk-assign', { assignments });
  },

  /**
   * Delete timetable
   */
  async deleteTimetable(timetableId: string): Promise<TimetableResponse> {
    return apiClient.delete(`/api/timetables/${timetableId}`);
  },

  /**
   * Helper function to format timetable data for frontend grid
   */
  formatTimetableForGrid(slots: TimetableSlot[]): TimetableSlot[][] {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const periods = 11;
    
    const grid: TimetableSlot[][] = [];
    
    days.forEach((day) => {
      const daySlots: TimetableSlot[] = [];
      
      for (let period = 1; period <= periods; period++) {
        const slot = slots.find(s => s.day_of_week === day && s.period_number === period);
        if (slot) {
          daySlots.push(slot);
        } else {
          // Create empty slot if not found
          daySlots.push({
            slot_id: '',
            timetable_id: '',
            day_of_week: day,
            period_number: period,
            assignment_id: null,
            period_type: period === 3 || period === 9 ? 'break' : period === 6 ? 'lunch' : 'lesson'
          });
        }
      }
      
      grid.push(daySlots);
    });
    
    return grid;
  },

  /**
   * Get teacher's timetable (Teacher only - shows only their assigned subjects)
   */
  async getTeacherTimetable(teacherId: string): Promise<{ success: boolean; data: any }> {
    return apiClient.post('/api/timetables/teacher', { teacher_id: teacherId });
  },

  /**
   * Activate a timetable (Admin only)
   */
  async activateTimetable(timetableId: string): Promise<TimetableResponse> {
    return apiClient.post('/api/timetables/activate', { timetable_id: timetableId });
  },

  /**
   * Deactivate a timetable (Admin only)
   */
  async deactivateTimetable(timetableId: string): Promise<TimetableResponse> {
    return apiClient.post('/api/timetables/deactivate', { timetable_id: timetableId });
  },

  /**
   * Reset a timetable (Admin only) - removes all slot assignments
   */
  async resetTimetable(timetableId: string): Promise<TimetableResponse> {
    return apiClient.post('/api/timetables/reset', { timetable_id: timetableId });
  }
};

// Class Course Assignment Service
export interface ClassCourseAssignment {
  assignment_id: string;
  course_id: string;
  course_name: string;
  year_level: number;
  teacher_id: string | null;
  teacher_first_name: string | null;
  teacher_last_name: string | null;
  teacher_email: string | null;
  assigned_at: string;
}

export const classCourseService = {
  /**
   * Get courses assigned to a class
   */
  async getClassCourses(classId: string): Promise<{ success: boolean; data: { class: any; courses: ClassCourseAssignment[]; count: number } }> {
    return apiClient.get(`/api/classes/${classId}/courses`);
  }
};
import { useMemo, useState, useEffect, useCallback } from "react";
import { HiDownload, HiRefresh } from "react-icons/hi";
import DateRangePicker from "../../shared/DateRangePicker";
import { exportToCSV, generateFilename } from "../../../utils/fileExportManager";
import { useToast } from "../../../utils/context/ToastContext";
import { apiClient } from "../../../utils/apiClient";

// Individual attendance record from API
interface AttendanceRecord {
  attendance_id: string;
  record_id: string;
  student_id: string;
  is_present: boolean;
  created_at: string;
  first_name: string;
  last_name: string;
  day_of_week: string;
  period: number;
  class_id: string;
  session_date: string;
  teacher_name?: string;
  class_name?: string;
  course_name?: string;
}

// Summary data for display
interface AttendanceSummary {
  id: string;
  teacher_name: string;
  class_name: string;
  course_name: string;
  period: number;
  day_of_week: string;
  session_date: string;
  total_students: number;
  present_students: number;
  absent_students: number;
  attendance_rate: number;
}

interface AttendanceReportFilters {
  search: string;
  class_id: string;
  course: string;
  date_from: string;
  date_to: string;
  teacher: string;
  page: number;
  limit: number;
}

interface AdminReportWidgetProps {
  // Add any props needed for data fetching or configuration
}

function AdminReportWidget({}: AdminReportWidgetProps) {
  // State for data and UI
  const [summaries, setSummaries] = useState<AttendanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const { addToast } = useToast();

  // State for dropdown options
  const [classes, setClasses] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Filter states with proper defaults (removed term)
  const [filters, setFilters] = useState<AttendanceReportFilters>({
    search: '',
    class_id: '',
    course: '',
    date_from: '',
    date_to: '',
    teacher: '',
    page: 1,
    limit: 10
  });

  // Load data when page changes (not when limit changes - that requires Apply)
  useEffect(() => {
    loadAttendanceRecords();
  }, [filters.page]);

  // Load dropdown options on component mount
  useEffect(() => {
    loadDropdownOptions();
  }, []);

  // Load classes and courses from API
  const loadDropdownOptions = async () => {
    try {
      setLoadingOptions(true);
      
      // Load classes
      const classesResponse = await apiClient.get('/api/classes');
      if (classesResponse.success) {
        setClasses(classesResponse.data || []);
      }

      // Load courses
      const coursesResponse = await apiClient.get('/api/courses');
      if (coursesResponse.success) {
        setCourses(coursesResponse.data || []);
      }
    } catch (error) {
      console.error('Failed to load dropdown options:', error);
      addToast({
        message: 'Failed to load filter options',
        type: 'error'
      });
    } finally {
      setLoadingOptions(false);
    }
  };

  // Transform individual records into summaries grouped by session
  const transformRecordsToSummaries = (records: AttendanceRecord[]): AttendanceSummary[] => {
    const sessionMap = new Map<string, AttendanceSummary>();

    records.forEach(record => {
      // Create unique key for each session (teacher + class + period + date)
      const sessionKey = `${record.class_id}-${record.period}-${record.session_date}`;
      
      if (!sessionMap.has(sessionKey)) {
        // Create new summary entry with actual data from API
        sessionMap.set(sessionKey, {
          id: sessionKey,
          teacher_name: record.teacher_name || 'Unknown Teacher',
          class_name: record.class_name || 'Unknown Class',
          course_name: record.course_name || 'Unknown Course',
          period: record.period,
          day_of_week: record.day_of_week,
          session_date: record.session_date,
          total_students: 0,
          present_students: 0,
          absent_students: 0,
          attendance_rate: 0
        });
      }

      const summary = sessionMap.get(sessionKey)!;
      summary.total_students++;
      
      if (record.is_present) {
        summary.present_students++;
      } else {
        summary.absent_students++;
      }
      
      summary.attendance_rate = Math.round((summary.present_students / summary.total_students) * 100);
    });

    return Array.from(sessionMap.values());
  };

  // Load attendance records from API and transform to summaries
  const loadAttendanceRecordsWithFilters = async (filtersToUse = filters) => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams();
      
      // Add non-empty filters to query params
      if (filtersToUse.search.trim()) queryParams.append('search', filtersToUse.search.trim());
      if (filtersToUse.class_id) queryParams.append('class_id', filtersToUse.class_id);
      if (filtersToUse.course) queryParams.append('course', filtersToUse.course);
      if (filtersToUse.date_from) queryParams.append('date_from', filtersToUse.date_from);
      if (filtersToUse.date_to) queryParams.append('date_to', filtersToUse.date_to);
      if (filtersToUse.teacher) queryParams.append('teacher', filtersToUse.teacher);
      
      // For now, get more records to create better summaries
      queryParams.append('limit', '100');

      const response = await apiClient.get(`/api/attendance/records?${queryParams.toString()}`);
      
      if (response.success && Array.isArray(response.data)) {
        const summaryData = transformRecordsToSummaries(response.data);
        
        // Apply client-side pagination to summaries
        const startIndex = (filtersToUse.page - 1) * filtersToUse.limit;
        const endIndex = startIndex + filtersToUse.limit;
        const paginatedSummaries = summaryData.slice(startIndex, endIndex);
        
        setSummaries(paginatedSummaries);
        setTotalRecords(summaryData.length);
      } else {
        setSummaries([]);
        setTotalRecords(0);
        addToast({
          message: 'Failed to load attendance records',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Failed to load attendance records:', error);
      setSummaries([]);
      setTotalRecords(0);
      addToast({
        message: 'Failed to load attendance records',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load attendance records from API and transform to summaries
  const loadAttendanceRecords = async () => {
    return loadAttendanceRecordsWithFilters(filters);
  };

  // Apply filters and reload data
  const applyFilters = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    loadAttendanceRecords();
  };

  // Reset filters to defaults
  const resetFilters = () => {
    setFilters({
      search: '',
      class_id: '',
      course: '',
      date_from: '',
      date_to: '',
      teacher: '',
      page: 1,
      limit: 10
    });
    // Reload data with reset filters
    loadAttendanceRecords();
  };

  // Handle search with immediate filtering
  const handleSearch = (searchTerm: string) => {
    const newFilters = { ...filters, search: searchTerm, page: 1 };
    setFilters(newFilters);
    
    // Trigger search immediately when user types
    if (searchTerm.length === 0 || searchTerm.length >= 2) {
      // Use setTimeout to debounce the search and pass the new filters
      setTimeout(() => {
        loadAttendanceRecordsWithFilters(newFilters);
      }, 300);
    }
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setFilters(prev => ({ ...prev, limit: newPageSize, page: 1 }));
    // Don't reload data immediately - require Apply button
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Export to CSV
  const handleExport = () => {
    try {
      if (summaries.length === 0) {
        addToast({
          message: 'No data to export',
          type: 'warning'
        });
        return;
      }

      // Prepare data for export
      const exportData = summaries.map(summary => ({
        'Teacher Name': summary.teacher_name,
        'Class': summary.class_name,
        'Course': summary.course_name,
        'Period': `Period ${summary.period}`,
        'Day': summary.day_of_week,
        'Date': new Date(summary.session_date).toLocaleDateString(),
        'Total Students': summary.total_students,
        'Present': summary.present_students,
        'Absent': summary.absent_students,
        'Attendance Rate': `${summary.attendance_rate}%`
      }));

      const filename = generateFilename('attendance_summary_report', new Date());
      exportToCSV(exportData, filename);

      addToast({
        message: 'Report exported successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Export failed:', error);
      addToast({
        message: 'Failed to export report',
        type: 'error'
      });
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    loadAttendanceRecords();
  };

  // Handle date range change and apply filters immediately
  const handleDateRangeChange = useCallback((startDate: Date, endDate: Date) => {
    setFilters(prev => ({
      ...prev,
      date_from: startDate.toISOString().split('T')[0],
      date_to: endDate.toISOString().split('T')[0],
      page: 1
    }));
  }, []);

  // Check if filters have been changed from defaults
  const hasActiveFilters = useMemo(() => {
    return filters.class_id !== '' || 
           filters.course !== '' || 
           filters.date_from !== '' || 
           filters.date_to !== '' || 
           filters.teacher !== '' ||
           filters.limit !== 10; // Show red dot when page size changed but not applied
  }, [filters]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(totalRecords / filters.limit));
  const currentPage = Math.min(filters.page, totalPages);
  const start = (currentPage - 1) * filters.limit;
  const end = Math.min(start + filters.limit, totalRecords);

  const pagesToShow = useMemo(() => {
    const items: (number | string)[] = [];
    const maxButtons = 5;
    if (totalPages <= maxButtons) {
      for (let p = 1; p <= totalPages; p++) items.push(p);
      return items;
    }
    items.push(1);
    let left = currentPage - 1;
    let right = currentPage + 1;
    if (currentPage <= 3) {
      left = 2;
      right = 4;
    } else if (currentPage >= totalPages - 2) {
      left = totalPages - 3;
      right = totalPages - 1;
    }
    if (left > 2) items.push("...");
    for (let p = Math.max(2, left); p <= Math.min(totalPages - 1, right); p++) items.push(p);
    if (right < totalPages - 1) items.push("...");
    items.push(totalPages);
    return items;
  }, [currentPage, totalPages]);

  return (
    <div>
      {/* Search and Filter Controls */}
      <div className="my-4 space-y-3">
        {/* Search and Buttons Row */}
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by teacher, class, or course..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-main focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`${showFilters
              ? 'bg-main text-white'
              : 'bg-white text-gray-700 border border-gray-300'
              } px-3 py-1.5 text-sm rounded-md flex items-center gap-2 hover:opacity-90 transition-colors relative`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1.5 text-sm rounded-md flex items-center gap-2 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <HiRefresh className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={loading || summaries.length === 0}
            className="bg-main text-white px-3 py-1.5 text-sm rounded-md flex items-center gap-2 hover:bg-main/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HiDownload className="w-3 h-3" />
            Export
          </button>
        </div>

        {/* Collapsible Filters */}
        {showFilters && (
          <div className="flex gap-3 items-center p-3 bg-main/5 border border-main/20 rounded-md">
            <div className="flex items-center gap-2">
              <DateRangePicker
                placeholder="Select date range"
                onDateRangeChange={handleDateRangeChange}
              />
              {(filters.date_from || filters.date_to) && (
                <button
                  onClick={() => {
                    setFilters(prev => ({ ...prev, date_from: '', date_to: '', page: 1 }));
                    loadAttendanceRecords();
                  }}
                  className="px-2 py-1 text-xs text-gray-500 hover:text-red-600 border border-gray-300 rounded hover:border-red-300"
                  title="Clear date range"
                >
                  ✕
                </button>
              )}
            </div>
            <select
              value={filters.limit}
              onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
              className="custom-select border border-gray-300 text-gray-700 px-3 py-1.5 text-sm rounded-md"
            >
              <option value={5}>Show 5 rows</option>
              <option value={10}>Show 10 rows</option>
              <option value={20}>Show 20 rows</option>
              <option value={50}>Show 50 rows</option>
            </select>
            <select 
              value={filters.course}
              onChange={(e) => setFilters(prev => ({ ...prev, course: e.target.value }))}
              className="border border-gray-300 rounded px-2 py-1 text-xs"
              disabled={loadingOptions}
            >
              <option value="">Select course</option>
              {courses.map(course => (
                <option key={course.course_id} value={course.course_name}>
                  {course.course_name}
                </option>
              ))}
            </select>
            <select 
              value={filters.class_id}
              onChange={(e) => setFilters(prev => ({ ...prev, class_id: e.target.value }))}
              className="border border-gray-300 rounded px-2 py-1 text-xs"
              disabled={loadingOptions}
            >
              <option value="">Select class</option>
              {classes.map(cls => (
                <option key={cls.class_id} value={cls.class_id}>
                  {cls.class_name}
                </option>
              ))}
            </select>
            <div className="flex gap-2 ml-auto">
              <button 
                onClick={applyFilters}
                className="px-3 py-1 bg-main text-white rounded text-xs hover:bg-main/90"
              >
                Apply
              </button>
              <button 
                onClick={resetFilters}
                className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-main text-white">
            <tr>
              <th className="px-3 py-2 text-left">
                <input type="checkbox" className="rounded w-3 h-3" />
              </th>
              <th className="px-3 py-2 text-left font-medium text-xs">Teacher Name</th>
              <th className="px-3 py-2 text-left font-medium text-xs">Class</th>
              <th className="px-3 py-2 text-left font-medium text-xs">Course</th>
              <th className="px-3 py-2 text-left font-medium text-xs">Period</th>
              <th className="px-3 py-2 text-left font-medium text-xs">Day</th>
              <th className="px-3 py-2 text-left font-medium text-xs">Date</th>
              <th className="px-3 py-2 text-left font-medium text-xs">Attendance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-main mr-2"></div>
                    Loading attendance records...
                  </div>
                </td>
              </tr>
            ) : summaries.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                  No attendance records found
                </td>
              </tr>
            ) : (
              summaries.map((summary) => (
                <tr key={summary.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <input type="checkbox" className="rounded w-3 h-3" />
                  </td>
                  <td className="px-3 py-2 text-gray-900 text-xs">{summary.teacher_name}</td>
                  <td className="px-3 py-2 text-gray-600 text-xs">{summary.class_name}</td>
                  <td className="px-3 py-2 text-gray-600 text-xs">{summary.course_name}</td>
                  <td className="px-3 py-2 text-gray-600 text-xs">Period {summary.period}</td>
                  <td className="px-3 py-2 text-gray-600 text-xs">{summary.day_of_week}</td>
                  <td className="px-3 py-2 text-gray-600 text-xs">
                    {new Date(summary.session_date).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 text-gray-600 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-main font-semibold">{summary.present_students}P</span>
                      <span className="text-gray-500">{summary.absent_students}A</span>
                      <span className="text-gray-500">({summary.attendance_rate}%)</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="my-6 flex items-center justify-between">
        <p className="text-[0.7rem] text-gray-500">
          Showing {start + 1} to {end} of {totalRecords} results
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || loading}
            className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          {pagesToShow.map((pageNum, idx) => (
            <button
              key={idx}
              onClick={() => typeof pageNum === 'number' && handlePageChange(pageNum)}
              disabled={loading}
              className={`px-3 py-1 rounded text-sm ${pageNum === currentPage
                ? 'bg-main text-white'
                : typeof pageNum === 'number'
                  ? 'border border-gray-300 hover:bg-gray-50'
                  : 'cursor-default'
                }`}
            >
              {pageNum}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || loading}
            className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminReportWidget;
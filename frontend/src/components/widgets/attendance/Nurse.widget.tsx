import { useState, useEffect } from "react";
import ViewHeader from "../../shared/ViewHeader";
import { useToast } from "../../../utils/context/ToastContext";
import { useAuth } from "../../../utils/context/AuthContext";
import { classService } from "../../../services/academicService";
import { getAuthHeaders } from "../../../utils/auth";
import { exportToCSV, generateFilename } from "../../../utils/fileExportManager";
import RecordHealthStatusModal from "../../modals/health/RecordHealthStatus.modal";
import { API_BASE_URL } from "../../../utils/apiClient";

function AttendanceNurseWidget() {
  const [searchValue, setSearchValue] = useState("");
  const [recordHealthStatusModalOpen, setRecordHealthStatusModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { addToast } = useToast();
  const { user } = useAuth();
  const userRole = user?.role;
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // New state for sick students and filters
  const [sickStudents, setSickStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    class_id: '',
    gender: '',
    date: new Date().toISOString().split('T')[0], // Default to today to match appliedFilters
    search: '',
    status: 'sick', // 'sick' or 'recovered'
    limit: 10 // page size
  });
  
  // Separate state for applied filters (used in API calls)
  const [appliedFilters, setAppliedFilters] = useState({
    class_id: '',
    gender: '',
    date: new Date().toISOString().split('T')[0], // Default to today for initial load
    search: '',
    status: 'sick', // 'sick' or 'recovered'
    limit: 10 // page size
  });

  // Check if filters have changed (for red dot indicator)
  const hasUnappliedFilters = JSON.stringify(filters) !== JSON.stringify(appliedFilters);

  // Load classes for filter dropdown and initial data
  useEffect(() => {
    loadClasses();
    // Don't auto-apply filters on mount - appliedFilters already has default values
  }, []);

  // Load sick students when applied filters change or page changes (only for nurses)
  useEffect(() => {
    // Only load sick students if user has nurse role
    if (userRole === 'nurse') {
      loadSickStudents();
    }
  }, [appliedFilters, currentPage, userRole]);

  const loadClasses = async () => {
    // Only load classes if user has nurse role (for health record filtering)
    if (userRole !== 'nurse') {
      return;
    }

    try {
      const response = await classService.getClasses();
      if (response.success) {
        setClasses(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const loadSickStudents = async () => {
    // Only proceed if user has nurse role
    if (userRole !== 'nurse') {
      return;
    }

    try {
      setLoading(true);
      
      // Build query parameters using appliedFilters (not current filters)
      const queryParams = new URLSearchParams();
      if (appliedFilters.class_id) queryParams.append('class_id', appliedFilters.class_id);
      if (appliedFilters.gender) queryParams.append('gender', appliedFilters.gender);
      if (appliedFilters.date) queryParams.append('date', appliedFilters.date);
      if (appliedFilters.search) queryParams.append('search', appliedFilters.search);
      
      // Add pagination parameters
      queryParams.append('page', currentPage.toString());
      queryParams.append('limit', appliedFilters.limit.toString());

      // Choose endpoint based on status filter
      const endpoint = appliedFilters.status === 'recovered' ? '/api/students/healthy' : '/api/students/sick';

      const response = await fetch(`${API_BASE_URL}${endpoint}?${queryParams}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setSickStudents(data.data || []);
        setTotalCount(data.total || data.count || 0);
        setTotalPages(Math.max(1, Math.ceil((data.total || data.count || 0) / appliedFilters.limit)));
      } else {
        throw new Error(data.message || `Failed to fetch ${appliedFilters.status === 'recovered' ? 'healthy' : 'sick'} students`);
      }
    } catch (error) {
      console.error(`Failed to load ${appliedFilters.status === 'recovered' ? 'healthy' : 'sick'} students:`, error);
      addToast({
        message: error instanceof Error ? error.message : `Failed to load ${appliedFilters.status === 'recovered' ? 'healthy' : 'sick'} students`,
        type: 'error'
      });
      setSickStudents([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    // Don't auto-apply search, wait for Apply button
    handleFilterChange('search', value);
  };

  const handleApplyFilters = () => {
    // Copy current filters to appliedFilters to trigger API call
    setAppliedFilters({ ...filters });
    setCurrentPage(1); // Reset to first page when applying filters
    
    addToast({
      message: 'Filters applied successfully',
      type: 'success'
    });
  };

  const handleClearFilters = () => {
    const defaultFilters = {
      class_id: '',
      gender: '',
      date: new Date().toISOString().split('T')[0], // Reset to today (same as initial)
      search: '',
      status: 'sick',
      limit: 10
    };
    
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters); // Use same default values
    setSearchValue('');
    setCurrentPage(1);
  };

  const handleHealthRecorded = () => {
    // After recording health status, refresh the sick students list
    loadSickStudents();
  };

  const handleMarkHealthy = async (studentId: string, studentName: string) => {
    // Only allow nurses to mark students as healthy
    if (user?.role !== 'nurse') {
      addToast({
        message: 'You do not have permission to perform this action',
        type: 'error'
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/health/mark-healed`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          student_id: studentId,
          notes: 'Marked as healthy from health dashboard'
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        addToast({
          message: `${studentName} has been marked as healthy`,
          type: 'success'
        });
        
        // Refresh the list to update UI immediately
        await loadSickStudents();
      } else {
        throw new Error(data.message || 'Failed to mark student as healthy');
      }
    } catch (error) {
      console.error('Error marking student as healthy:', error);
      addToast({
        message: error instanceof Error ? error.message : 'Failed to mark student as healthy',
        type: 'error'
      });
    }
  };

  const handleUpdateHealth = (_studentId: string) => {
    // For now, just open the record health status modal
    // In the future, this could open an edit modal with pre-filled data
    setRecordHealthStatusModalOpen(true);
  };

  const handleExportCSV = () => {
    // Only allow nurses to export health records
    if (user?.role !== 'nurse') {
      addToast({
        message: 'You do not have permission to export health records',
        type: 'error'
      });
      return;
    }

    try {
      if (!sickStudents || sickStudents.length === 0) {
        addToast({
          message: 'No data to export',
          type: 'error'
        });
        return;
      }

      // Prepare data for export - format the data as needed
      const exportData = sickStudents.map(student => ({
        'Student Name': student.full_name,
        'Gender': student.gender,
        'Class': student.class_name || 'N/A',
        'Illness': student.illness || 'Not specified',
        'Recorded Date': student.recorded_at ? new Date(student.recorded_at).toLocaleDateString() : 'N/A',
        'Notes': student.notes || 'No notes',
        'Recorded By': `${student.recorder_first_name || 'Unknown'} ${student.recorder_last_name || ''}`.trim()
      }));

      // Generate filename: {teacher_name}_{date}_{id}.csv
      const teacherName = user?.first_name && user?.last_name 
        ? `${user.first_name}_${user.last_name}`
        : 'nurse_export';
      
      const exportDate = appliedFilters.date || new Date().toISOString().split('T')[0];
      const filename = generateFilename(teacherName, exportDate);

      // Export to CSV
      exportToCSV(exportData, filename);

      addToast({
        message: `Health records exported successfully as ${filename}`,
        type: 'success'
      });

    } catch (error) {
      console.error('Export error:', error);
      addToast({
        message: error instanceof Error ? error.message : 'Failed to export data',
        type: 'error'
      });
    }
  };

  return (
    <div className="px-6">
      {/* Header */}
      <div className="flex justify-between">
        <ViewHeader title="Health" />
        <div className="flex justify-between items-center mt-6 mb-4">
          <div className="flex gap-3">
            <button
              onClick={() => setRecordHealthStatusModalOpen(true)}
              className="px-4 py-2 bg-main text-white text-sm font-medium rounded-lg hover:bg-main/90 focus:outline-none focus:ring-2 focus:ring-main focus:ring-offset-2"
            >
              Record health status
            </button>
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="mb-4 space-y-3">
        {/* Search and Buttons Row */}
        <div className="flex gap-3 items-center justify-between">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-main focus:border-transparent"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`${showFilters
                  ? 'bg-main text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
                } px-3 py-2 text-sm rounded-md flex items-center gap-2 hover:opacity-90 transition-colors`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </button>
            <button 
              onClick={loadSickStudents}
              disabled={loading}
              className="bg-gray-500 text-white px-3 py-2 text-sm rounded-md flex items-center gap-2 hover:bg-gray-600 disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button 
              onClick={handleExportCSV}
              className="bg-main text-white px-3 py-2 text-sm rounded-md flex items-center gap-2 hover:bg-main/90"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>
          </div>
        </div>

        {/* Collapsible Filters */}
        {showFilters && (
          <div className="flex gap-3 items-center p-3 bg-main/5 border border-main/20 rounded-md">
            <select 
              value={filters.class_id}
              onChange={(e) => handleFilterChange('class_id', e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-xs"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.class_id} value={cls.class_id}>
                  {cls.class_name}
                </option>
              ))}
            </select>
            <select 
              value={filters.gender}
              onChange={(e) => handleFilterChange('gender', e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-xs"
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <select 
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-xs"
            >
              <option className="text-[.8rem]" value="sick">Sick Students</option>
              <option className="text-[.8rem]" value="recovered">Recovered Students</option>
            </select>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-xs"
            />
            <select 
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-xs"
            >
              <option value={10}>Show 10 rows</option>
              <option value={20}>Show 20 rows</option>
              <option value={50}>Show 50 rows</option>
              <option value={100}>Show 100 rows</option>
            </select>
            <div className="flex gap-2 ml-auto items-center">
              <button 
                onClick={handleApplyFilters}
                className={`px-3 py-1 rounded text-xs hover:bg-main/90 bg-main text-white relative ${
                  hasUnappliedFilters ? 'pr-6' : ''
                }`}
              >
                Apply
                {hasUnappliedFilters && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </button>
              <button 
                onClick={handleClearFilters}
                className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {loading ? (
            <span>Loading {appliedFilters.status === 'recovered' ? 'recovered' : 'sick'} students...</span>
          ) : (
            <span>
              Showing {sickStudents.length} {appliedFilters.status === 'recovered' ? 'recovered' : 'sick'} student{sickStudents.length !== 1 ? 's' : ''}
              {appliedFilters.date && ` for ${new Date(appliedFilters.date).toLocaleDateString()}`}
            </span>
          )}
        </div>
        {sickStudents.length > 0 && (
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-main text-white">
            <tr>
              <th className="px-4 py-3 text-left w-12">
                <input type="checkbox" className="w-4 h-4 text-white bg-transparent border-white rounded" />
              </th>
              <th className="px-4 py-3 text-left font-medium text-xs">Student Name</th>
              <th className="px-4 py-3 text-left font-medium text-xs">Gender</th>
              <th className="px-4 py-3 text-left font-medium text-xs">Class</th>
              <th className="px-4 py-3 text-left font-medium text-xs">Illness</th>
              <th className="px-4 py-3 text-left font-medium text-xs">Recorded Date</th>
              <th className="px-4 py-3 text-left font-medium text-xs">Notes</th>
              <th className="px-4 py-3 text-left font-medium text-xs">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-main mb-2"></div>
                    <p className="text-gray-500 text-xs">Loading {appliedFilters.status === 'recovered' ? 'recovered' : 'sick'} students...</p>
                  </div>
                </td>
              </tr>
            ) : sickStudents.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-gray-400 text-2xl mb-2">🏥</div>
                    <p className="text-gray-500 text-xs">
                      {appliedFilters.search || appliedFilters.class_id || appliedFilters.gender 
                        ? `No ${appliedFilters.status === 'recovered' ? 'recovered' : 'sick'} students found matching your filters`
                        : `No ${appliedFilters.status === 'recovered' ? 'recovered' : 'sick'} students found for ${new Date(appliedFilters.date).toLocaleDateString()}`
                      }
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Try adjusting your filters or check a different date
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              sickStudents.map((student, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input type="checkbox" className="w-4 h-4 text-main bg-white border-gray-300 rounded focus:ring-main" />
                  </td>
                  <td className="px-4 py-3 text-gray-900 text-xs font-medium">{student.full_name}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{student.gender}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{student.class_name || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{student.illness || 'Not specified'}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {student.recorded_at ? new Date(student.recorded_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {student.notes ? (
                      <span title={student.notes}>
                        {student.notes.length > 30 ? `${student.notes.substring(0, 30)}...` : student.notes}
                      </span>
                    ) : (
                      'No notes'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleUpdateHealth(student.student_id)}
                        className="bg-main text-white px-2 py-1 rounded text-xs hover:bg-main/90"
                      >
                        Update
                      </button>
                      {appliedFilters.status === 'sick' && (
                        <button 
                          onClick={() => handleMarkHealthy(student.student_id, student.full_name)}
                          className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
                        >
                          Mark Healthy
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-700">
            <span>
              Showing {((currentPage - 1) * appliedFilters.limit) + 1} to {Math.min(currentPage * appliedFilters.limit, totalCount)} of {totalCount} results
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {/* Page Numbers */}
            <div className="flex gap-1">
              {totalPages > 0 && Array.from({ length: Math.min(5, Math.max(1, totalPages)) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm border rounded ${
                      currentPage === pageNum
                        ? 'bg-main text-white border-main'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>

      {/* Record Health Status Modal */}
      <RecordHealthStatusModal
        open={recordHealthStatusModalOpen}
        onClose={() => setRecordHealthStatusModalOpen(false)}
        onHealthRecorded={handleHealthRecorded}
      />
    </div>
  );
}

export default AttendanceNurseWidget;
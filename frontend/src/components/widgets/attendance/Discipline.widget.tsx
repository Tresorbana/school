import { useState, useEffect } from "react";
import { HiRefresh } from "react-icons/hi";
import ViewHeader from "../../shared/ViewHeader";
import { useToast } from "../../../utils/context/ToastContext";
import { useAuth } from "../../../utils/context/AuthContext";
import { classService } from "../../../services/academicService";
import { attendanceService } from "../../../services/attendanceService";
import { exportToCSV, generateFilename } from "../../../utils/fileExportManager";
import SelfStudyAttendanceActionsModal from "../../modals/attendance/SelfStudyAttendanceActions.modal";
import { API_BASE_URL } from "../../../utils/apiClient";

function AttendanceDisciplineWidget() {
  const [showFilters, setShowFilters] = useState(false);
  const { addToast } = useToast();
  const { user } = useAuth();
  const userRole = user?.role;

  // Discipline attendance state
  const [disciplineClasses, setDisciplineClasses] = useState<any[]>([]);
  const [disciplineSupervisors, setDisciplineSupervisors] = useState<any[]>([]);
  const [disciplineAttendanceData, setDisciplineAttendanceData] = useState<any[]>([]);

  const [disciplineLoading, setDisciplineLoading] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    selectedDate: new Date().toISOString().split('T')[0],
    selectedClass: '',
    selectedStatus: ''
  });
  const [appliedDisciplineFilters, setAppliedDisciplineFilters] = useState({
    selectedDate: new Date().toISOString().split('T')[0],
    selectedClass: '',
    selectedStatus: ''
  });

  // Check if filters have changed (for red dot indicator)
  const hasUnappliedFilters = JSON.stringify(tempFilters) !== JSON.stringify(appliedDisciplineFilters);

  // Self-study attendance modal state
  const [actionsModalOpen, setActionsModalOpen] = useState(false);
  const [selectedAttendanceRow, setSelectedAttendanceRow] = useState<any>(null);

  // Load discipline data when applied filters change (only for discipline users)
  useEffect(() => {
    if (userRole === 'discipline') {
      loadDisciplineData();
    }
  }, [appliedDisciplineFilters, userRole]);

  // Load classes and supervisors on mount for discipline users
  useEffect(() => {
    if (userRole === 'discipline') {
      loadDisciplineClasses();
      loadDisciplineSupervisors();
    }
  }, [userRole]);

  // Discipline-specific functions
  const loadDisciplineClasses = async () => {
    try {
      const response = await classService.getClasses();
      if (response.success && response.data) {
        setDisciplineClasses(response.data);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const loadDisciplineSupervisors = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/role/discipline`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' || data.success) {
          setDisciplineSupervisors(data.data || []);
        }
      }
    } catch (error) {
      console.error('Failed to load supervisors:', error);
    }
  };

  const loadDisciplineData = async () => {
    try {
      setDisciplineLoading(true);
      
      // Get classes for the selected date
      const classes = disciplineClasses.length > 0 ? disciplineClasses : await loadClassesSync();
      
      // Get periods for the selected date
      const selectedDate = new Date(appliedDisciplineFilters.selectedDate);
      const dayOfWeek = selectedDate.getDay();
      const periods = getPeriodsForDay(dayOfWeek);
      
      // Get existing sessions for the date
      const sessionsResponse = await attendanceService.getSelfStudySessions({
        date: appliedDisciplineFilters.selectedDate,
        class_id: appliedDisciplineFilters.selectedClass || undefined,
        limit: 100
      });
      
      const existingSessions = sessionsResponse.success ? sessionsResponse.data || [] : [];
      
      // Build attendance data for each class and period combination
      const attendanceData: any[] = [];
      
      for (const classData of classes) {
        // Skip if filtering by specific class
        if (appliedDisciplineFilters.selectedClass && classData.class_id !== appliedDisciplineFilters.selectedClass) {
          continue;
        }
        
        for (const period of periods) {
          // Find existing session for this class and period
          const existingSession = existingSessions.find(s => 
            s.class_id === classData.class_id && s.period === period.key
          );

          // Get supervisor (simplified - in real app this would be assigned)
          const supervisor = disciplineSupervisors[0] || { first_name: 'No', last_name: 'supervisor assigned' };

          // Determine status
          let status = 'pending';
          let canRecord = false;
          let recordedDate = '-';

          if (existingSession) {
            status = 'completed';
            recordedDate = new Date(existingSession.created_at).toLocaleDateString();
          } else {
            // Check if it's missed (time has passed)
            const now = new Date();
            const sessionDate = new Date(appliedDisciplineFilters.selectedDate);

            if (sessionDate.toDateString() === now.toDateString()) {
              // Today - check if time has passed
              const currentTime = now.getHours() * 60 + now.getMinutes();
              const periodEndTime = parseTimeToMinutes(period.endTime);

              if (currentTime > periodEndTime) {
                status = 'missed';
              } else {
                const periodStartTime = parseTimeToMinutes(period.startTime);
                if (currentTime >= periodStartTime && currentTime <= periodEndTime) {
                  canRecord = true;
                }
              }
            } else if (sessionDate < now) {
              // Past date - missed
              status = 'missed';
            }
          }

          // Apply status filter
          if (appliedDisciplineFilters.selectedStatus && appliedDisciplineFilters.selectedStatus !== status) {
            continue;
          }

          attendanceData.push({
            class_id: classData.class_id,
            class_name: classData.class_name,
            period: period.key,
            period_display: period.display,
            time_range: period.time,
            supervisor_name: `${supervisor.first_name} ${supervisor.last_name}`,
            status: status,
            recorded_date: recordedDate,
            can_record: canRecord,
            session_id: existingSession?.self_study_attendance_id || null
          });
        }
      }

      setDisciplineAttendanceData(attendanceData);

    } catch (error) {
      console.error('Failed to load discipline data:', error);
      addToast({
        message: 'Failed to load attendance data',
        type: 'error'
      });
    } finally {
      setDisciplineLoading(false);
    }
  };

  const loadClassesSync = async () => {
    const response = await classService.getClasses();
    return response.success ? response.data || [] : [];
  };

  const getPeriodsForDay = (dayOfWeek: number) => {
    switch (dayOfWeek) {
      case 1: case 2: case 3: case 4: // Monday-Thursday
        return [
          { key: 'morning_prep', display: 'Morning Prep', time: '7:00-8:30', startTime: '07:00', endTime: '08:30' },
          { key: 'evening_prep', display: 'Evening Prep', time: '19:30-22:00', startTime: '19:30', endTime: '22:00' }
        ];
      case 5: // Friday
        return [
          { key: 'morning_prep', display: 'Morning Prep', time: '7:00-8:30', startTime: '07:00', endTime: '08:30' }
        ];
      case 6: // Saturday
        return [
          { key: 'saturday_extended_prep', display: 'Saturday Extended Prep', time: '4:00-12:00', startTime: '04:00', endTime: '12:00' }
        ];
      case 0: // Sunday
        return [
          { key: 'evening_prep', display: 'Evening Prep', time: '19:30-22:00', startTime: '19:30', endTime: '22:00' }
        ];
      default:
        return [];
    }
  };

  const parseTimeToMinutes = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const handleApplyDisciplineFilters = () => {
    setAppliedDisciplineFilters({ ...tempFilters });
  };

  const handleResetDisciplineFilters = () => {
    const resetFilters = {
      selectedDate: new Date().toISOString().split('T')[0],
      selectedClass: '',
      selectedStatus: ''
    };
    setTempFilters(resetFilters);
    setAppliedDisciplineFilters(resetFilters);
  };

  const handleRefreshDisciplineData = () => {
    loadDisciplineClasses();
    loadDisciplineSupervisors();
    loadDisciplineData();
  };

  const handleRecordAttendance = (row: any) => {
    setSelectedAttendanceRow(row);
    setActionsModalOpen(true);
  };

  const handleViewAttendance = (row: any) => {
    setSelectedAttendanceRow(row);
    setActionsModalOpen(true);
  };

  const handleAttendanceRecorded = () => {
    // Refresh the discipline data after recording attendance
    loadDisciplineData();
  };

  const handleDisciplineExportCSV = () => {
    // Export discipline attendance data
    try {
      if (!disciplineAttendanceData || disciplineAttendanceData.length === 0) {
        addToast({
          message: 'No attendance data to export',
          type: 'error'
        });
        return;
      }

      // Prepare data for export
      const exportData = disciplineAttendanceData.map(row => ({
        'Class Name': row.class_name,
        'Period': row.period_display,
        'Supervisor': row.supervisor_name,
        'Status': row.status === 'completed' ? 'Completed' : 
                 row.status === 'pending' ? 'Pending' : 
                 row.status === 'missed' ? 'Missed Out' : 'Unknown',
        'Date': row.recorded_date || '-',
        'Time Range': row.time_range || '-'
      }));

      // Generate filename
      const teacherName = user?.first_name && user?.last_name 
        ? `${user.first_name}_${user.last_name}`
        : 'discipline_export';
      
      const exportDate = appliedDisciplineFilters.selectedDate;
      const filename = generateFilename(teacherName, exportDate);

      // Export to CSV
      exportToCSV(exportData, filename);

      addToast({
        message: `Exported ${exportData.length} attendance records`,
        type: 'success'
      });
    } catch (error) {
      console.error('Export failed:', error);
      addToast({
        message: 'Failed to export attendance data',
        type: 'error'
      });
    }
  };

  return (
    <div className="m-10">
      <ViewHeader title="Attendance" />

      {/* Search and Filters */}
      <div className="my-4">
        <div className="flex gap-2 ml-3 justify-end">
          <button
            onClick={handleRefreshDisciplineData}
            disabled={disciplineLoading}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white rounded text-xs font-medium hover:bg-gray-700 disabled:opacity-50"
          >
            <HiRefresh className={disciplineLoading ? 'animate-spin' : ''} />
            {disciplineLoading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition relative ${showFilters
                ? 'bg-main text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {hasUnappliedFilters && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
          <button 
            onClick={handleDisciplineExportCSV}
            className="flex items-center gap-1 px-3 py-1.5 bg-main text-white rounded text-xs font-medium hover:bg-main/90"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Collapsible Filters */}
      {showFilters && (
        <div className="bg-gray-50 rounded p-3 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[0.65rem] font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-main focus:border-transparent"
                value={tempFilters.selectedDate}
                onChange={(e) => setTempFilters(prev => ({ ...prev, selectedDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[0.65rem] font-medium text-gray-700 mb-1">Class</label>
              <select 
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-main focus:border-transparent"
                value={tempFilters.selectedClass}
                onChange={(e) => setTempFilters(prev => ({ ...prev, selectedClass: e.target.value }))}
              >
                <option value="">All Classes</option>
                {disciplineClasses.map((cls) => (
                  <option key={cls.class_id} value={cls.class_id}>
                    {cls.class_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[0.65rem] font-medium text-gray-700 mb-1">Status</label>
              <select 
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-main focus:border-transparent"
                value={tempFilters.selectedStatus}
                onChange={(e) => setTempFilters(prev => ({ ...prev, selectedStatus: e.target.value }))}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="missed">Missed Out</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button 
              onClick={handleResetDisciplineFilters}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 bg-gray-100 rounded-md border border-main"
            >
              Reset
            </button>
            <button 
              onClick={handleApplyDisciplineFilters}
              className="px-3 py-1.5 bg-main text-white rounded text-xs font-medium hover:bg-main/90"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        {/* Table Header */}
        <div className="bg-main text-white">
          <div className="grid grid-cols-7 gap-3 px-3 py-2">
            <div className="flex items-center">
              <input type="checkbox" className="w-3 h-3 text-white bg-transparent border-white rounded" />
            </div>
            <div className="text-xs font-medium">Class name</div>
            <div className="text-xs font-medium">Period</div>
            <div className="text-xs font-medium">Supervisor</div>
            <div className="text-xs font-medium">Status</div>
            <div className="text-xs font-medium">Date</div>
            <div className="text-xs font-medium">Actions</div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200">
          {disciplineLoading ? (
            <div className="px-3 py-8 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-main mb-2"></div>
                <p className="text-gray-500 text-xs">Loading attendance data...</p>
              </div>
            </div>
          ) : disciplineAttendanceData.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-gray-500 text-xs">No attendance data found for selected date</p>
            </div>
          ) : (
            disciplineAttendanceData.map((row, idx) => (
              <div key={idx} className="grid grid-cols-7 gap-3 px-3 py-2 hover:bg-gray-50">
                <div className="flex items-center">
                  <input type="checkbox" className="w-3 h-3 text-main bg-white border-gray-300 rounded focus:ring-main" />
                </div>
                <div className="text-xs text-gray-900">{row.class_name}</div>
                <div className="text-xs text-gray-600 font-medium">{row.period_display}</div>
                <div className="text-xs text-gray-600">{row.supervisor_name}</div>
                <div className="text-xs text-gray-600 mt-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    row.status === 'completed' ? 'bg-gray-100 text-gray-900' :
                    row.status === 'pending' ? 'bg-gray-100 text-gray-900' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {row.status === 'completed' ? 'Completed' :
                     row.status === 'pending' ? 'Pending' :
                     row.status === 'missed' ? 'Missed Out' :
                     'Unknown'}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  {row.recorded_date || '-'}
                </div>
                <div>
                  {row.status === 'completed' ? (
                    <button 
                      onClick={() => handleViewAttendance(row)}
                      className="bg-gray-500 text-white px-3 py-1 rounded text-xs hover:bg-gray-600"
                    >
                      View
                    </button>
                  ) : row.status === 'pending' && row.can_record ? (
                    <button 
                      onClick={() => handleRecordAttendance(row)}
                      className="bg-main text-white px-3 py-1 rounded text-xs hover:bg-main/90"
                    >
                      Record
                    </button>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <div className="text-xs text-gray-600">
          Showing {disciplineAttendanceData.length} results for {appliedDisciplineFilters.selectedDate}
        </div>
        <div className="flex items-center gap-1">
          <button className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50">
            Previous
          </button>
          <button className="px-2 py-1 bg-main text-white rounded text-xs">
            1
          </button>
          <button className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50">
            Next
          </button>
        </div>
      </div>

      {/* Self-Study Attendance Actions Modal */}
      {selectedAttendanceRow && (
        <SelfStudyAttendanceActionsModal
          isOpen={actionsModalOpen}
          onClose={() => {
            setActionsModalOpen(false);
            setSelectedAttendanceRow(null);
          }}
          onAttendanceRecorded={handleAttendanceRecorded}
          attendanceRow={selectedAttendanceRow}
          date={appliedDisciplineFilters.selectedDate}
        />
      )}
    </div>
  );
}

export default AttendanceDisciplineWidget;
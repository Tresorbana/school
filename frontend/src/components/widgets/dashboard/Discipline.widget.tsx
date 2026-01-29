import { HiClipboardCheck, HiDownload } from "react-icons/hi";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { attendanceService } from "../../../services/attendanceService";
import { classService } from "../../../services/academicService";
import { useAuth } from "../../../utils/context/AuthContext";
import { useToast } from "../../../utils/context/ToastContext";
import { useState, useEffect } from "react";
import Role, { MENU_ITEMS } from "../../../utils/constants";
import InfiniteScrollDatePicker from "../../shared/InfiniteScrollDatePicker";
import { API_BASE_URL } from "../../../utils/apiClient";
import SelfStudyAttendanceViewModal from "../../modals/attendance/SelfStudyAttendanceView.modal";

interface DashboardDisciplineWidgetProps {
  setActive?: (active: string) => void;
}

function DashboardDisciplineWidget({ setActive }: DashboardDisciplineWidgetProps) {
  const { user } = useAuth();
  const userRole = user?.role;
  const { addToast } = useToast();

  // Discipline schedule state
  const [disciplineClasses, setDisciplineClasses] = useState<any[]>([]);
  const [filteredDisciplineClasses, setFilteredDisciplineClasses] = useState<any[]>([]);
  const [disciplineSupervisors, setDisciplineSupervisors] = useState<any[]>([]);
  const [disciplineLoading, setDisciplineLoading] = useState(false);
  const [currentPeriodInfo, setCurrentPeriodInfo] = useState<any>(null);
  const [todaysSessions, setTodaysSessions] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Self-study status chart state
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClassForChart, setSelectedClassForChart] = useState('');
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [viewAttendanceOpen, setViewAttendanceOpen] = useState(false);
  const [selectedChartSession, setSelectedChartSession] = useState<any>(null);

  // Recent activities state
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  const [healthSearchValue, setHealthSearchValue] = useState("");

  // Temporary filter states (before Apply is clicked)
  const [tempFilters, setTempFilters] = useState({
    selectedClass: "",
    selectedStatus: "",
    recordsPerPage: 10
  });

  // Applied filter states (after Apply is clicked)
  const [appliedFilters, setAppliedFilters] = useState({
    selectedClass: "",
    selectedStatus: "",
    recordsPerPage: 10
  });

  const [currentPage, setCurrentPage] = useState(1);

  // Check if filters have changed (for red dot indicator)
  const hasUnappliedFilters = JSON.stringify(tempFilters) !== JSON.stringify(appliedFilters);

  useEffect(() => {
    // Load discipline schedule for discipline users
    if (userRole === Role.DISCIPLINE) {
      loadDisciplineSchedule();
      loadCurrentPeriodInfo();
      loadRecentActivities();
    }
  }, [userRole]);

  useEffect(() => {
    // Load chart data only when both date and class are selected
    if (userRole === Role.DISCIPLINE && selectedDate && selectedClassForChart) {
      loadChartData();
    } else {
      // Clear chart data when no class is selected
      setChartData([]);
    }
  }, [selectedDate, selectedClassForChart, userRole]);

  // Update filtered classes when disciplineClasses or appliedFilters change
  useEffect(() => {
    filterDisciplineClasses();
  }, [disciplineClasses, appliedFilters]);

  const loadDisciplineSchedule = async () => {
    try {
      setDisciplineLoading(true);

      // Fetch classes
      const classResponse = await classService.getClasses();

      if (classResponse.success) {
        const classes = classResponse.data || [];
        setDisciplineClasses(classes);
        setAvailableClasses(classes);
      } else {
        setDisciplineClasses([]);
        setAvailableClasses([]);
      }

      // Fetch discipline users (supervisors)
      const supervisorResponse = await fetch(`${API_BASE_URL}/api/users/role/discipline`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (supervisorResponse.ok) {
        const supervisorData = await supervisorResponse.json();

        if (supervisorData.status === 'success' || supervisorData.success) {
          setDisciplineSupervisors(supervisorData.data || []);
        } else {
          setDisciplineSupervisors([]);
          console.error('Supervisor API returned error:', supervisorData.message);
        }
      } else {
        setDisciplineSupervisors([]);
        console.error('Supervisor API failed with status:', supervisorResponse.status);
      }

    } catch (err) {
      console.error('Failed to load discipline schedule:', err);
      addToast({
        message: 'Failed to load discipline schedule',
        type: 'error'
      });
    } finally {
      setDisciplineLoading(false);
    }
  };

  const getSelectedClassName = () => {
    return availableClasses.find((cls) => cls.class_id === selectedClassForChart)?.class_name || 'Class';
  };

  const loadCurrentPeriodInfo = async () => {
    try {
      const response = await attendanceService.getCurrentPeriod();

      if (response.success && response.data) {
        setCurrentPeriodInfo(response.data);

        // Load today's sessions after getting period info
        loadTodaysSessions();
      } else {
        console.error('Failed to get current period:', response.message);
      }
    } catch (err) {
      console.error('Failed to load current period info:', err);
    }
  };

  const loadChartData = async () => {
    if (!selectedDate || !selectedClassForChart) return;
    
    try {
      setChartLoading(true);
      
      // Call API to get self-study status for selected date and class
      const response = await attendanceService.getSelfStudyStatus({
        date: selectedDate,
        class_id: selectedClassForChart
      });
      
      if (response.success && response.data) {
        setChartData(response.data.periods || []);
      } else {
        setChartData([]);
      }
    } catch (err) {
      console.error('Failed to load chart data:', err);
      setChartData([]);
    } finally {
      setChartLoading(false);
    }
  };

  const loadRecentActivities = async () => {
    try {
      setActivitiesLoading(true);
      
      // Get recent self-study attendance records
      const response = await attendanceService.getSelfStudySessions({
        limit: 10
      });
      
      if (response.success && response.data) {
        const activities = response.data.map((session: any) => ({
          time: new Date(session.created_at).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          date: new Date(session.created_at).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }),
          text: `${session.class_name} - ${session.period_display}`,
          details: `${session.present_students}/${session.total_students} present`,
          type: 'record'
        }));
        setRecentActivities(activities);
      } else {
        setRecentActivities([]);
      }
    } catch (error) {
      console.error('Failed to load recent activities:', error);
      setRecentActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const loadTodaysSessions = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await attendanceService.getSelfStudySessions({
        date: today,
        limit: 50
      });

      if (response.success && response.data) {
        setTodaysSessions(response.data);
      } else {
        console.error('Failed to get today\'s sessions:', response.message);
      }
    } catch (err) {
      console.error('Failed to load today\'s sessions:', err);
    }
  };

  const getAvailablePeriodsForToday = () => {
    // Use actual current date, not from API
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    const periods = [];

    switch (dayOfWeek) {
      case 1: case 2: case 3: case 4: // Monday-Thursday
        periods.push(
          { key: 'morning_prep', display: 'Morning Prep', time: '7:00-8:30' },
          { key: 'evening_prep', display: 'Evening Prep', time: '19:30-22:00' }
        );
        break;
      case 5: // Friday
        periods.push(
          { key: 'morning_prep', display: 'Morning Prep', time: '7:00-8:30' }
        );
        break;
      case 6: // Saturday
        periods.push(
          { key: 'saturday_extended_prep', display: 'Saturday Extended Prep', time: '10:00-12:00' }
        );
        break;
      case 0: // Sunday
        periods.push(
          { key: 'evening_prep', display: 'Evening Prep', time: '19:30-22:00' }
        );
        break;
      default:
        // nothing
    }

    return periods;
  };

  const getSessionStatus = (classId: string, period: string) => {
    const session = todaysSessions.find(s =>
      s.class_id === classId && s.period === period
    );

    if (session) {
      return {
        recorded: true,
        canView: true,
        canRecord: session.can_edit || false,
        session: session,
        backendStatus: session.status_info?.status || 'unknown'
      };
    }

    // Check if we can record now
    const canRecord = currentPeriodInfo?.can_record_attendance &&
                     currentPeriodInfo?.current_period?.period === period;

    // Determine time-based status even when no session exists
    let timeBasedStatus = 'not_found';
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentDay = currentTime.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday

    switch (period) {
      case 'morning_prep':
        // Mon-Fri: 7:00-8:30
        if ([1,2,3,4,5].includes(currentDay)) {
          if (currentHour < 7) timeBasedStatus = 'upcoming';
          else if (currentHour >= 7 && currentHour < 9) timeBasedStatus = 'active';
          else timeBasedStatus = 'missed'; // No session + time over = MISSED
        } else {
          timeBasedStatus = 'unavailable';
        }
        break;

      case 'evening_prep':
        // Sun, Mon-Thu: 19:30-22:00
        if ([0,1,2,3,4].includes(currentDay)) {
          if (currentHour < 19) timeBasedStatus = 'upcoming';
          else if (currentHour >= 19 && currentHour < 22) timeBasedStatus = 'active';
          else timeBasedStatus = 'missed'; // No session + time over = MISSED
        } else {
          timeBasedStatus = 'unavailable';
        }
        break;

      case 'saturday_extended_prep':
        // Saturday: 10:00-12:00
        if (currentDay === 6) { // Saturday
          if (currentHour < 10) timeBasedStatus = 'upcoming';
          else if (currentHour >= 10 && currentHour < 12) timeBasedStatus = 'active';
          else timeBasedStatus = 'missed'; // No session + time over = MISSED
        } else {
          timeBasedStatus = 'unavailable';
        }
        break;
    }

    return {
      recorded: false,
      canView: false,
      canRecord: canRecord,
      session: null,
      backendStatus: timeBasedStatus
    };
  };

  const handleRecordAttendance = (classData: any, period: any) => {
    // Navigate to attendance tab
    if (setActive) {
      setActive(MENU_ITEMS.ATTENDANCE);
    }

    addToast({
      message: `Recording attendance for ${classData.class_name} - ${period.display}`,
      type: 'info'
    });
  };

  const handleViewAttendance = (classData: any, period: any, _session: any) => {
    // Navigate to attendance tab
    if (setActive) {
      setActive(MENU_ITEMS.ATTENDANCE);
    }

    addToast({
      message: `Viewing attendance for ${classData.class_name} - ${period.display}`,
      type: 'info'
    });
  };

  // Handle search functionality (only when button clicked or Enter pressed)
  const handleHealthSearch = () => {
    filterDisciplineClasses(healthSearchValue);
  };

  const handleHealthSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleHealthSearch();
    }
  };

  // Filter discipline classes based on search and applied filters
  const filterDisciplineClasses = (searchTerm?: string) => {
    let filtered = [...disciplineClasses];

    // Filter by search query (class name) - only when search is triggered
    const searchValue = searchTerm !== undefined ? searchTerm : '';
    if (searchValue.trim()) {
      filtered = filtered.filter(classData =>
        classData.class_name.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    // Filter by selected class dropdown (using applied filters)
    if (appliedFilters.selectedClass) {
      filtered = filtered.filter(classData => classData.class_id === appliedFilters.selectedClass);
    }

    // Filter by status (using applied filters) - match exactly what's shown in table
    if (appliedFilters.selectedStatus) {
      filtered = filtered.filter(classData => {
        const availablePeriods = getAvailablePeriodsForToday();

        // Check if any period of this class matches the selected status
        return availablePeriods.some(period => {
          const status = getSessionStatus(classData.class_id, period.key);

          // This matches EXACTLY what's shown in the table
          let displayedStatus = '';
          if (status.recorded) {
            displayedStatus = 'completed';
          } else if (status.backendStatus === 'active') {
            displayedStatus = 'pending';
          } else if (status.backendStatus === 'missed') {
            displayedStatus = 'missed';
          } else {
            // Default case (upcoming, unavailable, etc.)
            displayedStatus = 'pending';
          }

          return displayedStatus === appliedFilters.selectedStatus;
        });
      });
    }

    setFilteredDisciplineClasses(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Handle Apply Filters
  const handleApplyFilters = () => {
    setAppliedFilters({ ...tempFilters });
  };

  // Handle Reset Filters
  const handleResetFilters = () => {
    const defaultFilters = {
      selectedClass: "",
      selectedStatus: "",
      recordsPerPage: 10
    };
    setTempFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  };

  // Handle Export to CSV
  const handleExport = () => {
    try {
      // Generate all rows for export (not just current page)
      const allRows = filteredDisciplineClasses.flatMap((classData, classIdx) => {
        const availablePeriods = getAvailablePeriodsForToday();

        if (availablePeriods.length === 0) {
          return [];
        }

        const supervisor = disciplineSupervisors[classIdx % disciplineSupervisors.length];
        const supervisorName = supervisor
          ? `${supervisor.first_name} ${supervisor.last_name}`
          : 'No supervisor assigned';

        return availablePeriods.map((period) => {
          const status = getSessionStatus(classData.class_id, period.key);
          
          let statusText = '';
          if (status.recorded) {
            statusText = 'Completed';
          } else if (status.backendStatus === 'active') {
            statusText = 'Pending';
          } else if (status.backendStatus === 'missed') {
            statusText = 'Missed Out';
          } else {
            statusText = 'Pending';
          }

          let actionText = '';
          if (status.recorded) {
            actionText = 'View';
          } else if (status.canRecord) {
            actionText = 'Record';
          } else {
            actionText = status.backendStatus === 'upcoming' ? 'Upcoming' :
                        status.backendStatus === 'missed' ? 'Missed' :
                        status.backendStatus === 'unavailable' ? 'Unavailable' :
                        'Pending';
          }

          return {
            'Class Name': classData.class_name,
            'Period': period.display,
            'Time': period.time,
            'Supervisor': supervisorName,
            'Status': statusText,
            'Action': actionText
          };
        });
      });

      if (allRows.length === 0) {
        addToast({
          message: 'No data to export',
          type: 'warning'
        });
        return;
      }

      // Create CSV content
      const headers = Object.keys(allRows[0]);
      const csvContent = [
        headers.join(','),
        ...allRows.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            // Escape commas and quotes in CSV
            return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
              ? `"${value.replace(/"/g, '""')}"` 
              : value;
          }).join(',')
        )
      ].join('\n');

      // Generate filename with current date and random code
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const filename = `Discipline_Schedule_${dateStr}_${randomCode}.csv`;

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      addToast({
        message: `Schedule exported successfully as ${filename}`,
        type: 'success'
      });

    } catch (error) {
      console.error('Export failed:', error);
      addToast({
        message: 'Failed to export schedule',
        type: 'error'
      });
    }
  };

  const handleViewSelfStudyAttendance = async (data: any) => {
    if (!data) return;

    let sessionId = data.session_id;
    if (!sessionId && selectedClassForChart && selectedDate) {
      try {
        const normalizePeriodKey = (periodValue?: string) => {
          if (!periodValue) return undefined;
          const normalized = periodValue.toLowerCase().replace(/\s+/g, '_');
          if (normalized === 'morning_prep') return 'morning_prep';
          if (normalized === 'evening_prep') return 'evening_prep';
          if (normalized === 'saturday_extended_prep') return 'saturday_extended_prep';
          return normalized;
        };

        const response = await attendanceService.getSelfStudySessions({
          date: selectedDate,
          class_id: selectedClassForChart,
          limit: 50
        });

        if (response.success && response.data) {
          const targetPeriodKey = normalizePeriodKey(data.period);
          const matchingSession = response.data.find((session: any) =>
            session.period === data.period ||
            session.period_display === data.period ||
            (targetPeriodKey && session.period === targetPeriodKey) ||
            (targetPeriodKey && normalizePeriodKey(session.period_display) === targetPeriodKey)
          );

          sessionId = matchingSession?.self_study_attendance_id || (matchingSession as any)?.session_id;
        }
      } catch (error) {
        addToast({
          message: 'Failed to load attendance session',
          type: 'error'
        });
        return;
      }
    }

    if (!sessionId) {
      addToast({
        message: 'No attendance session found for this period',
        type: 'warning'
      });
      return;
    }

    setSelectedChartSession({ ...data, session_id: sessionId });
    setViewAttendanceOpen(true);
  };

  return (
    <div className="px-10 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
        <div className="col-span-2 lg:col-span-3 border-2 border-gray-200 rounded-lg p-4">
          <div className="flex gap-2 justify-between items-center mb-3">
            <h3 className="text-md text-main font-semibold">Self study status</h3>
            <div className="flex items-center gap-2">
              <InfiniteScrollDatePicker
                onDateChange={(date) => setSelectedDate(date)}
                className=""
              />
              <select 
                value={selectedClassForChart}
                onChange={(e) => setSelectedClassForChart(e.target.value)}
                className="border border-gray-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-main"
              >
                <option value="">Select Class</option>
                {availableClasses.map((cls) => (
                  <option key={cls.class_id} value={cls.class_id}>
                    {cls.class_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bar chart */}
          <div className="h-64">
            {!selectedClassForChart ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-gray-400 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm font-medium">No class selected yet</p>
                  <p className="text-gray-400 text-xs mt-1">Please select a class to view self-study attendance data</p>
                </div>
              </div>
            ) : chartLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="period" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    wrapperStyle={{ pointerEvents: 'auto' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const total = (data.present || 0) + (data.absent || 0);
                        const canView = data.status === 'completed';

                        return (
                          <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                            <p className="font-semibold text-sm">{label}</p>
                            <p className="text-xs text-gray-600">{data.time}</p>
                            {data.status === 'completed' ? (
                              <>
                                <p className="text-xs text-green-600">Present: {data.present}</p>
                                <p className="text-xs text-red-600">Absent: {data.absent}</p>
                                <p className="text-xs text-gray-600">Total: {total}</p>
                                <button
                                  type="button"
                                  title={`Show self study attendance of ${data.period_display || data.period} on ${selectedDate} in ${getSelectedClassName()}`}
                                  onMouseDown={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    handleViewSelfStudyAttendance(data);
                                  }}
                                  disabled={!canView}
                                  className="mt-2 w-full px-2 py-1 text-xs rounded bg-main text-white hover:bg-main/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  View attendance
                                </button>
                              </>
                            ) : (
                              <p className="text-xs text-gray-500">Not recorded yet</p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="present" stackId="attendance" fill="#00402E" name="Present" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="absent" stackId="attendance" fill="#6B7280" name="Absent" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          
          {/* Legend */}
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 bg-main rounded-sm"></div>
              <span className="text-xs text-gray-600">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 bg-gray-500 rounded-sm"></div>
              <span className="text-xs text-gray-600">Absent</span>
            </div>
          </div>
          
          {chartData.length === 0 && !chartLoading && selectedClassForChart && (
            <div className="text-center text-gray-500 text-sm mt-4">
              No periods available for selected date
            </div>
          )}
        </div>

        {/* Recent Activities Timeline */}
        <div className="col-span-1 lg:col-span-2 border-2 border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <HiClipboardCheck className="w-4 h-4 text-gray-700" />
            <p className="text-md font-semibold text-main">Recent Activities</p>
          </div>
          
          {activitiesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-main"></div>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentActivities.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-md">
                  <div className="flex-shrink-0 w-2 h-2 bg-main rounded-full mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.text}
                      </p>
                      <span className="text-xs text-gray-500 ml-2">
                        {activity.time}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-600">
                        {activity.details}
                      </p>
                      <span className="text-xs text-gray-400">
                        {activity.date}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {recentActivities.length === 0 && !activitiesLoading && (
                <div className="text-center py-8">
                  <HiClipboardCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No recent activities</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedChartSession && (
        <SelfStudyAttendanceViewModal
          isOpen={viewAttendanceOpen}
          onClose={() => setViewAttendanceOpen(false)}
          sessionId={selectedChartSession.session_id || ''}
          classId={selectedClassForChart}
          className={getSelectedClassName()}
          period={selectedChartSession.period}
          periodDisplay={selectedChartSession.period_display || selectedChartSession.period}
          date={selectedDate}
          sessionNotes={selectedChartSession.notes}
        />
      )}

      {/* schedule component */}
      <div className="mt-6 p-4 border-2 border-gray-200 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-md font-semibold text-gray-900">Today's schedule</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadDisciplineSchedule();
                loadCurrentPeriodInfo();
              }}
              disabled={disciplineLoading}
              className="text-white bg-gray-600 rounded-md p-2 text-xs hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1"
            >
              <svg className={`w-3 h-3 ${disciplineLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {disciplineLoading ? 'Loading...' : 'Refresh'}
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`${showFilters
                ? 'bg-main text-white'
                : 'bg-white text-gray-700 border border-gray-300'
                } px-3 py-1.5 text-sm rounded-md flex items-center gap-2 hover:opacity-90 transition-colors`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </button>
            <button 
              onClick={handleExport}
              className="bg-main text-white px-3 py-1.5 text-sm rounded-md flex items-center gap-2 hover:bg-main/90"
            >
              <HiDownload className="w-3 h-3" />
              Export
            </button>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="mb-4 space-y-3">
          {/* Collapsible Filters */}
          {showFilters && (
            <div>
              <div className="flex gap-3 items-center mb-2">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="search class"
                    value={healthSearchValue}
                    onChange={(e) => setHealthSearchValue(e.target.value)}
                    onKeyPress={handleHealthSearchKeyPress}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-main focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleHealthSearch}
                  className="px-4 py-1.5 bg-main text-white text-sm rounded-md hover:bg-main/90 focus:outline-none focus:ring-2 focus:ring-main focus:ring-offset-2"
                >
                  Search
                </button>
              </div>

              <div className="flex gap-3 items-center p-3 bg-main/5 border border-main/20 rounded-md">
                <select
                  className="border border-gray-300 rounded px-2 py-1 text-xs"
                  value={tempFilters.selectedClass}
                  onChange={(e) => setTempFilters(prev => ({ ...prev, selectedClass: e.target.value }))}
                >
                  <option value="">Select class</option>
                  {disciplineClasses.map((classData) => (
                    <option key={classData.class_id} value={classData.class_id}>
                      {classData.class_name}
                    </option>
                  ))}
                </select>
                <select
                  className="border border-gray-300 rounded px-2 py-1 text-xs"
                  value={tempFilters.selectedStatus}
                  onChange={(e) => setTempFilters(prev => ({ ...prev, selectedStatus: e.target.value }))}
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="missed">Missed Out</option>
                </select>
                <select
                  className="border border-gray-300 rounded px-2 py-1 text-xs"
                  value={tempFilters.recordsPerPage}
                  onChange={(e) => setTempFilters(prev => ({ ...prev, recordsPerPage: Number(e.target.value) }))}
                >
                  <option value={5}>Show 5 rows</option>
                  <option value={10}>Show 10 rows</option>
                  <option value={20}>Show 20 rows</option>
                  <option value={50}>Show 50 rows</option>
                </select>
                <div className="flex gap-2 ml-auto">
                  <button
                    onClick={handleResetFilters}
                    className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50"
                  >
                    Reset
                  </button>
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
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-main text-white">
              <tr>
                <th className="px-3 py-2 text-left w-8">
                  <input type="checkbox" className="w-3 h-3 text-white bg-transparent border-white rounded" />
                </th>
                <th className="px-3 py-2 text-left font-medium text-xs">Class name</th>
                <th className="px-3 py-2 text-left font-medium text-xs">Period</th>
                <th className="px-3 py-2 text-left font-medium text-xs">Time</th>
                <th className="px-3 py-2 text-left font-medium text-xs">Supervisor</th>
                <th className="px-3 py-2 text-left font-medium text-xs">Status</th>
                <th className="px-3 py-2 text-left font-medium text-xs">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {disciplineLoading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-main mb-2"></div>
                      <p className="text-gray-500 text-xs">Loading classes...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredDisciplineClasses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center">
                    <p className="text-gray-500 text-xs">
                      {disciplineClasses.length === 0 ? 'No classes available' : 'No classes match your search criteria'}
                    </p>
                  </td>
                </tr>
              ) : (
                (() => {
                  // Generate all rows first
                  const allRows = filteredDisciplineClasses.flatMap((classData, classIdx) => {
                    const availablePeriods = getAvailablePeriodsForToday();

                    if (availablePeriods.length === 0) {
                      return [];
                    }

                    const supervisor = disciplineSupervisors[classIdx % disciplineSupervisors.length];
                    const supervisorName = supervisor
                      ? `${supervisor.first_name} ${supervisor.last_name}`
                      : 'No supervisor assigned';

                    return availablePeriods.map((period, periodIdx) => {
                      const status = getSessionStatus(classData.class_id, period.key);
                      const rowKey = `${classData.class_id}-${period.key}`;

                      return {
                        key: rowKey,
                        classData,
                        period,
                        periodIdx,
                        availablePeriods,
                        supervisorName,
                        status
                      };
                    });
                  });

                  // Apply pagination
                  const startIndex = (currentPage - 1) * appliedFilters.recordsPerPage;
                  const endIndex = startIndex + appliedFilters.recordsPerPage;
                  const paginatedRows = allRows.slice(startIndex, endIndex);

                  return paginatedRows.map(({ key, classData, period, periodIdx, availablePeriods, supervisorName, status }) => (
                    <tr key={key} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <input type="checkbox" className="w-3 h-3 text-main bg-white border-gray-300 rounded focus:ring-main" />
                      </td>
                      <td className="px-3 py-2 text-gray-900 text-xs">
                        {classData.class_name}
                        {periodIdx === 0 && availablePeriods.length > 1 && (
                          <span className="text-gray-400 text-xs ml-1">({availablePeriods.length} periods)</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-600 text-xs font-medium">
                        {period.display}
                      </td>
                      <td className="px-3 py-2 text-gray-500 text-xs">
                        {period.time}
                      </td>
                      <td className="px-3 py-2 text-gray-600 text-xs">{supervisorName}</td>
                      <td className="px-3 py-2 text-gray-600 text-xs">
                        {status.recorded ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                            Completed
                          </span>
                        ) : status.backendStatus === 'active' ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                            Pending
                          </span>
                        ) : status.backendStatus === 'missed' ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100">
                            Missed Out
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {status.recorded ? (
                          <button
                            onClick={() => handleViewAttendance(classData, period, status.session)}
                            className="bg-gray-500 text-white px-3 py-1 rounded text-xs hover:bg-gray-600"
                          >
                            View
                          </button>
                        ) : status.canRecord ? (
                          <button
                            onClick={() => handleRecordAttendance(classData, period)}
                            className="bg-main text-white px-3 py-1 rounded text-xs hover:bg-main/90"
                          >
                            Record
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">
                            {status.backendStatus === 'upcoming' ? 'Upcoming' :
                             status.backendStatus === 'missed' ? 'Missed' :
                             status.backendStatus === 'unavailable' ? 'Unavailable' :
                             'Pending'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ));
                })()
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls - Always show if there are filtered results */}
        {filteredDisciplineClasses.length > 0 && (() => {
          // Calculate total rows (classes × periods)
          const totalRows = filteredDisciplineClasses.reduce((total, _classData) => {
            const availablePeriods = getAvailablePeriodsForToday();
            return total + (availablePeriods.length > 0 ? availablePeriods.length : 1);
          }, 0);

          const totalPages = Math.ceil(totalRows / appliedFilters.recordsPerPage);
          const startIndex = (currentPage - 1) * appliedFilters.recordsPerPage + 1;
          const endIndex = Math.min(currentPage * appliedFilters.recordsPerPage, totalRows);

          if (totalPages <= 1) return null;

          return (
            <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {startIndex} to {endIndex} of {totalRows} entries
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export default DashboardDisciplineWidget;
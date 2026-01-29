import { HiUsers, HiClipboardCheck, HiRefresh } from "react-icons/hi";
import { FiDownload } from "react-icons/fi";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import PinnedTooltip from "../../shared/PinnedTooltip";
import DateRangePicker from "../../shared/DateRangePicker";
import { attendanceService } from "../../../services/attendanceService";
import { userService } from "../../../services/userService";
import { classService } from "../../../services/academicService";
import { useAuth } from "../../../utils/context/AuthContext";
import { useToast } from "../../../utils/context/ToastContext";
import { useState, useEffect } from "react";
import AttendanceActionsModal from "../../modals/attendance/TeacherAttendanceActions.modal";
import RecordAttendanceModal from "../../modals/attendance/RecordAttendance.modal";
import Role from "../../../utils/constants";
import StudentListViewModal from "../../modals/shared/StudentListView.modal";

export const homeTeacherPreviewIcons = [<HiUsers key="people1" />, <HiClipboardCheck key="present1" />, <HiUsers key="users" />, <HiClipboardCheck key="present2" />];

interface DashboardTeacherWidgetProps {
  // No props needed currently
}

type TeacherClassOption = {
  class_id: string;
  class_name: string;
  year_level?: number;
};

function DashboardTeacherWidget({}: DashboardTeacherWidgetProps) {
  const { user } = useAuth();
  const userRole = user?.role;
  const userId = user?.id;
  const { addToast } = useToast();

  // Today's schedule state
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Recent actions state
  const [recentActions, setRecentActions] = useState<any[]>([]);
  const [actionsLoading, setActionsLoading] = useState(false);

  // Chart data state
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [dateRangeSelected, setDateRangeSelected] = useState(false);
  const [classes, setClasses] = useState<TeacherClassOption[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [hoveredBar, setHoveredBar] = useState<any | null>(null);
  const [tooltipPinned, setTooltipPinned] = useState(false);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentModalTitle, setStudentModalTitle] = useState("");
  const [studentModalData, setStudentModalData] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<{
    startDate: Date;
    endDate: Date;
  }>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)), // Last 7 days
    endDate: new Date()
  });
  const [showFilters, setShowFilters] = useState(false);

  // Attendance recording modal state
  const [recordAttendanceModalOpen, setRecordAttendanceModalOpen] = useState(false);
  const [selectedClassInfo, setSelectedClassInfo] = useState<{
    className: string;
    subject: string;
    period: string;
    day: string;
    classId?: string;
    date?: string;
  } | null>(null);
  const [attendanceViewOnly, setAttendanceViewOnly] = useState(false);

  // Actions modal state
  const [actionsModalOpen, setActionsModalOpen] = useState(false);
  const [selectedPeriodForActions, setSelectedPeriodForActions] = useState<{
    teacherId: string;
    timetableRosterId: string;
    classId: string;
    className: string;
    subject: string;
    period: string;
    date: string;
    periodNumber: number;
    startTime: string;
    endTime: string;
    category: string;
    can_record: boolean;
    can_view: boolean;
    recorded_attendance: number;
  } | null>(null);

  useEffect(() => {
    // Load today's schedule for teachers
    if (userRole === Role.TEACHER && userId) {
      loadTodaySchedule();
      loadAttendanceChartData();
      loadRecentActions();
      loadTeacherClasses();
    }
  }, [userRole, userId]);

  useEffect(() => {
    // Reload chart data when date range changes
    if (userRole === Role.TEACHER && userId) {
      loadAttendanceChartData();
    }
  }, [dateRange, userRole, userId, selectedClassId]);

  useEffect(() => {
    if (!tooltipPinned) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".pinned-tooltip")) return;
      setTooltipPinned(false);
      setHoveredBar(null);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [tooltipPinned]);

  const loadRecentActions = async () => {
    try {
      setActionsLoading(true);
      const response = await userService.getRecentActions(6);

      if (response.success && response.data) {
        setRecentActions(response.data);
      } else {
        setRecentActions([]);
        addToast({
          message: response.message || 'Failed to load recent actions',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Failed to load recent actions:', error);
      setRecentActions([]);
      addToast({
        message: 'Failed to load recent actions',
        type: 'error'
      });
    } finally {
      setActionsLoading(false);
    }
  };

  const loadAttendanceChartData = async () => {
    if (!user?.id) return;

    try {
      setChartLoading(true);

      // Fix timezone issue - use local date formatting instead of toISOString()
      const startDate = `${dateRange.startDate.getFullYear()}-${String(dateRange.startDate.getMonth() + 1).padStart(2, '0')}-${String(dateRange.startDate.getDate()).padStart(2, '0')}`;
      const endDate = `${dateRange.endDate.getFullYear()}-${String(dateRange.endDate.getMonth() + 1).padStart(2, '0')}-${String(dateRange.endDate.getDate()).padStart(2, '0')}`;

      const response = await attendanceService.getTeacherAttendanceChart(
        user.id,
        startDate,
        endDate,
        selectedClassId === "all" ? undefined : selectedClassId
      );

      if (response.success && response.data) {
        setChartData(response.data);
      } else {
        setChartData([]);
        addToast({
          message: response.message || 'Failed to load attendance chart data',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Failed to load attendance chart data:', error);
      setChartData([]);
      addToast({
        message: 'Failed to load attendance chart data',
        type: 'error'
      });
    } finally {
      setChartLoading(false);
    }
  };

  const loadTodaySchedule = async () => {
    if (!user?.id) return;

    try {
      setScheduleLoading(true);
      const response = await attendanceService.getTeacherTodaySchedule(user.id);

      if (response.success) {
        setTodaySchedule(response.data || []);
      } else {
        setTodaySchedule([]);
        addToast({
          message: 'Failed to load today\'s schedule',
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Failed to load today\'s schedule:', err);
      setTodaySchedule([]);
      addToast({
        message: err instanceof Error ? err.message : 'Failed to load today\'s schedule',
        type: 'error'
      });
    } finally {
      setScheduleLoading(false);
    }
  };

  const loadTeacherClasses = async () => {
    try {
      setClassesLoading(true);
      const response = await classService.getClasses();

      if (response.success && response.data) {
        setClasses(response.data as TeacherClassOption[]);
      } else {
        setClasses([]);
      }
    } catch (error) {
      console.error('Failed to load teacher classes:', error);
      setClasses([]);
    } finally {
      setClassesLoading(false);
    }
  };

  const handleRecordAttendanceModalClose = () => {
    setRecordAttendanceModalOpen(false);
    setSelectedClassInfo(null);
    setAttendanceViewOnly(false);

    // Refresh today's schedule to update status after recording
    if (user?.role === Role.TEACHER && user?.id) {
      loadTodaySchedule();
    }
  };

  const handleOpenRecordAttendance = (classInfo: {
    className: string;
    subject: string;
    period: string;
    day: string;
    classId: string;
  }, viewOnly: boolean) => {
    setSelectedClassInfo(classInfo);
    setAttendanceViewOnly(viewOnly);
    setRecordAttendanceModalOpen(true);
  };

  const handleOpenActions = (scheduleItem: any) => {
    if (!user?.id) {
      addToast({
        message: 'User information not available',
        type: 'error'
      });
      return;
    }

    const currentDate = new Date().toISOString().split('T')[0];

    setSelectedPeriodForActions({
      teacherId: user.id,
      timetableRosterId: scheduleItem.slot_id || scheduleItem.timetable_roster_id,
      classId: scheduleItem.class_id,
      className: scheduleItem.class_name,
      subject: scheduleItem.subject,
      period: scheduleItem.period,
      date: currentDate,
      periodNumber: parseInt(scheduleItem.period.replace('Period ', '')),
      startTime: scheduleItem.period_time?.split(' - ')[0] || '08:00',
      endTime: scheduleItem.period_time?.split(' - ')[1] || '09:00',
      category: scheduleItem.category,
      can_record: scheduleItem.can_record || false,
      can_view: scheduleItem.can_view || false,
      recorded_attendance: scheduleItem.recorded_attendance || 0
    });

    setActionsModalOpen(true);
  };

  const handleActionsModalClose = () => {
    setActionsModalOpen(false);
    setSelectedPeriodForActions(null);
  };

  const handleActionsModalSuccess = () => {
    // Refresh today's schedule to update status
    if (user?.role === Role.TEACHER && user?.id) {
      loadTodaySchedule();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const handleDateRangeChange = (startDate: Date, endDate: Date) => {
    setDateRange({ startDate, endDate });
    setDateRangeSelected(true);
  };

  const handleClassChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClassId(event.target.value);
    setDateRangeSelected(true);
  };

  const handleBarHover = (payload: any, dataKey?: string, fill?: string) => {
    if (!payload) return;
    const key = dataKey ?? payload.dataKey;
    const name = key ? `${key.charAt(0).toUpperCase()}${key.slice(1)}` : payload.name;
    const value = key ? payload[key] : payload.value ?? payload.count;
    setHoveredBar({
      name,
      value,
      color: fill ?? payload.fill,
      payload: {
        ...payload,
        dataKey: key
      }
    });
  };

  const handleBarLeave = () => {
    if (tooltipPinned) return;
    setHoveredBar(null);
  };

  const handleBarChartClick = () => {
    setTooltipPinned(false);
    setHoveredBar(null);
  };

  const openStudentModal = (title: string, students: any[]) => {
    setStudentModalTitle(title);
    setStudentModalData(students);
    setStudentModalOpen(true);
  };

  const closeStudentModal = () => {
    setStudentModalOpen(false);
  };

  const loadAllClassesAttendance = async (payload: any) => {
    if (!payload?.raw_date) {
      addToast({ message: "Attendance date is not available.", type: "error" });
      return;
    }
    if (classes.length === 0) {
      addToast({ message: "No classes available to view attendance.", type: "info" });
      return;
    }

    try {
      const attendanceResponses = await Promise.allSettled(
        classes.map((classItem) =>
          attendanceService.getAttendanceByDate(classItem.class_id, payload.raw_date)
        )
      );

      const students = attendanceResponses.flatMap((result, index) => {
        if (result.status !== "fulfilled" || !result.value?.success || !result.value?.data?.students) {
          return [];
        }

        const className = result.value.data.class_name || classes[index]?.class_name || "Class";

        return result.value.data.students.map((student: any) => {
          const status = student.status
            ? student.status.toString()
            : (student.is_present ? "present" : student.is_sick ? "sick" : "absent");
          const label = status.charAt(0).toUpperCase() + status.slice(1);

          return {
            name: `${student.first_name} ${student.last_name}`,
            classroom: className,
            reason: label,
            email: student.email,
            gender: student.gender,
            notes: student.notes,
            recorded_at: student.attendance_recorded_at
          };
        });
      });

      if (students.length === 0) {
        addToast({ message: "No attendance records found for the selected date.", type: "info" });
        return;
      }

      openStudentModal(`Attendance list (${payload.date})`, students);
    } catch (error) {
      console.error("Failed to load attendance for all classes:", error);
      addToast({ message: "Failed to load attendance for all classes.", type: "error" });
    }
  };

  const loadAttendanceStudents = async (payload: any) => {
    if (!payload?.raw_date) {
      addToast({ message: "Attendance date is not available.", type: "error" });
      return;
    }
    if (selectedClassId === "all") {
      await loadAllClassesAttendance(payload);
      return;
    }

    const selectedClass = classes.find((classItem) => classItem.class_id === selectedClassId);

    setSelectedClassInfo({
      className: selectedClass?.class_name || "Selected class",
      subject: "",
      period: "",
      day: "",
      classId: selectedClassId,
      date: payload.raw_date
    });
    setAttendanceViewOnly(true);
    setRecordAttendanceModalOpen(true);
  };

  return (
    <div className="px-10 mt-8 mb-6">
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Student attendance chart */}
        <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Student attendance</h2>
              <button
                type="button"
                onClick={() => setShowFilters((prev) => !prev)}
                className={`text-xs font-medium text-main border border-main/40 rounded px-2.5 py-1 transition-colors ${showFilters ? "bg-main text-white hover:bg-main-hover" : "bg-white text-main hover:bg-gray-100"}`}
              >
                {showFilters ? "Hide filters" : "Show filters"}
              </button>
            </div>
            {showFilters && (
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-[.8rem] text-main">Class:</label>
                <select
                  value={selectedClassId}
                  onChange={handleClassChange}
                  disabled={classesLoading}
                  className="min-w-[160px] rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-main"
                >
                  <option value="all">All classes</option>
                  {classes.map((classItem) => (
                    <option key={classItem.class_id} value={classItem.class_id}>
                      {classItem.class_name}
                    </option>
                  ))}
                </select>
                <label className="text-[.8rem] text-main">Select Date range : </label>
                <DateRangePicker
                  placeholder="Select date range"
                  onDateRangeChange={handleDateRangeChange}
                  className="min-w-[200px]"
                />
              </div>
            )}
          </div>

          <div className="h-96">
            {!dateRangeSelected ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-gray-400 text-4xl mb-3">📊</div>
                  <p className="text-gray-500 text-sm">Select a date range to view attendance data</p>
                  <p className="text-gray-400 text-xs mt-1">Use the date picker above to get started</p>
                </div>
              </div>
            ) : chartLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main"></div>
                <span className="ml-2 text-gray-500">Loading chart data...</span>
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-gray-400 text-4xl mb-3">📈</div>
                  <p className="text-gray-500 text-sm">No attendance data found</p>
                  <p className="text-gray-400 text-xs mt-1">Try selecting a different date range</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  barCategoryGap="20%"
                  margin={{ top: 40, right: 30, left: 20, bottom: 40 }}
                  onClick={handleBarChartClick}
                  onMouseMove={(state) => {
                    const activePayload = (state as any)?.activePayload?.[0];
                    if (activePayload?.payload) {
                      handleBarHover(activePayload.payload, activePayload.dataKey, activePayload.fill);
                    }
                  }}
                  onMouseLeave={handleBarLeave}
                >
                  <PinnedTooltip
                    hoveredSlice={hoveredBar}
                    pinned={tooltipPinned}
                    onPinChange={setTooltipPinned}
                    total={(hoveredBar?.payload?.present || 0) + (hoveredBar?.payload?.absent || 0)}
                    actionNames={["Present", "Absent"]}
                    onAction={(payload) => {
                      if (payload) {
                        loadAttendanceStudents(payload);
                      }
                    }}
                    actionLabel={() => "View attendance"}
                    itemLabel="students"
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <Legend />
                  <Bar
                    dataKey="present"
                    fill="#062350"
                    name="Present"
                    barSize={20}
                    onMouseEnter={(data) => handleBarHover((data as any)?.payload ?? data, "present", "#062350")}
                    onMouseLeave={handleBarLeave}
                  />
                  <Bar
                    dataKey="absent"
                    fill="#1048c5"
                    name="Absent"
                    barSize={20}
                    onMouseEnter={(data) => handleBarHover((data as any)?.payload ?? data, "absent", "#1048c5")}
                    onMouseLeave={handleBarLeave}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Actions */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-md font-semibold text-gray-900">Recent Actions</h2>
            <button
              onClick={loadRecentActions}
              className="text-main text-sm hover:underline"
            >
              refresh
            </button>
          </div>
          <div className="space-y-3">
            {actionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-main"></div>
                <span className="ml-2 text-gray-500 text-sm">Loading...</span>
              </div>
            ) : recentActions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-2xl mb-2">📋</div>
                <p className="text-gray-500 text-sm">No recent actions</p>
              </div>
            ) : (
              recentActions.map((action, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
                  <div className="w-2 h-2 bg-main rounded-full flex-shrink-0 mt-2"></div>
                  <div className="flex flex-col flex-1">
                    <p className="text-[.8rem] text-gray-700 leading-relaxed">{action.message}</p>
                    <span className="text-[.68rem] font-medium text-gray-400 mt-1">
                      {formatTimestamp(action.timestamp)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center p-3 border-b border-gray-200">
          <div>
            <h2 className="text-md font-semibold text-gray-900">Today's schedule</h2>
            <p className="text-xs text-gray-500 mt-1">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadTodaySchedule}
              disabled={scheduleLoading}
              className="bg-main text-white px-3 py-2.5 rounded text-xs font-medium hover:bg-main/75 flex gap-2 disabled:opacity-50"
            >
              <HiRefresh className={scheduleLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button className="bg-main text-white px-3 py-2.5 rounded text-xs font-medium hover:bg-main/75 flex gap-2">
              <FiDownload />
              Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Period</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Time</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Class</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Subject</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Total</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Recorded</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scheduleLoading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-main mb-2"></div>
                      <p className="text-gray-500 text-xs">Loading today's schedule...</p>
                    </div>
                  </td>
                </tr>
              ) : todaySchedule.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-gray-400 text-4xl mb-2">📅</div>
                      <p className="text-gray-500 text-xs">No classes scheduled for today</p>
                    </div>
                  </td>
                </tr>
              ) : (
                todaySchedule.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{item.period}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">{item.period_time || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{item.class_name}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{item.subject}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">{item.total_students}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                      {item.recorded_attendance > 0 ? (
                        <span className="inline-flex items-center gap-1 text-gray-400">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-400">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      <span className={`px-2 py-1 rounded text-[.8rem] font-medium ${item.category === 'PENDING' ? 'bg-main text-white' :
                        item.category === 'PERMISSION_GRANTED' ? 'bg-green-100 text-green-700' :
                        item.category === 'PERMISSION_DENIED' ? 'bg-red-100 text-red-700' :
                        item.category === 'PENDING_REQUEST' ? 'bg-amber-100 text-amber-700' :
                        item.category === 'YET_TO_START' ? 'bg-gray-100 text-gray-800' :
                        item.category === 'COMPLETED' ? 'bg-main/20 text-main' :
                        item.category === 'MISSED' ? 'bg-gray-200 text-gray-800' :
                        item.category === 'PAST_DAY' ? 'bg-gray-100 text-gray-800' :
                        item.category === 'FUTURE' ? 'bg-gray-100 text-gray-800' :
                        item.category === 'ERROR' ? 'bg-gray-100 text-gray-800' :
                        'bg-gray-100 text-gray-800'
                        }`}>
                        {item.category === 'PENDING' ? 'Can Record Now' :
                          item.category === 'PERMISSION_GRANTED' ? 'Record Allowed' :
                            item.category === 'PERMISSION_DENIED' ? 'Request Denied' :
                              item.category === 'PENDING_REQUEST' ? 'Missed/Pending' :
                                item.category === 'YET_TO_START' ? 'Upcoming' :
                                  item.category === 'COMPLETED' ? 'Completed' :
                                    item.category === 'MISSED' ? 'Missed/Overtime' :
                                      item.category === 'PAST_DAY' ? 'Past Day' :
                                        item.category === 'FUTURE' ? 'Future' :
                                          item.category === 'ERROR' ? 'Check Status' :
                                            'Refresh Needed'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      <button
                        onClick={() => handleOpenActions(item)}
                        className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-main hover:text-white hover:border-main transition-colors"
                        title="View available actions for this period"
                      >
                        Available Actions
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Attendance Modal (Time-based) */}
      <RecordAttendanceModal
        open={recordAttendanceModalOpen}
        onClose={handleRecordAttendanceModalClose}
        onRefresh={() => {
          // Refresh today's schedule after recording attendance
          if (user?.role === Role.TEACHER && user?.id) {
            loadTodaySchedule();
          }
        }}
        classInfo={selectedClassInfo || undefined}
        viewOnly={attendanceViewOnly}
      />

      <StudentListViewModal
        isOpen={studentModalOpen}
        onClose={closeStudentModal}
        title={studentModalTitle}
        students={studentModalData}
      />

      {/* Actions Modal */}
      {selectedPeriodForActions && (
        <AttendanceActionsModal
          isOpen={actionsModalOpen}
          onClose={handleActionsModalClose}
          onSuccess={handleActionsModalSuccess}
          onOpenRecordAttendance={handleOpenRecordAttendance}
          periodInfo={selectedPeriodForActions}
        />
      )}
    </div>
  );
}

export default DashboardTeacherWidget;
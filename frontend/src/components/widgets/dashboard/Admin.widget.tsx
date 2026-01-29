import { AbsentSampleCards, ReviewCards, SickStudentCards } from "../../cards/Dashboard.cards";
import { HiAcademicCap, HiBell, HiClipboardCheck, HiUsers } from "react-icons/hi";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import PinnedTooltip from "../../shared/PinnedTooltip";

import { useEffect, useMemo, useState } from "react";
import StudentListViewModal from "../../modals/shared/StudentListView.modal";
import { apiClient } from "../../../utils/apiClient";
import { attendanceService } from "../../../services/attendanceService";
import { useToast } from "../../../utils/context/ToastContext";
import type { IAabsentStudent } from "../../views/DashboardView";

export const remainderIcon = [
  <HiClipboardCheck key="present" />,
  <HiAcademicCap key="classroom" />,
  <HiBell key="notifications" />,
];

export const homeTeacherPreviewIcons = [
  <HiUsers key="people1" />,
  <HiClipboardCheck key="present1" />,
  <HiUsers key="users" />,
  <HiClipboardCheck key="present2" />,
];

interface AdminDashboardData {
  attendance_overview: {
    present: number;
    absent: number;
    sick: number;
    total: number;
    attendance_rate: number;
  };
  class_stats: {
    total_classes: number;
    classes_without_active_timetable?: number;
  };
  user_stats: {
    total_teachers: number;
    total_students: number;
  };
}

interface ClassData {
  class_id: string;
  class_name: string;
  year_level: number;
  is_active: boolean;
}

interface PeriodData {
  roster_id: string;
  period: number;
  period_time: string;
  course_name: string;
  teacher_name: string;
  teacher_id: string;
  status: "completed" | "pending" | "missed" | "future";
  recorded_at?: string;
}

interface AttendanceGraphData {
  present: number;
  absent: number;
  total: number;
  period: number;
  period_time: string;
  course_name: string;
  teacher_name: string;
  recorded_at?: string;
  status: "completed" | "no_data" | "error";
}

interface DashboardAdminWidgetProps {
  openModal?: (title: string, students: IAabsentStudent[]) => void;
}

type ModalData = { title: string; students: IAabsentStudent[] };

function DashboardAdminWidget({ openModal: parentOpenModal }: DashboardAdminWidgetProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<ModalData>({ title: "", students: [] });
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [sickStudentsData, setSickStudentsData] = useState<any[]>([]);
  const [absentStudentsData, setAbsentStudentsData] = useState<any[]>([]);
  const [selfStudyDate, setSelfStudyDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selfStudyClass, setSelfStudyClass] = useState<string>("");
  const [selfStudyPeriod, setSelfStudyPeriod] = useState<string>("");
  const [selfStudyData, setSelfStudyData] = useState<any>(null);
  const [selfStudyLoading, setSelfStudyLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [periods, setPeriods] = useState<PeriodData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [graphData, setGraphData] = useState<AttendanceGraphData | null>(null);
  const [graphLoading, setGraphLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<any | null>(null);
  const [tooltipPinned, setTooltipPinned] = useState(false);
  const [selfStudyHoveredSlice, setSelfStudyHoveredSlice] = useState<any | null>(null);
  const [selfStudyTooltipPinned, setSelfStudyTooltipPinned] = useState(false);

  useEffect(() => {
    loadDashboardData();
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedDate) {
      loadPeriods();
    }
  }, [selectedClass, selectedDate]);

  useEffect(() => {
    if (selectedClass && selectedPeriod && selectedDate) {
      loadGraphData();
    }
  }, [selectedClass, selectedPeriod, selectedDate]);

  useEffect(() => {
    if (selfStudyClass && selfStudyDate && selfStudyPeriod) {
      loadSelfStudyData();
    }
  }, [selfStudyClass, selfStudyDate, selfStudyPeriod]);

  useEffect(() => {
    setSelfStudyPeriod("");
    setSelfStudyData(null);
  }, [selfStudyDate]);

  const getAvailablePeriodsFromDate = (dateString: string): string[] => {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay();

    switch (dayOfWeek) {
      case 1:
      case 2:
      case 3:
      case 4:
        return ["morning_prep", "evening_prep"];
      case 5:
        return ["morning_prep"];
      case 6:
        return ["saturday_extended_prep"];
      case 0:
        return ["evening_prep"];
      default:
        return [];
    }
  };

  const getPeriodDisplayName = (period: string): string => {
    switch (period) {
      case "morning_prep":
        return "Morning Prep (7:00 - 8:30 AM)";
      case "evening_prep":
        return "Evening Prep (7:30 - 10:00 PM)";
      case "saturday_extended_prep":
        return "Saturday Extended Prep (10:00 AM - 12:00 PM)";
      default:
        return "Unknown Period";
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      try {
        const dashboardResponse = await apiClient.get("/api/dashboard/admin");
        if (dashboardResponse.status === "success") {
          setDashboardData(dashboardResponse.data);
        } else {
          addToast({
            message: "Failed to load dashboard statistics - invalid response",
            type: "error",
          });
        }
      } catch (dashboardError) {
        console.error("Failed to load dashboard data:", dashboardError);
        addToast({
          message: `Failed to load dashboard statistics: ${(dashboardError as any).message || "Unknown error"}`,
          type: "error",
        });
      }

      try {
        const absentResponse = await apiClient.get("/api/dashboard/absent-students");
        if (absentResponse.status === "success") {
          setAbsentStudentsData(absentResponse.data || []);
        }
      } catch (absentError) {
        console.error("Failed to load absent students:", absentError);
        addToast({ message: "Failed to load absent students data", type: "error" });
      }

      try {
        const sickResponse = await apiClient.get("/api/dashboard/sick-students");
        if (sickResponse.status === "success") {
          setSickStudentsData(sickResponse.data || []);
        }
      } catch (sickError) {
        console.error("Failed to load sick students:", sickError);
        addToast({ message: "Failed to load sick students data", type: "error" });
      }
    } catch (error) {
      console.error("General error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await apiClient.get("/api/dashboard/classes");
      if (response.status === "success") {
        setClasses(response.data);
      }
    } catch (error) {
      console.error("Failed to load classes:", error);
      addToast({ message: "Failed to load classes", type: "error" });
    }
  };

  const loadPeriods = async () => {
    if (!selectedClass || !selectedDate) return;

    try {
      const response = await apiClient.post("/api/dashboard/timetable-periods", {
        class_id: selectedClass,
        date: selectedDate,
      });

      if (response.status === "success") {
        setPeriods(response.data);
        setSelectedPeriod("");
        setGraphData(null);
      }
    } catch (error) {
      console.error("Failed to load periods:", error);
      addToast({ message: "Failed to load timetable periods", type: "error" });
    }
  };

  const loadGraphData = async () => {
    if (!selectedClass || !selectedPeriod || !selectedDate) return;

    try {
      setGraphLoading(true);
      const response = await apiClient.post("/api/dashboard/attendance-graph", {
        class_id: selectedClass,
        period_id: selectedPeriod,
        date: selectedDate,
      });

      if (response.status === "success") {
        setGraphData(response.data);
      }
    } catch (error) {
      console.error("Failed to load graph data:", error);
      addToast({ message: "Failed to load attendance data", type: "error" });
    } finally {
      setGraphLoading(false);
    }
  };

  const loadSelfStudyData = async () => {
    if (!selfStudyClass || !selfStudyDate || !selfStudyPeriod) return;

    try {
      setSelfStudyLoading(true);
      const response = await apiClient.post("/api/dashboard/self-study-attendance", {
        class_id: selfStudyClass,
        date: selfStudyDate,
        period: selfStudyPeriod,
      });

      if (response.status === "success") {
        setSelfStudyData(response.data);
      }
    } catch (error) {
      console.error("Failed to load self-study data:", error);
      addToast({ message: "Failed to load self-study attendance data", type: "error" });
    } finally {
      setSelfStudyLoading(false);
    }
  };

  const getAdminCardsData = () => {
    if (!dashboardData) {
      return [
        { title: "Present", date: "Today", numbers: "0", comment: "Loading..." },
        { title: "Absent", date: "Today", numbers: "0", comment: "Loading..." },
        { title: "Classes without Timetable", date: "Total", numbers: "0", comment: "No active timetable" },
        { title: "Classes", date: "Total", numbers: "0", comment: "Loading..." },
      ];
    }

    const { attendance_overview, class_stats, user_stats } = dashboardData;
    const safeAttendance = attendance_overview || {};
    const safeClassStats = class_stats || {};
    const safeUserStats = user_stats || {};

    return [
      {
        title: "Present",
        date: "Today",
        numbers: (safeAttendance.present || 0).toString(),
        comment: `${safeAttendance.attendance_rate || 0}% attendance rate`,
      },
      {
        title: "Absent",
        date: "Today",
        numbers: (safeAttendance.absent || 0).toString(),
        comment: `${safeAttendance.total > 0 ? Math.round((safeAttendance.absent / safeAttendance.total) * 100) : 0}% of total`,
      },
      {
        title: "Classes without Timetable",
        date: "Total",
        numbers: (safeClassStats.classes_without_active_timetable || 0).toString(),
        comment: "No active timetable",
      },
      {
        title: "Classes",
        date: "Total",
        numbers: (safeClassStats.total_classes || 0).toString(),
        comment: `${safeUserStats.total_teachers || 0} teachers assigned`,
      },
    ];
  };

  const selectedPeriodDetails = useMemo(
    () => periods.find((period) => period.roster_id === selectedPeriod),
    [periods, selectedPeriod]
  );

  const renderPieLabel = ({ name, percent }: { name?: string; percent?: number }) => {
    if (!name || !percent) return "";
    return `${name}: ${Math.round(percent * 100)}%`;
  };

  const openModal = (title: string, students: IAabsentStudent[]) => {
    if (parentOpenModal) {
      parentOpenModal(title, students);
    } else {
      setModalData({ title, students });
      setModalOpen(true);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const loadAttendanceStudents = async (status: "Present" | "Absent") => {
    if (!selectedClass || !selectedDate || !graphData) return;

    try {
      const periodLabel = graphData.period ? `Period ${graphData.period}` : undefined;
      const queryParams = new URLSearchParams();
      if (periodLabel) queryParams.append("period", periodLabel);
      if (graphData.course_name) queryParams.append("subject", graphData.course_name);

      const response = await apiClient.get(
        `/api/attendance/class/${selectedClass}/date/${selectedDate}?${queryParams.toString()}`
      );

      if (response.success && response.data?.students) {
        const classroom = response.data.class_name || "";
        const filtered = response.data.students
          .filter((student: any) => student.status === status.toLowerCase())
          .map((student: any) => ({
            name: `${student.first_name} ${student.last_name}`,
            classroom,
            reason: status,
            notes: student.notes,
            recorded_at: student.attendance_recorded_at ?? response.data.record_created_at,
          }));

        openModal(`${status} students - ${classroom || "Selected class"}`, filtered);
      } else {
        addToast({ message: `No ${status.toLowerCase()} students found`, type: "info" });
      }
    } catch (error) {
      console.error(`Failed to load ${status.toLowerCase()} students:`, error);
      addToast({ message: `Failed to load ${status.toLowerCase()} students`, type: "error" });
    }
  };

  const handleBarHover = (payload: any) => {
    if (!payload) return;
    if (hoveredBar && hoveredBar.name === payload.name && hoveredBar.value === payload.count) return;

    setHoveredBar({
      name: payload.name,
      value: payload.count,
      color: payload.fill,
      payload,
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

  const loadSelfStudyStudents = async (status: "present" | "absent") => {
    if (!selfStudyDate) return;

    try {
      const response = await attendanceService.getSelfStudyAttendanceStatusStudents({
        status,
        start_date: selfStudyDate,
        end_date: selfStudyDate,
        class_id: selfStudyClass || undefined
      });

      if (response.success && response.data?.length) {
        const selectedClassName = classes.find((cls) => cls.class_id === selfStudyClass)?.class_name;
        const fallbackClassroom = selfStudyData?.class_name || selectedClassName || "Selected class";
        const titleStatus = status === "present" ? "Present" : "Absent";

        const students = response.data.map((student) => ({
          name: student.student_name,
          classroom: selectedClassName || (student as any).class_name || fallbackClassroom,
          reason: titleStatus,
          notes: student.notes
        }));
        openModal(`Self-study ${titleStatus} students - ${fallbackClassroom}`, students);
      } else {
        addToast({ message: `No ${status} students found for this session`, type: "info" });
      }
    } catch (error) {
      console.error("Failed to load self-study students:", error);
      addToast({ message: "Failed to load self-study students", type: "error" });
    }
  };

  const handleSelfStudySliceHover = (slice: any) => {
    if (!slice) return;
    const payload = slice.payload ?? slice;
    setSelfStudyHoveredSlice({
      payload,
      name: slice.name ?? payload.name,
      value: slice.value ?? payload.value,
      color: payload.color ?? slice.color ?? payload.fill,
    });
  };

  const handleSelfStudySliceLeave = () => {
    if (selfStudyTooltipPinned) return;
    setSelfStudyHoveredSlice(null);
  };

  const handleSelfStudyChartClick = () => {
    setSelfStudyTooltipPinned(false);
    setSelfStudyHoveredSlice(null);
  };

  useEffect(() => {
    if (!selfStudyTooltipPinned) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".pinned-tooltip")) return;
      setSelfStudyTooltipPinned(false);
      setSelfStudyHoveredSlice(null);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [selfStudyTooltipPinned]);

  const adminCards = getAdminCardsData();

  return (
    <div className="flex flex-col gap-6 m-10 my-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {adminCards.map((card, index) => (
          <ReviewCards
            key={`${card.title}-${index}`}
            title={card.title}
            date={card.date}
            numbers={card.numbers}
            comment={card.comment}
            icon={homeTeacherPreviewIcons[index]}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white border-2 border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-[0.98rem]">Attendance snapshot</h3>
              <p className="text-xs text-gray-500">Track class attendance by period and date.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className={`font-semibold text-[.8rem] px-3 py-2 rounded-md ${showFilters ? "text-white bg-main" : "text-main bg-gray-200"}`}
            >
              {showFilters ? "Hide filters" : "Filters"}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <select
                  value={selectedClass}
                  onChange={(event) => setSelectedClass(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a class</option>
                  {classes.map((cls) => (
                    <option key={cls.class_id} value={cls.class_id}>
                      {cls.class_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-[.8rem] font-medium text-gray-700 mb-1">Period</label>
                <select
                  value={selectedPeriod}
                  onChange={(event) => setSelectedPeriod(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!periods.length}
                >
                  <option value="" className="text-[.8rem]">Select a period</option>
                  {periods.map((period) => (
                    <option key={period.roster_id} value={period.roster_id}>
                      {`Period ${period.period} • ${period.course_name}`}
                      <span>{period.status === "completed" || period.recorded_at ? " ✓" : ""}</span>
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="mt-6 h-[420px]">
            {graphLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-gray-500">Loading attendance data...</p>
                </div>
              </div>
            ) : graphData && graphData.status !== "no_data" ? (
              <div className="h-full flex flex-col">
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    {selectedPeriodDetails?.course_name ? (
                      <span className="font-medium text-gray-900">{selectedPeriodDetails.course_name}</span>
                    ) : (
                      <span className="font-medium text-gray-900">Selected period</span>
                    )}
                    {selectedPeriodDetails?.teacher_name && (
                      <span className="text-gray-600 ml-2">by {selectedPeriodDetails.teacher_name}</span>
                    )}
                  </p>
                  {graphData.recorded_at && (
                    <p className="text-xs text-gray-500">Recorded: {new Date(graphData.recorded_at).toLocaleString()}</p>
                  )}
                </div>

                <ResponsiveContainer width="100%" height="85%">
                  <BarChart
                    data={[
                      { name: "Present", count: graphData.present, fill: "#001240" },
                      { name: "Absent", count: graphData.absent, fill: "#b92020" },
                    ]}
                    barSize={50}
                    margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
                    className="outline-none"
                    onClick={handleBarChartClick}
                    onMouseMove={(state) => {
                      const payload = (state as any)?.activePayload?.[0]?.payload;
                      if (payload) {
                        handleBarHover(payload);
                      }
                    }}
                    onMouseLeave={handleBarLeave}
                  >
                    <PinnedTooltip
                      hoveredSlice={hoveredBar}
                      pinned={tooltipPinned}
                      onPinChange={setTooltipPinned}
                      total={graphData.total || graphData.present + graphData.absent}
                      actionNames={["Present", "Absent"]}
                      onAction={(payload) => {
                        if (payload?.name === "Present") {
                          loadAttendanceStudents("Present");
                        }
                        if (payload?.name === "Absent") {
                          loadAttendanceStudents("Absent");
                        }
                      }}
                      actionLabel={(label) => `View ${label} list`}
                    />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tickLine axisLine tick={{ fontSize: 12, fill: "#6b7280" }} />
                    <YAxis
                      tickLine
                      axisLine
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      domain={[0, "dataMax + 5"]}
                    />
                    <Bar
                      dataKey="count"
                      radius={[4, 4, 0, 0]}
                      onMouseEnter={(data) => handleBarHover((data as any)?.payload ?? data)}
                      onMouseLeave={handleBarLeave}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : !showFilters ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-gray-500 mb-2">Enable filters to select class and period.</p>
                  <p className="text-sm text-gray-400">Choose a class, date, and period to view attendance.</p>
                </div>
              </div>
            ) : selectedClass && selectedPeriod ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-gray-500 mb-2">No attendance data found.</p>
                  <p className="text-sm text-gray-400">
                    {graphData?.status === "no_data" ? "Attendance not recorded for this period" : "Please check your selection"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-gray-500 mb-2">Select filters to view attendance data.</p>
                  <p className="text-sm text-gray-400">Choose a class and period from the filters above.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex gap-3 justify-between">
            <h3 className="font-semibold mb-2 text-[0.98rem]">Absence today</h3>
            <button
              onClick={async () => {
                try {
                  const response = await apiClient.get("/api/dashboard/absent-students/all");
                  if (response.status === "success") {
                    const allAbsentStudents = response.data.map((student: any) => ({
                      name: `${student.first_name} ${student.last_name}`,
                      classroom: student.class_name,
                      reason: student.reason,
                      recorded_at: student.marked_absent_at,
                    }));
                    openModal("Absent students - Today", allAbsentStudents);
                  }
                } catch (error) {
                  console.error("Failed to load all absent students:", error);
                  addToast({ message: "Failed to load all absent students", type: "error" });
                }
              }}
              className="font-semibold mb-2 text-main hover:underline cursor-pointer"
            >
              see all
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 mt-6">
            {absentStudentsData.slice(0, 4).map((student, idx) => (
              <AbsentSampleCards
                key={`${student.first_name}-${student.last_name}-${idx}`}
                name={`${student.first_name} ${student.last_name}`}
                classroom={student.class_name}
                reason={student.reason || "Absent from class"}
              />
            ))}
            {absentStudentsData.length === 0 && !loading && (
              <p className="text-gray-500 text-sm text-center py-4">No absent students today</p>
            )}
            {loading && <p className="text-gray-500 text-sm text-center py-4">Loading...</p>}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-5 gap-6 mb-5">
        <div className="lg:col-span-3 p-4 bg-white rounded-lg shadow border-2 border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-[0.98rem]">Self-study analysis</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={selfStudyDate}
                onChange={(e) => setSelfStudyDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {selfStudyDate && getAvailablePeriodsFromDate(selfStudyDate).length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                <select
                  value={selfStudyPeriod}
                  onChange={(e) => setSelfStudyPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a period</option>
                  {getAvailablePeriodsFromDate(selfStudyDate).map((period) => (
                    <option key={period} value={period}>
                      {getPeriodDisplayName(period)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select
                value={selfStudyClass}
                onChange={(e) => setSelfStudyClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a class</option>
                {classes.map((cls) => (
                  <option key={cls.class_id} value={cls.class_id}>
                    {cls.class_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selfStudyDate && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-main">
              <div className="text-sm">
                <span className="font-medium text-main">
                  {new Date(selfStudyDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <div className="mt-1 text-gray-600">
                  Available periods:{" "}
                  {getAvailablePeriodsFromDate(selfStudyDate).length > 0
                    ? getAvailablePeriodsFromDate(selfStudyDate)
                        .map((period) => getPeriodDisplayName(period))
                        .join(", ")
                    : "No self-study periods on this day"}
                </div>
              </div>
            </div>
          )}

          {selfStudyData && selfStudyData.status !== "no_data" && selfStudyData.class_name && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border-l-4 border-gray-400">
              <div className="text-sm">
                <span className="font-medium text-gray-800">Data Found:</span>
                <span className="ml-2">
                  {selfStudyData.class_name} - {getPeriodDisplayName(selfStudyData.period)}
                </span>
                <span className="ml-4 text-gray-600">Total: {selfStudyData.total} students</span>
              </div>
            </div>
          )}

          <div className="flex-[2]">
            {selfStudyLoading ? (
              <div className="flex items-center justify-center h-[450px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-gray-500">Loading self-study data...</p>
                </div>
              </div>
            ) : selfStudyData && selfStudyData.status !== "no_data" ? (
              <ResponsiveContainer width="100%" height={450}>
                <PieChart onClick={handleSelfStudyChartClick}>
                  <PinnedTooltip
                    hoveredSlice={selfStudyHoveredSlice}
                    pinned={selfStudyTooltipPinned}
                    onPinChange={setSelfStudyTooltipPinned}
                    total={selfStudyData.total || selfStudyData.present + selfStudyData.absent}
                    actionNames={["Present", "Absent"]}
                    onAction={(payload) => {
                      if (payload?.name === "Present") {
                        loadSelfStudyStudents("present");
                      }
                      if (payload?.name === "Absent") {
                        loadSelfStudyStudents("absent");
                      }
                    }}
                    actionLabel={(label) => `View ${label} list`}
                  />
                  <Pie
                    data={[
                      { name: "Present", value: selfStudyData.present, color: "#001240" },
                      { name: "Absent", value: selfStudyData.absent, color: "#b92020" },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius="70%"
                    fill="#8884d8"
                    fontSize="12px"
                    labelLine
                    label={renderPieLabel}
                    stroke="#001240"
                    strokeWidth={2}
                    onMouseEnter={handleSelfStudySliceHover}
                    onMouseLeave={handleSelfStudySliceLeave}
                  >
                    {[
                      { name: "Present", value: selfStudyData.present, color: "#001240" },
                      { name: "Absent", value: selfStudyData.absent, color: "#b92020" },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#001240" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    fontSize="12px"
                    formatter={(value) => <span className="text-sm text-gray-700">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[450px]">
                <div className="text-center">
                  <p className="text-gray-500 mb-2">
                    {!selfStudyClass || !selfStudyDate
                      ? "Select a class and date to view self-study attendance"
                      : "No self-study attendance data found for this date and class"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border-2 border-gray-200 rounded-xl shadow-sm p-8">
          <div className="flex gap-3 justify-between">
            <h3 className="font-semibold mb-2 text-[0.98rem]">Sick students today</h3>
            <button
              onClick={async () => {
                try {
                  const response = await apiClient.get("/api/dashboard/sick-students/all");
                  if (response.status === "success") {
                    const allSickStudents = response.data.map((student: any) => ({
                      name: `${student.first_name} ${student.last_name}`,
                      classroom: student.class_name,
                      reason: student.reason,
                      notes: student.notes,
                      recorded_at: student.marked_sick_at,
                    }));
                    openModal("Sick students - Today", allSickStudents);
                  }
                } catch (error) {
                  console.error("Failed to load all sick students:", error);
                  addToast({ message: "Failed to load all sick students", type: "error" });
                }
              }}
              className="text-sm text-main font-semibold hover:underline cursor-pointer"
            >
              see all
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 mt-6">
            {sickStudentsData.slice(0, 4).map((student, idx) => (
              <SickStudentCards
                key={`${student.first_name}-${student.last_name}-${idx}`}
                name={`${student.first_name} ${student.last_name}`}
                classroom={student.class_name}
                reason={student.reason || "Health issue"}
                notes={student.notes}
              />
            ))}
            {sickStudentsData.length === 0 && !loading && (
              <p className="text-gray-500 text-sm text-center py-4">No sick students today</p>
            )}
            {loading && <p className="text-gray-500 text-sm text-center py-4">Loading...</p>}
          </div>
        </div>
      </div>

      <StudentListViewModal isOpen={modalOpen} onClose={closeModal} title={modalData.title} students={modalData.students} />
    </div>
  );
}

export default DashboardAdminWidget;
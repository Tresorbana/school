import { useEffect, useMemo, useState } from "react";
import { HiRefresh, HiDocumentText, HiClock, HiBell } from "react-icons/hi";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { classService } from "../../../services/academicService";
import { healthService, type ClassHealthOverview } from "../../../services/healthService";
import { apiClient } from "../../../utils/apiClient";
import { useAuth } from "../../../utils/context/AuthContext";
import { useToast } from "../../../utils/context/ToastContext";
import Role, { MENU_ITEMS } from "../../../utils/constants";
import StatusListModal from "../../modals/StatusList.modal";
import PinnedTooltip from "../../shared/PinnedTooltip";

interface DashboardNurseWidgetProps {
  setActive?: (active: string) => void;
}

interface ActivityItem {
  message: string;
  timestamp: string;
  type: string;
}

const HEALTH_COLORS = {
  healthy: "#111827",
  sick: "#9CA3AF"
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) return "Just now";
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${Math.floor(diffInHours / 24)}d ago`;
};

function DashboardNurseWidget({ setActive }: DashboardNurseWidgetProps) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const userRole = user?.role;

  const [classHealthOverview, setClassHealthOverview] = useState<ClassHealthOverview[]>([]);
  const [healthDataLoading, setHealthDataLoading] = useState(false);
  const [classes, setClasses] = useState<Array<{ class_id: string; class_name: string }>>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [healthStats, setHealthStats] = useState({ healthy: 0, sick: 0, total: 0 });
  const [statsLoading, setStatsLoading] = useState(false);
  const [healthStatusModalOpen, setHealthStatusModalOpen] = useState(false);
  const [healthStatusTitle, setHealthStatusTitle] = useState("");
  const [healthStatusStudents, setHealthStatusStudents] = useState<any[]>([]);
  const [healthStatusLoading, setHealthStatusLoading] = useState(false);
  const [hoveredSlice, setHoveredSlice] = useState<any | null>(null);
  const [tooltipPinned, setTooltipPinned] = useState(false);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  const chartTotal = useMemo(
    () => healthStats.total || healthStats.healthy + healthStats.sick,
    [healthStats]
  );
  const chartRenderKey = useMemo(() => `${chartTotal}-${statsLoading}`, [chartTotal, statsLoading]);
  const chartData = useMemo(
    () => [
      { name: "Healthy", value: healthStats.healthy, color: HEALTH_COLORS.healthy },
      { name: "Sick", value: healthStats.sick, color: HEALTH_COLORS.sick }
    ],
    [healthStats]
  );
  const selectedClassName = useMemo(() => {
    if (!selectedClassId) return "all classes";
    return classes.find((cls) => cls.class_id === selectedClassId)?.class_name || "selected class";
  }, [classes, selectedClassId]);

  useEffect(() => {
    if (userRole !== Role.NURSE) return;
    loadClassesForNurse();
    loadClasses();
    loadRecentActivities();
  }, [userRole]);

  useEffect(() => {
    if (userRole !== Role.NURSE) return;
    loadHealthStatistics();
  }, [selectedClassId, userRole]);

  useEffect(() => {
    const triggerResize = () => {
      window.requestAnimationFrame(() => {
        window.dispatchEvent(new Event("resize"));
      });
      window.setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 50);
    };

    if (!statsLoading && chartTotal > 0) {
      triggerResize();
    }

    const handleVisibility = () => {
      if (!statsLoading && chartTotal > 0) {
        triggerResize();
      }
    };

    window.addEventListener("focus", handleVisibility);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleVisibility);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [statsLoading, chartTotal]);

  const loadClassesForNurse = async () => {
    try {
      setHealthDataLoading(true);
      const response = await healthService.getClassesWithSickStudents();

      if (response.success) {
        setClassHealthOverview(response.data);
      } else {
        addToast({
          message: response.message || "Failed to load health data",
          type: "error"
        });
      }
    } catch (err) {
      addToast({
        message: err instanceof Error ? err.message : "Failed to load health data",
        type: "error"
      });
    } finally {
      setHealthDataLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await classService.getClasses();
      if (response.success && response.data) {
        setClasses(response.data);
      }
    } catch (error) {
      console.error("Failed to load classes:", error);
    }
  };

  const loadHealthStatistics = async () => {
    try {
      setStatsLoading(true);
      const classId = selectedClassId || undefined;
      const response = await healthService.getHealthStatisticsByClass(classId);

      console.debug("[Nurse] health statistics response", {
        classId: classId ?? "all",
        response
      });

      if (response.status === "success" && response.data) {
        const healthy = Number(response.data.healthy || 0);
        const sick = Number(response.data.sick || 0);
        const total = Number(response.data.total ?? healthy + sick);

        const computedTotal = total || healthy + sick;

        setHealthStats({
          healthy,
          sick,
          total: computedTotal
        });

        console.debug("[Nurse] health statistics parsed", {
          classId: classId ?? "all",
          healthy,
          sick,
          total: computedTotal
        });
      } else {
        addToast({
          message: response.message || "Failed to load health statistics",
          type: "error"
        });
      }
    } catch (error) {
      console.error("Failed to load health statistics:", error);
      addToast({
        message: "Failed to load health statistics",
        type: "error"
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const loadHealthStatusStudents = async (status: "healthy" | "sick") => {
    try {
      setHealthStatusLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append("limit", "1000");
      if (selectedClassId) {
        queryParams.append("class_id", selectedClassId);
      }

      const endpoint = status === "healthy" ? "/api/students/healthy" : "/api/students/sick";
      const response = await apiClient.get(`${endpoint}?${queryParams.toString()}`);

      if (response.success && response.data) {
        const mappedStudents = response.data.map((student: any) => ({
          id: student.student_id,
          name: `${student.first_name} ${student.last_name}`,
          className: student.class_name,
          email: student.email,
          gender: student.gender,
          reason: student.illness || student.notes
        }));
        setHealthStatusStudents(mappedStudents);
      } else {
        throw new Error(response.message || "Failed to load health status students");
      }
    } catch (error) {
      console.error("Failed to load health status students:", error);
      addToast({
        message: "Failed to load health status students",
        type: "error"
      });
    } finally {
      setHealthStatusLoading(false);
    }
  };

  const handleHealthSliceClick = async (slice: any) => {
    if (!slice?.name) return;
    const normalizedName = String(slice.name).toLowerCase();
    if (!['healthy', 'sick'].includes(normalizedName)) return;

    setHealthStatusTitle(`${slice.name} students - ${selectedClassName}`);
    setHealthStatusStudents([]);
    setHealthStatusModalOpen(true);
    await loadHealthStatusStudents(normalizedName as "healthy" | "sick");
  };

  const handleSliceHover = (entry: any) => {
    if (!entry) return;
    if (hoveredSlice && hoveredSlice.name === entry.name && hoveredSlice.value === entry.value) {
      return;
    }

    setTooltipPinned(true);
    setHoveredSlice({
      name: entry.name,
      value: entry.value,
      color: entry.color,
      payload: entry
    });
  };

  const handleSliceLeave = () => {
    // Keep tooltip pinned until another slice is hovered or click outside
  };

  const handleChartAreaClick = () => {
    setTooltipPinned(false);
    setHoveredSlice(null);
  };

  const handleAttendanceRedirection = () => {
    if (setActive) {
      setActive(MENU_ITEMS.ATTENDANCE);
    }
  };

  const handleViewHealth = (classData: ClassHealthOverview) => {
    const sickCount = classData.sick_students;
    const message = sickCount > 0
      ? `Viewing health records for ${classData.class_name} (${sickCount} sick student${sickCount > 1 ? "s" : ""})`
      : `Viewing health records for ${classData.class_name} (all students healthy)`;

    addToast({
      message,
      type: "info"
    });
  };

  const loadRecentActivities = async () => {
    try {
      setActivitiesLoading(true);
      const response = await apiClient.get("/api/dashboard/recent-actions?limit=10");

      if (response.status === "success" && response.data) {
        const allowedTypes = new Set(["attendance_recorded"]);
        const filtered = response.data.filter((activity: ActivityItem) =>
          allowedTypes.has(activity.type)
        );
        setRecentActivities(filtered);
      } else {
        console.error("Failed to load recent activities:", response);
        setRecentActivities([]);
      }
    } catch (error) {
      console.error("Failed to load recent activities:", error);
      setRecentActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  return (
    <div className="px-10 mb-6">
      {/* Health Records Table - Full Width */}
      <div className="mt-6">
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h2 className="text-md font-semibold text-gray-900">Health records</h2>
            <div className="flex items-center gap-2">
              <button className="text-main text-sm hover:underline">see all</button>
            </div>
          </div>

          {/* Scrollable table container */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <table className="w-full border-spacing-y-7 border-collapse">
              <thead className="sticky top-0 bg-white">
                <tr className="text-main">
                  <th className="p-3 text-[.8rem]">Class</th>
                  <th className="p-3 text-[.8rem]">Sick Students</th>
                  <th className="p-3 text-[.8rem]">Status</th>
                  <th className="p-3 text-[.8rem]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {healthDataLoading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-main mb-2"></div>
                        <p className="text-gray-500 text-xs">Loading classes...</p>
                      </div>
                    </td>
                  </tr>
                ) : classHealthOverview.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-gray-400 text-2xl mb-2">🏫</div>
                        <p className="text-gray-500 text-xs">No classes found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  classHealthOverview.map((data, idx) => (
                    <tr key={idx} className="text-center border-t border-gray-100">
                      <td className="p-3 text-[.8rem]">{data.class_name}</td>
                      <td className="p-3 text-[.8rem]">
                        {data.can_record ? (
                          <span className="text-gray-500">-</span>
                        ) : (
                          <span className="text-gray-900">{data.sick_students}</span>
                        )}
                      </td>
                      <td className="p-3 text-[.8rem]">
                        {data.can_record ? (
                          <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-700">
                            Pending
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-main text-white">
                            Recorded
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-[.8rem]">
                        {data.can_record ? (
                          <button
                            onClick={() => handleAttendanceRedirection()}
                            className="bg-main text-white px-3 py-1 rounded text-xs hover:bg-main/90"
                          >
                            Record
                          </button>
                        ) : data.can_view ? (
                          <button
                            onClick={() => handleViewHealth(data)}
                            className="bg-gray-500 text-white px-3 py-1 rounded text-xs hover:bg-gray-600"
                          >
                            View
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Fixed buttons at bottom */}
          <div className="flex justify-end gap-5 pt-4 border-t border-gray-200 mt-auto flex-shrink-0">
            <button
              onClick={loadClassesForNurse}
              disabled={healthDataLoading}
              className="text-sm border border-gray-500 p-2 w-36 rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <HiRefresh className={`w-5 h-5 inline ${healthDataLoading ? 'animate-spin' : ''}`} />&nbsp;&nbsp;
              {healthDataLoading ? 'Loading...' : 'Refresh'}
            </button>
            <button className="text-sm border border-gray-500 p-2 w-36 rounded-lg hover:bg-gray-50 active:bg-gray-100">
              <HiDocumentText className="w-5 h-5 inline" />&nbsp;&nbsp; Export pdf
            </button>
          </div>
        </div>
      </div>

      {/* Health Status and Reminders - Grid Layout Below */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Health status with pie chart */}
        <div className="border-2 border-gray-200 p-5 rounded-lg">
          <div className="flex justify-between items-center gap-2 mb-4">
            <h1 className="font-bold text-main">Health status</h1>
          </div>

          {/* Class selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Class
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent"
              disabled={statsLoading}
            >
              <option value="" className="text-[.7rem]">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.class_id} value={cls.class_id} className="text-[.7rem]">
                  {cls.class_name}
                </option>
              ))}
            </select>
          </div>

          {/* pie chart */}
          <div className="flex flex-col items-center justify-center w-full h-96 mt-5" onMouseDown={handleChartAreaClick}>
            {statsLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main mb-2"></div>
                <p className="text-gray-500 text-xs">Loading statistics...</p>
              </div>
            ) : chartTotal === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-gray-400 text-2xl mb-2">🥼</div>
                <p className="text-gray-500 text-xs">No health data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width={"100%"} height={"100%"} minHeight={240} key={chartRenderKey}>
                <PieChart key={`${healthStats.healthy}-${healthStats.sick}`}>
                  <PinnedTooltip
                    hoveredSlice={hoveredSlice}
                    pinned={tooltipPinned}
                    onPinChange={setTooltipPinned}
                    total={chartTotal}
                    actionNames={['Healthy', 'Sick']}
                    onAction={handleHealthSliceClick}
                  />
                  <Pie
                    data={chartData}

                    dataKey="value"
                    nameKey="name"
                    outerRadius={70}
                    innerRadius={0}
                    cx="50%"
                    cy="45%"
                    labelLine={false}
                    label={(entry: any) =>
                      `${entry.name}: ${entry.value} (${(entry.percent * 100).toFixed(1)}%)`
                    }
                    fontSize={10}
                    onMouseEnter={handleSliceHover}
                    onMouseLeave={handleSliceLeave}
                  >
                    {chartData.map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={entry.color}
                        style={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                    formatter={(value) => <span className="text-xs text-gray-700">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="border-2 border-gray-200 p-5 rounded-lg">
          <div className="flex gap-5 mb-4">
            <HiBell className="w-5 h-5 text-gray-700" />
            <h1 className="text-main text-base font-semibold">Recent Activities</h1>
          </div>

          {activitiesLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-main mb-2"></div>
              <p className="text-gray-500 text-xs">Loading activities...</p>
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-gray-400 text-2xl mb-2">📋</div>
              <p className="text-gray-500 text-xs">No recent activities</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {recentActivities.map((activity, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 leading-relaxed">
                        {activity.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 text-xs whitespace-nowrap">
                      <HiClock className="w-3 h-3" />
                      <span>{formatTimestamp(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <StatusListModal
        open={healthStatusModalOpen}
        onClose={() => setHealthStatusModalOpen(false)}
        title={healthStatusTitle}
        students={healthStatusLoading ? [] : healthStatusStudents}
      />
    </div>
  );
}

export default DashboardNurseWidget;
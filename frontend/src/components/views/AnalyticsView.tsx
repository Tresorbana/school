import { useState, useEffect, useCallback } from "react";
import { AnalyticsReviewCards } from "../cards/Analytics.cards";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from "recharts";

import SharedHeader from "../shared/SharedHeader";
import ViewHeader from "../shared/ViewHeader";
import AllowedRoles from "../shared/AllowedRoles";
import Role from "../../utils/constants";
import { apiClient } from "../../utils/apiClient";
import { useToast } from "../../utils/context/ToastContext";
import { classService } from "../../services/academicService";
import DateRangePicker from "../shared/DateRangePicker";
import InfiniteScrollDatePicker from "../shared/InfiniteScrollDatePicker";
import ModalWrapper from "../shared/ModalWrapper";
import PinnedTooltip from "../shared/PinnedTooltip";
import { IoClose } from "react-icons/io5";
import { FiBarChart2, FiActivity, FiBookOpen, FiUsers } from "react-icons/fi";

function AnalyticsView() {
  const [analyticsData, setAnalyticsData] = useState([
    { title: "Attendance Rate", numbers: 0, comment: "Loading..." },
    { title: "Active Sick Records", numbers: 0, comment: "Loading..." },
    { title: "Total Classes", numbers: 0, comment: "Loading..." },
    { title: "Total Students", numbers: 0, comment: "Loading..." }
  ]);

  const icons = [ <FiBarChart2 key="attendance" />, <FiActivity key="sick" />, <FiBookOpen key="classes" />, <FiUsers key="students" />];
  const [recentActivitiesData, setRecentActivitiesData] = useState<Array<{time: string, text: string}>>([]);
  const [attendanceDistribution, setAttendanceDistribution] = useState<Array<{name: string, value: number, color: string}>>([]);
  const [periodRecordingStatus, setPeriodRecordingStatus] = useState<any>(null);
  const [selectedPeriodDate, setSelectedPeriodDate] = useState<string>('');
  const [recordListOpen, setRecordListOpen] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [classPerformance, setClassPerformance] = useState<Array<any>>([]);
  const [hoveredPeriodSlice, setHoveredPeriodSlice] = useState<any | null>(null);
  const [periodTooltipPinned, setPeriodTooltipPinned] = useState(false);

  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    endDate: new Date() // today
  });
  const [selectedTrendsClass, setSelectedTrendsClass] = useState<string>('all');
  const [attendanceTrendsData, setAttendanceTrendsData] = useState<Array<any>>([]);
  
  const { addToast } = useToast();

  const recordedPeriods = periodRecordingStatus?.periods?.filter((period: any) => period.status === "recorded") ?? [];
  const pendingPeriods = periodRecordingStatus?.periods?.filter((period: any) => period.status === "pending") ?? [];

  const handlePeriodSliceHover = (entry: any) => {
    if (!entry) return;
    if (hoveredPeriodSlice && hoveredPeriodSlice.name === entry.name && hoveredPeriodSlice.value === entry.value) {
      return;
    }

    setPeriodTooltipPinned(true);
    setHoveredPeriodSlice({
      name: entry.name,
      value: entry.value,
      color: entry.color,
      payload: entry
    });
  };

  const handlePeriodChartClick = () => {
    setPeriodTooltipPinned(false);
    setHoveredPeriodSlice(null);
  };

  const handlePeriodSliceLeave = () => {
    // keep pinned until another slice is hovered or chart is clicked
  };

  useEffect(() => {
    loadAnalyticsData();
    loadPeriodRecordingStatus();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedClass !== 'all') {
      loadSelfStudyPerformanceData();
    }
  }, [selectedClass, dateRange]);

  useEffect(() => {
    if (selectedTrendsClass && selectedTrendsClass !== 'all') {
      loadAttendanceTrendsData();
    }
  }, [selectedTrendsClass]);

  const loadSelfStudyPerformanceData = async () => {
    try {
      if (selectedClass === 'all') return;

      const startDate = dateRange.startDate.toISOString().split('T')[0];
      const endDate = dateRange.endDate.toISOString().split('T')[0];

      const response = await apiClient.get(`/api/dashboard/self-study-performance?class_id=${selectedClass}&start_date=${startDate}&end_date=${endDate}`);

      if (response.status === 'success') {
        const chartData = transformSelfStudyDataForChart(response.data);
        setClassPerformance(chartData);
      }
    } catch (error) {
      console.error('Failed to load self-study performance data:', error);
    }
  };

  const loadAttendanceTrendsData = async () => {
    try {
      if (selectedTrendsClass === 'all') return;

      const response = await apiClient.get(`/api/dashboard/attendance-trends?class_id=${selectedTrendsClass}`);

      if (response.status === 'success') {
        const chartData = transformAttendanceTrendsData(response.data);
        setAttendanceTrendsData(chartData);
      }
    } catch (error) {
      console.error('Failed to load attendance trends data:', error);
    }
  };

  const transformAttendanceTrendsData = (data: any[]) => {
    return data.map(weekData => ({
      week: `${weekData.start_date} - ${weekData.end_date}`,
      classAttendance: weekData.class_attendance || 0,
      selfStudy: weekData.self_study_attendance || 0,
      startDate: weekData.start_date,
      endDate: weekData.end_date
    }));
  };

  const transformSelfStudyDataForChart = (data: any[]) => {
    return data.map(dayData => {
      const date = new Date(dayData.date);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNumber = date.getDate();
      
      let chartEntry: any = {
        name: `${dayName} ${dayNumber}`,
        date: dayData.date
      };

      chartEntry.part1 = 0;
      chartEntry.part2 = 0;
      chartEntry.part3 = 0;

      if (dayData.periods && dayData.periods.length > 0) {
        dayData.periods.forEach((periodData: any, index: number) => {
          chartEntry[`part${index + 1}`] = periodData.present_students;
        });
      }

      return chartEntry;
    });
  };

  const getSelfStudyPeriodsForDay = (dayOfWeek: number) => {
    switch (dayOfWeek) {
      case 1: case 2: case 3: case 4:
        return [
          { period: 'morning_prep', name: 'Morning Prep', time: '7:00-8:30' },
          { period: 'evening_prep', name: 'Evening Prep', time: '19:30-22:00' }
        ];
      case 5:
        return [
          { period: 'morning_prep', name: 'Morning Prep', time: '7:00-8:30' }
        ];
      case 6:
        return [
          { period: 'saturday_extended_prep', name: 'Extended Prep', time: '10:00-12:00' }
        ];
      case 0:
        return [
          { period: 'evening_prep', name: 'Evening Prep', time: '19:30-22:00' }
        ];
      default:
        return [];
    }
  };

  const loadPeriodRecordingStatus = async (date?: string) => {
    try {
      const targetDate = date || selectedPeriodDate || new Date().toISOString().split('T')[0];
      const response = await apiClient.get(`/api/dashboard/period-recording-status?date=${targetDate}`);
      
      if (response.status === 'success') {
        const data = response.data;
        setPeriodRecordingStatus(data);
        
        if (data.has_classes) {
          const recordingDistribution = [
            { 
              name: 'Recorded', 
              value: data.recorded_count || 0,
              percent: data.recorded_percentage || 0,
              color: '#001240' 
            },
            { 
              name: 'Pending', 
              value: data.pending_count || 0,
              percent: data.pending_percentage || 0,
              color: '#401C00' 
            }
          ];
          setAttendanceDistribution(recordingDistribution);
        }
      }
    } catch (error) {
      console.error('Failed to load period recording status:', error);
    }
  };

  const handlePeriodDateChange = useCallback((date: string) => {
    setSelectedPeriodDate(date);
    loadPeriodRecordingStatus(date);
  }, []);

  const loadAnalyticsData = async () => {
    try {
      const dashboardResponse = await apiClient.get('/api/dashboard/admin');

      if (dashboardResponse.status === 'success') {
        const data = dashboardResponse.data;
        
        const newAnalyticsData = [
          {
            title: "Attendance Rate",
            numbers: data.attendance_overview?.total_students > 0 
              ? Math.round((data.attendance_overview.present_students / data.attendance_overview.total_students) * 100)
              : 0,
            comment: "Today's percentage"
          },
          {
            title: "Active Sick Records", 
            numbers: data.attendance_overview?.sick_students || 0,
            comment: "Not marked healthy"
          },
          {
            title: "Total Classes",
            numbers: data.class_stats?.total_classes || 0,
            comment: `${data.class_stats?.active_classes || 0} active`
          },
          {
            title: "Total Students",
            numbers: data.class_stats?.total_students || 0,
            comment: "Enrolled students"
          }
        ];

        setAnalyticsData(newAnalyticsData);
        
        const classesResponse = await classService.getClasses();
        if (classesResponse.success) {
          setClasses(classesResponse.data);
        }
        
        if (data.recent_activities && data.recent_activities.length > 0) {
          const transformedActivities = data.recent_activities.slice(0, 6).map((activity: any) => ({
            time: new Date(activity.created_at).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            text: activity.action || activity.description || 'System activity'
          }));
          setRecentActivitiesData(transformedActivities);
        }
      }
      
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      addToast({
        message: 'Failed to load analytics data. Using sample data.',
        type: 'warning'
      });
    }
  };

  return (
    <div className="font-poppins">
      {/* Header */}
      <SharedHeader placeholder="search analysis" />

      {/* body */}
      <div className="m-10">
        <AllowedRoles roles={Role.ADMIN}>
          <ViewHeader title="Analytics" />
          
          <div>
            {/* cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              {analyticsData.map((card, idx) => (
                <AnalyticsReviewCards key={idx} {...card} icon={icons[idx]} />
              ))}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
            {/* line chart */}
            <div className="md:col-span-1 lg:col-span-3 p-3 rounded-lg border border-gray-200 order-1 lg:order-1">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-main col-span-2 font-semibold text-base">Class performance</h1>
                <div className="flex gap-2">
                  {/* Date Range Picker */}
                  <DateRangePicker
                    onDateRangeChange={(startDate, endDate) => {
                      setDateRange({ startDate, endDate });
                    }}
                    placeholder="Select date range"
                    className="text-xs"
                    position="right"
                  />
                  {/* Class Dropdown */}
                  <select 
                    className="border border-gray-200 rounded-md w-32 md:w-40 bg-main text-white text-xs px-2 py-1"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                  >
                    <option value="all">All Classes</option>
                    {classes.map((cls) => (
                      <option key={cls.class_id} value={cls.class_id}>
                        {cls.class_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* chart ui */}
              <div className="h-40 md:h-48 mt-3 md:mt-4">
                {selectedClass === 'all' ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-gray-400 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm font-medium">Select a class and date range</p>
                      <p className="text-gray-400 text-xs mt-1">Choose a specific class to view self-study performance data</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={classPerformance} barCategoryGap={12}>
                      <CartesianGrid stroke="rgba(0,0,0,0.08)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "#111827", fontSize: 10 }} />
                      <YAxis tick={{ fill: "#111827", fontSize: 10 }} />
                      <Tooltip 
                        cursor={{ fill: "rgba(0,0,0,0.05)" }} 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const date = new Date(payload[0]?.payload?.date);
                            const dayOfWeek = date.getDay();
                            const periods = getSelfStudyPeriodsForDay(dayOfWeek);
                            
                            // Calculate total attendance for the day
                            const totalAttendance = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);
                            
                            // Filter out entries with 0 values for cleaner display
                            const activeEntries = payload.filter((entry: any) => entry.value > 0);
                            
                            return (
                              <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[220px]">
                                <div className="border-b border-gray-100 pb-2 mb-3">
                                  <h3 className="font-semibold text-gray-800 text-sm">{label}</h3>
                                  <p className="text-xs text-gray-500">
                                    {date.toLocaleDateString('en-US', { 
                                      weekday: 'long', 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}
                                  </p>
                                  {totalAttendance > 0 && (
                                    <div className="mt-1 text-xs font-medium text-blue-600">
                                      Total: {totalAttendance} students attended
                                    </div>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  {activeEntries.length > 0 ? (
                                    activeEntries.map((entry: any, _index: number) => {
                                      // Find the correct period based on the dataKey
                                      let periodInfo = null;
                                      if (entry.dataKey === 'part1' && periods[0]) periodInfo = periods[0];
                                      else if (entry.dataKey === 'part2' && periods[1]) periodInfo = periods[1];
                                      else if (entry.dataKey === 'part3' && periods[2]) periodInfo = periods[2];
                                      
                                      if (!periodInfo) return null;
                                      
                                      const percentage = totalAttendance > 0 ? Math.round((entry.value / totalAttendance) * 100) : 0;
                                      
                                      return (
                                        <div key={entry.dataKey} className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <div 
                                              className="w-3 h-3 rounded-sm"
                                              style={{ backgroundColor: entry.color }}
                                            />
                                            <span className="text-sm text-gray-700 font-medium">
                                              {periodInfo.name}
                                            </span>
                                          </div>
                                          <div className="text-right">
                                            <div className="text-sm font-semibold text-gray-800">
                                              {entry.value} ({percentage}%)
                                            </div>
                                            <div className="text-xs text-gray-500">
                                              {periodInfo.time}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <div className="text-center py-2">
                                      <p className="text-sm text-gray-500">No attendance recorded</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="part1" stackId="a" fill="#00402E" radius={[0, 0, 0, 0]} barSize={20} />
                      <Bar dataKey="part2" stackId="a" fill="#401C00" barSize={20} />
                      <Bar dataKey="part3" stackId="a" fill="#001240" barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              
              {/* Legend */}
              <div className="flex justify-center gap-6 mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#00402E' }}></div>
                  <span className="text-xs text-gray-700 font-medium">Morning Prep</span>
                  <span className="text-xs text-gray-500">(7:00-8:30)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#401C00' }}></div>
                  <span className="text-xs text-gray-700 font-medium">Evening Prep</span>
                  <span className="text-xs text-gray-500">(19:30-22:00)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#001240' }}></div>
                  <span className="text-xs text-gray-700 font-medium">Extended Prep</span>
                  <span className="text-xs text-gray-500">(Sat 10:00-12:00)</span>
                </div>
              </div>
            </div>
            {/* today's analysis timeline */}
            <div className="md:col-span-1 lg:col-span-2 p-3 rounded-lg border border-gray-200 order-2 lg:order-2">
              <div className="flex items-center justify-between">
                <h1 className="text-main col-span-2 font-semibold text-base">Today's analysis</h1>
              </div>

              {/* timeline */}
              <div className="relative mt-3 md:mt-4">
                {/* full-height timeline connector line - centered */}
                <span
                  aria-hidden
                  className="absolute left-1/2 transform -translate-x-1/2 top-2 bottom-2 w-px bg-indigo-200"
                />
                <ul className="space-y-3">
                  {recentActivitiesData.map((item, idx) => (
                    <li key={`${item.time}-${idx}`} className="relative flex items-center">
                      {/* time - left side */}
                      <div className="flex-1 text-right pr-4">
                        <span className="text-[.75rem] text-gray-500">{item.time}</span>
                      </div>

                      {/* timeline node - center */}
                      <div className="relative z-10 flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full border-2 border-indigo-300 bg-white" />
                      </div>

                      {/* description - right side */}
                      <div className="flex-1 pl-4">
                        <p className="text-[.75rem] text-gray-700">{item.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
            {/* line chart */}
            <div className="md:col-span-1 lg:col-span-3 p-3 rounded-lg border border-gray-200 order-1 lg:order-1">
              <div className="flex items-center justify-between">
                <h2 className="text-main font-semibold text-base">Attendance trends</h2>
                <select 
                  className="border border-gray-200 rounded-md w-32 md:w-40 bg-main text-white text-xs px-2 py-1"
                  value={selectedTrendsClass}
                  onChange={(e) => setSelectedTrendsClass(e.target.value)}
                >
                  <option value="all">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls.class_id} value={cls.class_id}>
                      {cls.class_name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Two line chart */}
              <div className="h-40 md:h-48 mt-3 md:mt-4">
                {selectedTrendsClass === 'all' ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-gray-400 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm font-medium">Select a class to view trends</p>
                      <p className="text-gray-400 text-xs mt-1">Choose a class to see attendance trends over the last 4 weeks</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={attendanceTrendsData} margin={{ top: 10, right: 15, left: 10, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="rgba(0,0,0,0.05)" />
                      <XAxis
                        dataKey="week"
                        tick={{ fill: "#9CA3AF", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#9CA3AF", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ stroke: "rgba(0,0,0,0.1)", strokeWidth: 1 }}
                        formatter={(value: number, name: string) => [
                          value.toLocaleString(),
                          name === 'classAttendance' ? 'Class attendance' : 'Self-study'
                        ]}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="classAttendance"
                        stroke="#6B7280"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 3, fill: '#6B7280' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="selfStudy"
                        stroke="#9CA3AF"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        activeDot={{ r: 3, fill: '#9CA3AF' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Legend */}
              <div className="flex justify-center gap-6 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-gray-500"></div>
                  <span className="text-xs text-gray-600">Class attendance</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-gray-400 border-dashed" style={{ borderTop: '1px dashed #9CA3AF', background: 'transparent' }}></div>
                  <span className="text-xs text-gray-600">Self-study</span>
                </div>
              </div>
            </div>

            {/* pie chart */}
            <div className="md:col-span-1 lg:col-span-2 p-3 rounded-lg border border-gray-200 order-2 lg:order-2">
              <div className="flex items-center justify-between">
                <h2 className="text-main col-span-2 font-semibold text-base">Period recording status</h2>
                <div className="flex items-center gap-2">
                  <InfiniteScrollDatePicker 
                    onDateChange={handlePeriodDateChange}
                  />
                </div>

              </div>

              {/* pie chart or no classes message */}
              <div className="h-56 md:h-64 mt-3 md:mt-4">
                {periodRecordingStatus && !periodRecordingStatus.has_classes ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-gray-400 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm font-medium">{periodRecordingStatus.message}</p>
                      <p className="text-gray-400 text-xs mt-1">No regular classes scheduled</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                      onClick={handlePeriodChartClick}
                    >
                      <PinnedTooltip
                        hoveredSlice={hoveredPeriodSlice}
                        pinned={periodTooltipPinned}
                        onPinChange={setPeriodTooltipPinned}
                        total={periodRecordingStatus?.total_periods || 0}
                        actionNames={['Recorded', 'Pending']}
                        onAction={() => setRecordListOpen(true)}
                        actionLabel={() => "View records"}
                        itemLabel="periods"
                      />
                      <Pie
                        data={attendanceDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={0}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        labelLine={{
                          stroke: '#666',
                          strokeWidth: 1.5,
                          strokeDasharray: '3 3'
                        }}
                        label={(entry: any) => `${entry.name}: ${entry.percent ?? 0}%`}
                        onMouseEnter={handlePeriodSliceHover}
                        onMouseLeave={handlePeriodSliceLeave}
                      >
                        {attendanceDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Custom Legend - only show when there are classes */}
              {periodRecordingStatus && periodRecordingStatus.has_classes && (
                <div className="flex justify-center gap-4 mt-2">
                  {attendanceDistribution.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: entry.color }}
                      ></div>
                      <span className="text-xs text-gray-700 font-medium">{entry.name}</span>
                    </div>
                  ))}
                  {periodRecordingStatus && (
                    <div className="text-xs text-gray-500 ml-2">
                      ({periodRecordingStatus.recorded_count}/{periodRecordingStatus.total_periods} periods)
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <ModalWrapper isOpen={recordListOpen} onClose={() => setRecordListOpen(false)} className="w-full max-w-5xl">
            <div className="w-full max-h-[85vh] rounded-xl bg-white shadow-2xl flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <h3 className="text-base font-semibold text-gray-800">Period recording status</h3>
                  <p className="text-xs text-gray-500">
                    {periodRecordingStatus?.day_of_week ? `${periodRecordingStatus.day_of_week} • ` : ""}
                    {periodRecordingStatus?.date ?? selectedPeriodDate}
                  </p>
                </div>
                <button
                  onClick={() => setRecordListOpen(false)}
                  aria-label="Close"
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <IoClose className="text-lg" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                <div className="bg-gray-50 rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-800">Recorded periods</h4>
                    <span className="text-xs text-gray-500">{recordedPeriods.length}</span>
                  </div>
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                    {recordedPeriods.length > 0 ? (
                      recordedPeriods.map((period: any) => (
                        <div key={period.roster_id} className="bg-white border border-gray-200 rounded-md p-2">
                          <div className="text-sm font-medium text-gray-800">
                            {period.class_name} • Period {period.period}
                          </div>
                          <div className="text-xs text-gray-500">{period.course_name}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-gray-500 text-center py-6">No recorded periods yet.</div>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-800">Pending periods</h4>
                    <span className="text-xs text-gray-500">{pendingPeriods.length}</span>
                  </div>
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                    {pendingPeriods.length > 0 ? (
                      pendingPeriods.map((period: any) => (
                        <div key={period.roster_id} className="bg-white border border-gray-200 rounded-md p-2">
                          <div className="text-sm font-medium text-gray-800">
                            {period.class_name} • Period {period.period}
                          </div>
                          <div className="text-xs text-gray-500">{period.course_name}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-gray-500 text-center py-6">All periods recorded.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </ModalWrapper>
        </AllowedRoles>
      </div>
    </div>
  );
}

export default AnalyticsView;
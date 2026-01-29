import { useState, useEffect } from "react";
import { HiDownload } from "react-icons/hi";
import { FiChevronDown } from "react-icons/fi";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer } from "recharts";

import SelfStudyDetailsModal from "../../modals/reports/SelfStudyDetails.modal";
import StatusListModal from "../../modals/StatusList.modal";
import { classService } from "../../../services/academicService";
import { attendanceService } from "../../../services/attendanceService";
import { useToast } from "../../../utils/context/ToastContext";
import DateRangePicker from "../../shared/DateRangePicker";
import PinnedTooltip from "../../shared/PinnedTooltip";

interface DisciplineReportWidgetProps {
  // Add any props needed for data fetching or configuration
}

function DisciplineReportWidget({ }: DisciplineReportWidgetProps) {
  const [isSelfStudyModalOpen, setIsSelfStudyModalOpen] = useState(false);
  const [selectedSelfStudy, setSelectedSelfStudy] = useState<any>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [attendanceStatusModalOpen, setAttendanceStatusModalOpen] = useState(false);
  const [attendanceStatusTitle, setAttendanceStatusTitle] = useState('');
  const [attendanceStatusStudents, setAttendanceStatusStudents] = useState<any[]>([]);
  const [attendanceStatusLoading, setAttendanceStatusLoading] = useState(false);

  // New state for Class Attendance Overview
  const [dateRange, setDateRange] = useState({
    startDate: new Date(),
    endDate: new Date()
  });
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [classes, setClasses] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [hoveredSlice, setHoveredSlice] = useState<any | null>(null);
  const [tooltipPinned, setTooltipPinned] = useState(false);

  const [tableDateRange] = useState({
    startDate: new Date(),
    endDate: new Date()
  });
  const [tableSelectedClass] = useState<string>('all');

  // State for Self Study Records
  const [selfStudyRecords, setSelfStudyRecords] = useState<any[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    pageSize: 10
  });

  const { addToast } = useToast();

  // Load classes on mount
  useEffect(() => {
    loadClasses();
  }, []);

  // Load attendance data when date range or class changes
  useEffect(() => {
    loadAttendanceData();
  }, [dateRange, selectedClass]);

  // Load self-study records on mount and when pagination or filters change
  useEffect(() => {
    loadSelfStudyRecords();
  }, [pagination.currentPage, pagination.pageSize, tableDateRange, tableSelectedClass]);

  const loadClasses = async () => {
    try {
      const response = await classService.getClasses();
      if (response.success && response.data) {
        setClasses(response.data);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
      addToast({
        message: 'Failed to load classes',
        type: 'error'
      });
    }
  };

  const loadSelfStudyRecords = async () => {
    try {
      setRecordsLoading(true);

      // Real API call to fetch self-study records
      const response = await attendanceService.getSelfStudySessions({
        page: pagination.currentPage,
        limit: pagination.pageSize,
        date_from: tableDateRange.startDate.toISOString().split('T')[0],
        date_to: tableDateRange.endDate.toISOString().split('T')[0],
        class_id: tableSelectedClass === 'all' ? undefined : tableSelectedClass
      });

      if (response.success && response.data) {
        setSelfStudyRecords(response.data);
        setPagination(prev => ({
          ...prev,
          totalPages: Math.ceil((response.data?.length || 0) / pagination.pageSize),
          totalRecords: response.data?.length || 0
        }));
      } else {
        throw new Error(response.message || 'Failed to fetch records');
      }
    } catch (error) {
      console.error('Failed to load self-study records:', error);
      addToast({
        message: 'Failed to load self-study records',
        type: 'error'
      });
      // Fallback to empty state on error
      setSelfStudyRecords([]);
      setPagination(prev => ({
        ...prev,
        totalPages: 1,
        totalRecords: 0
      }));
    } finally {
      setRecordsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handlePageSizeChange = (size: number) => {
    setPagination(prev => ({ ...prev, pageSize: size, currentPage: 1 }));
  };

  const formatDateLocal = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const loadAttendanceData = async () => {
    try {
      setLoading(true);

      const response = await attendanceService.getAttendanceByClassReport({
        start_date: formatDateLocal(dateRange.startDate),
        end_date: formatDateLocal(dateRange.endDate)
      });

      console.log('[Discipline] attendance by class response', response);

      if (response?.status === 'success' && response.data) {
        const relevantRows = selectedClass === 'all'
          ? response.data
          : response.data.filter(row => row.class_id === selectedClass);

        const summary = relevantRows.reduce(
          (acc, row) => ({
            present: acc.present + Number(row.present ?? 0),
            sick: acc.sick + Number(row.sick ?? 0),
            absent: acc.absent + Number(row.absent ?? 0)
          }),
          { present: 0, sick: 0, absent: 0 }
        );

        const transformedData = [
          { name: 'Present', value: summary.present, color: '#062350' },
          { name: 'Sick', value: summary.sick, color: '#6b7280' },
          { name: 'Absent', value: summary.absent, color: '#d1d5db' }
        ];

        console.log('[Discipline] attendance pie data', {
          selectedClass,
          dateRange: {
            start: formatDateLocal(dateRange.startDate),
            end: formatDateLocal(dateRange.endDate)
          },
          summary,
          transformedData
        });

        setAttendanceData(transformedData);
      } else {
        throw new Error(response?.message || 'Failed to fetch attendance report');
      }
    } catch (error) {
      console.error('Failed to load attendance data:', error);
      addToast({
        message: 'Failed to load attendance data',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (startDate: Date, endDate: Date) => {
    setDateRange({ startDate, endDate });
  };

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    setShowClassDropdown(false);
  };

  const handleSliceHover = (entry: any) => {
    if (!entry) return;
    if (
      hoveredSlice &&
      hoveredSlice.name === entry.name &&
      hoveredSlice.value === entry.value
    ) {
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

  const handleAttendanceSliceClick = async (slice: any) => {
    if (!slice?.name) return;

    const normalizedName = String(slice.name).toLowerCase();
    if (!['absent', 'sick', 'present'].includes(normalizedName)) return;

    const className = selectedClass === 'all'
      ? 'all classes'
      : classes.find(c => c.class_id === selectedClass)?.class_name || 'selected class';

    const formattedDateRange = `${formatDateLocal(dateRange.startDate)} to ${formatDateLocal(dateRange.endDate)}`;

    setAttendanceStatusTitle(`${slice.name} students (${formattedDateRange}) - ${className}`);
    setAttendanceStatusStudents([]);
    setAttendanceStatusModalOpen(true);

    try {
      setAttendanceStatusLoading(true);
      const response = await attendanceService.getSelfStudyAttendanceStatusStudents({
        status: normalizedName as 'present' | 'absent' | 'sick',
        start_date: formatDateLocal(dateRange.startDate),
        end_date: formatDateLocal(dateRange.endDate),
        class_id: selectedClass === 'all' ? undefined : selectedClass
      });

      if (response.success && response.data) {
        const mappedStudents = response.data.map((student: any) => ({
          id: student.student_id,
          name: student.student_name,
          className: student.class_name,
          email: student.student_email,
          gender: student.student_gender,
          reason: student.illness || student.notes
        }));
        setAttendanceStatusStudents(mappedStudents);
      } else {
        throw new Error(response.message || 'Failed to load students');
      }
    } catch (error) {
      console.error('Failed to load attendance status students:', error);
      addToast({
        message: 'Failed to load attendance status students',
        type: 'error'
      });
    } finally {
      setAttendanceStatusLoading(false);
    }
  };

  // Custom label renderer with connector lines
  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, fill, name, value } = props;
    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);

    // Calculate positions for the connector line
    const sx = cx + (outerRadius + 5) * cos; // Start point (just outside the pie)
    const sy = cy + (outerRadius + 5) * sin;
    const mx = cx + (outerRadius + 25) * cos; // Middle point (elbow)
    const my = cy + (outerRadius + 25) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22; // End point for text
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        {/* Connector line with elbow */}
        <path
          d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
          stroke={fill}
          fill="none"
          strokeWidth="1.5"
        />
        {/* Label text */}
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 5}
          y={ey}
          textAnchor={textAnchor}
          fill="#333"
          fontSize="12"
          fontWeight="500"
        >
          {name}: {value}
        </text>
      </g>
    );
  };

  const attendanceTotal = attendanceData.reduce(
    (sum, item) => sum + Number(item?.value ?? 0),
    0
  );

  const attendanceClassLabel = selectedClass === 'all'
    ? 'all classes'
    : classes.find(c => c.class_id === selectedClass)?.class_name || 'selected class';
  const attendanceStartDate = formatDateLocal(dateRange.startDate);
  const attendanceEndDate = formatDateLocal(dateRange.endDate);

  const attendanceDateLabel = attendanceStartDate === attendanceEndDate
    ? attendanceStartDate
    : `${attendanceStartDate} to ${attendanceEndDate}`;
  const attendanceEmptyMessage = attendanceStartDate === attendanceEndDate
    ? `No attendance data available for ${attendanceDateLabel} in ${attendanceClassLabel}.`
    : `No attendance data available between ${attendanceDateLabel} in ${attendanceClassLabel}.`;

  return (
    <div>
      <div className="my-6">
        {/* Charts Section */}
        <div className="space-y-6 mb-6">
          {/* Class Attendance Overview - Pie Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Class Attendance overview</h3>
              <div className="flex gap-2">
                {/* Date Range Picker - Using Shared Component */}
                <DateRangePicker
                  onDateRangeChange={handleDateRangeChange}
                  className="text-xs"
                  position="right"
                />
                {/* Class Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowClassDropdown(!showClassDropdown)}
                    className="flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                  >
                    {selectedClass === 'all' ? 'All Classes' : classes.find(c => c.class_id === selectedClass)?.class_name || 'Select Class'}
                    <FiChevronDown className="w-3 h-3" />
                  </button>
                  {showClassDropdown && (
                    <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-40">
                      <div className="py-1">
                        <button
                          onClick={() => handleClassChange('all')}
                          className="w-full px-3 py-2 text-xs text-left hover:bg-gray-50"
                        >
                          All Classes
                        </button>
                        {classes.map((cls) => (
                          <button
                            key={cls.class_id}
                            onClick={() => handleClassChange(cls.class_id)}
                            className="w-full px-3 py-2 text-xs text-left hover:bg-gray-50"
                          >
                            {cls.class_name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="h-64 w-full" onMouseDown={handleChartAreaClick}>
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-main"></div>
                </div>
              ) : attendanceTotal === 0 ? (
                <div className="flex items-center justify-center h-full text-xs text-gray-500 text-center px-4">
                  {attendanceEmptyMessage}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minHeight={240}>
                  <PieChart>
                    <Pie
                      data={attendanceData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                      paddingAngle={2}
                      startAngle={90}
                      endAngle={450}
                      label={renderCustomizedLabel}
                      labelLine={false}
                      isAnimationActive={false}
                    >
                      {attendanceData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          onMouseEnter={() => handleSliceHover(entry)}
                          onMouseLeave={handleSliceLeave}
                          style={{ cursor: 'pointer' }}
                        />
                      ))}
                    </Pie>
                    <PinnedTooltip
                      hoveredSlice={hoveredSlice}
                      pinned={tooltipPinned}
                      onPinChange={setTooltipPinned}
                      total={attendanceTotal}
                      actionNames={['Absent', 'Sick', 'Present']}
                      onAction={handleAttendanceSliceClick}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={30}
                      iconType="rect"
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Attendance Overview */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Header with Search and Controls */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Attendance overview</h3>
                {/* Search and Buttons Row */}
                <div className="flex gap-3 items-center mb-3 justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`${showFilters
                        ? 'bg-main text-white'
                        : 'bg-white text-gray-700 border border-gray-300'
                        } px-3 py-1.5 text-xs rounded-md flex items-center gap-2 hover:opacity-90 transition-colors`}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      Filters
                    </button>
                    <button className="bg-main text-white px-3 py-1.5 text-xs rounded-md flex items-center gap-2 hover:bg-main/90">
                      <HiDownload className="w-3 h-3" />
                      Export
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {/* Collapsible Filters */}
            {showFilters && (
              <div className="flex gap-3 items-center p-3 bg-main/5 border border-main/20 rounded-md">
                <select className="border border-gray-300 rounded px-2 py-1 text-xs">
                  <option>Select date</option>
                  <option>Today</option>
                  <option>Yesterday</option>
                  <option>This Week</option>
                  <option>This Month</option>
                </select>
                <select className="border border-gray-300 rounded px-2 py-1 text-xs">
                  <option>Select class</option>
                  <option>Y1A</option>
                  <option>Y1B</option>
                  <option>Y2A</option>
                  <option>Y2B</option>
                  <option>Y2C</option>
                </select>
                <select className="border border-gray-300 rounded px-2 py-1 text-xs">
                  <option>Select status</option>
                  <option>Submitted</option>
                  <option>Pending</option>
                  <option>Draft</option>
                </select>
                <select className="border border-gray-300 rounded px-2 py-1 text-xs">
                  <option>Select supervisor</option>
                  <option>Benilde Mukaremera</option>
                  <option>John Doe</option>
                  <option>Jane Smith</option>
                </select>
                <div className="flex gap-2 ml-auto">
                  <button className="px-3 py-1 bg-main text-white rounded text-xs hover:bg-main/90">
                    Apply
                  </button>
                  <button className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50">
                    Reset
                  </button>
                </div>
              </div>
            )}
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-main text-white">
                  <tr>
                    <th className="px-3 py-2 text-left w-8">
                      <input type="checkbox" className="w-3 h-3 text-white bg-transparent border-white rounded" />
                    </th>
                    <th className="px-3 py-2 text-left font-medium">Self study</th>
                    <th className="px-3 py-2 text-left font-medium">Class</th>
                    <th className="px-3 py-2 text-left font-medium">Supervisor</th>
                    <th className="px-3 py-2 text-left font-medium">Date</th>
                    <th className="px-3 py-2 text-left font-medium">Students</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-left font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recordsLoading ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-main"></div>
                        </div>
                      </td>
                    </tr>
                  ) : selfStudyRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                        No self-study records found
                      </td>
                    </tr>
                  ) : (
                    selfStudyRecords.map((record) => (
                      <tr key={record.self_study_attendance_id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <input type="checkbox" className="w-3 h-3 text-main bg-white border-gray-300 rounded focus:ring-main" />
                        </td>
                        <td className="px-3 py-2 text-gray-900">{record.period_display}</td>
                        <td className="px-3 py-2 text-gray-600">{record.class_name}</td>
                        <td className="px-3 py-2 text-gray-600">{record.created_by_name}</td>
                        <td className="px-3 py-2 text-gray-600">{record.attendance_date}</td>
                        <td className="px-3 py-2 text-gray-600">{record.total_students}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${record.status === 'submitted' ? 'bg-green-100 text-green-800' :
                              record.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => {
                              setSelectedSelfStudy(record);
                              setIsSelfStudyModalOpen(true);
                            }}
                            className="bg-main text-white px-3 py-1 rounded text-xs hover:bg-main/90"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span>Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalRecords)} of {pagination.totalRecords} results</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={pagination.pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-xs"
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </select>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-2 py-1 text-xs border rounded ${pageNum === pagination.currentPage
                              ? 'bg-main text-white border-main'
                              : 'border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {pagination.totalPages > 5 && (
                      <>
                        <span className="px-2 py-1 text-xs">...</span>
                        <button
                          onClick={() => handlePageChange(pagination.totalPages)}
                          className={`px-2 py-1 text-xs border rounded ${pagination.totalPages === pagination.currentPage
                              ? 'bg-main text-white border-main'
                              : 'border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                          {pagination.totalPages}
                        </button>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Self Study Details Modal */}
      <SelfStudyDetailsModal
        open={isSelfStudyModalOpen}
        onClose={() => setIsSelfStudyModalOpen(false)}
        studyData={selectedSelfStudy}
      />
      <StatusListModal
        open={attendanceStatusModalOpen}
        onClose={() => setAttendanceStatusModalOpen(false)}
        title={attendanceStatusTitle}
        students={attendanceStatusLoading ? [] : attendanceStatusStudents}
      />
    </div>
  );
}

export default DisciplineReportWidget;
import { useMemo, useState, useEffect } from "react";
import { HiDownload, HiUsers, HiClipboardCheck, HiDocumentText } from "react-icons/hi";
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CustomTooltip } from "../../shared/Custom";
import PinnedTooltip from "../../shared/PinnedTooltip";
import { graphColors2 } from "../../../utils/Color";
import DateRangePicker from "../../shared/DateRangePicker";
import { HomeNurseReviewCards } from "../../cards/Dashboard.cards";
import { healthService } from "../../../services/healthService";
import { classService } from "../../../services/academicService";
import { apiClient } from "../../../utils/apiClient";
import { useToast } from "../../../utils/context/ToastContext";
import SearchableSelect from "../../shared/SearchableSelect";
import { exportToCSV, generateFilename } from "../../../utils/fileExportManager";
import StatusListModal from "../../modals/StatusList.modal";

interface NurseReportWidgetProps {
  // Add any props needed for data fetching or configuration
}

interface HealthRecord {
  record_id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  class_name: string;
  recorded_at: string;
  is_sick: boolean;
  illness?: string;
  notes?: string;
}

function NurseReportWidget({}: NurseReportWidgetProps) {
  const { addToast } = useToast();
  const [showFilters, setShowFilters] = useState<boolean>(false);
  
  // Cards data
  const [statistics, setStatistics] = useState({
    total_students: 0,
    total_classes: 0,
    total_records_this_month: 0,
    currently_sick: 0
  });
  const [cardsLoading, setCardsLoading] = useState(false);

  // Pie chart data
  const [mostSickClasses, setMostSickClasses] = useState<Array<{ class_id: string; class_name: string; sick_count: number }>>([]);
  const [pieChartLoading, setPieChartLoading] = useState(false);
  const [hoveredSlice, setHoveredSlice] = useState<any | null>(null);
  const [tooltipPinned, setTooltipPinned] = useState(false);
  const [healthStatusModalOpen, setHealthStatusModalOpen] = useState(false);
  const [healthStatusTitle, setHealthStatusTitle] = useState("");
  const [healthStatusStudents, setHealthStatusStudents] = useState<any[]>([]);
  const [healthStatusLoading, setHealthStatusLoading] = useState(false);

  // Bar chart data
  const [barChartData, setBarChartData] = useState<Array<{ date: string; sick: number; healthy: number }>>([]);
  const [barChartLoading, setBarChartLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [selectedClassForChart, setSelectedClassForChart] = useState<string>('');

  // Table data
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [classes, setClasses] = useState<Array<{ class_id: string; class_name: string }>>([]);

  // Load initial data
  useEffect(() => {
    loadStatistics();
    loadMostSickClasses();
    loadClasses();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setTooltipPinned(false);
        setHoveredSlice(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Load bar chart when date range or class changes
  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      loadBarChartData();
    }
  }, [dateRange, selectedClassForChart]);

  // Load table data when filters or page changes
  useEffect(() => {
    loadHealthRecords();
  }, [currentPage, pageSize, filterClass, filterStatus, filterDate, searchQuery]);

  const loadStatistics = async () => {
    try {
      setCardsLoading(true);
      const response = await healthService.getNurseReportStatistics();
      if (response.status === 'success' && response.data) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setCardsLoading(false);
    }
  };

  const loadMostSickClasses = async () => {
    try {
      setPieChartLoading(true);
      const response = await healthService.getMostSickClasses(10);
      if (response.status === 'success' && response.data) {
        setMostSickClasses(response.data);
      }
    } catch (error) {
      console.error('Failed to load most sick classes:', error);
    } finally {
      setPieChartLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await classService.getClasses();
      if (response.success && response.data) {
        setClasses(response.data);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const loadBarChartData = async () => {
    if (!dateRange.start || !dateRange.end) return;
    
    try {
      setBarChartLoading(true);
      const startDate = dateRange.start.toISOString().split('T')[0];
      const endDate = dateRange.end.toISOString().split('T')[0];
      const classId = selectedClassForChart || undefined;
      
      const response = await healthService.getHealthStatusByDateRange(startDate, endDate, classId);
      if (response.status === 'success' && response.data) {
        setBarChartData(response.data);
      }
    } catch (error) {
      console.error('Failed to load bar chart data:', error);
    } finally {
      setBarChartLoading(false);
    }
  };

  const loadHealthRecords = async () => {
    try {
      setTableLoading(true);
      const filters: any = {
        page: currentPage,
        limit: pageSize
      };

      if (filterClass) filters.class_id = filterClass;
      if (filterStatus) filters.status = filterStatus;
      if (filterDate) filters.date = filterDate;
      if (searchQuery) filters.search = searchQuery;

      const response = await healthService.getAllHealthRecords(filters);
      if (response.success && response.data) {
        // Handle nested data structure
        const recordsData = response.data.data || response.data || [];
        setHealthRecords(Array.isArray(recordsData) ? recordsData : []);
        setTotalRecords(response.data.total || 0);
        setTotalPages(response.data.total_pages || 1);
      } else {
        console.error('Health records response:', response);
        setHealthRecords([]);
      }
    } catch (error) {
      console.error('Failed to load health records:', error);
      addToast({ message: 'Failed to load health records', type: 'error' });
    } finally {
      setTableLoading(false);
    }
  };

  // Date range handler for nurse health status chart
  const handleDateRangeChange = (startDate: Date, endDate: Date) => {
    setDateRange({ start: startDate, end: endDate });
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    loadHealthRecords();
  };

  const handleResetFilters = () => {
    setFilterClass('');
    setFilterStatus('');
    setFilterDate('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRecords(new Set(healthRecords.map(r => r.record_id)));
    } else {
      setSelectedRecords(new Set());
    }
  };

  const handleSelectRecord = (recordId: string, checked: boolean) => {
    const newSelected = new Set(selectedRecords);
    if (checked) {
      newSelected.add(recordId);
    } else {
      newSelected.delete(recordId);
    }
    setSelectedRecords(newSelected);
  };

  const handleExport = () => {
    if (selectedRecords.size === 0) {
      addToast({ message: 'Please select at least one record to export', type: 'warning' });
      return;
    }

    const recordsToExport = healthRecords.filter(r => selectedRecords.has(r.record_id));
    const exportData = recordsToExport.map(record => ({
      'Index No': record.student_id,
      'Names': `${record.first_name} ${record.last_name}`,
      'Class': record.class_name,
      'Date': new Date(record.recorded_at).toLocaleDateString(),
      'Status': record.is_sick ? 'Sick' : 'Healthy',
      'Illness': record.illness || '',
      'Notes': record.notes || ''
    }));

    try {
      const filename = generateFilename('health_records', new Date());
      exportToCSV(exportData, filename);
      addToast({ message: `Exported ${exportData.length} record(s) successfully`, type: 'success' });
    } catch (error) {
      addToast({ message: 'Failed to export records', type: 'error' });
    }
  };

  const pieChartData = useMemo(
    () =>
      mostSickClasses.map((cls, index) => ({
        name: `${cls.class_name} (${cls.sick_count})`,
        value: cls.sick_count,
        class_name: cls.class_name,
        sick_count: cls.sick_count,
        color: graphColors2[index % graphColors2.length]
      })),
    [mostSickClasses]
  );

  const pieChartTotal = useMemo(
    () => pieChartData.reduce((sum, item) => sum + item.value, 0),
    [pieChartData]
  );

  const handlePieSliceHover = (entry: any) => {
    if (!entry) return;
    if (hoveredSlice && hoveredSlice.name === entry.name && hoveredSlice.value === entry.value) return;

    setTooltipPinned(true);
    setHoveredSlice({
      name: entry.name,
      value: entry.value,
      color: entry.color,
      payload: entry
    });
  };

  const handlePieChartClick = () => {
    setTooltipPinned(false);
    setHoveredSlice(null);
  };

  const handlePieSliceLeave = () => {
    if (tooltipPinned) return;
    setHoveredSlice(null);
  };

  const loadSickStudentsByClass = async (classId?: string, className?: string) => {
    try {
      setHealthStatusLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append("limit", "1000");
      if (classId) {
        queryParams.append("class_id", classId);
      }

      const response = await apiClient.get(`/api/students/sick?${queryParams.toString()}`);
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
        setHealthStatusTitle(
          className ? `Sick students - ${className}` : "Sick students"
        );
      } else {
        throw new Error(response.message || "Failed to load sick students");
      }
    } catch (error) {
      console.error("Failed to load sick students:", error);
      addToast({ message: "Failed to load sick students", type: "error" });
      setHealthStatusStudents([]);
    } finally {
      setHealthStatusLoading(false);
    }
  };

  const handlePieSliceAction = async (slice: any) => {
    const className = slice?.payload?.class_name ?? slice?.class_name;
    const classId = slice?.payload?.class_id ?? slice?.class_id;
    setHealthStatusStudents([]);
    setHealthStatusTitle(className ? `Sick students - ${className}` : "Sick students");
    setHealthStatusModalOpen(true);
    await loadSickStudentsByClass(classId, className);
  };

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'sick', label: 'Sick' },
    { value: 'healthy', label: 'Healthy' }
  ];

  const classOptions = [
    { value: '', label: 'All Classes' },
    ...classes.map(cls => ({ value: cls.class_id, label: cls.class_name }))
  ];

  return (
    <div className="my-4">
      {/* Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cardsLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white/80 backdrop-blur-sm rounded-lg p-4 w-full border border-gray-200 shadow-sm animate-pulse">
                <div className="flex mb-4 gap-3">
                  <div className="h-5 w-32 bg-gray-200 rounded"></div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                  <div className="flex flex-col justify-center items-center gap-2">
                    <div className="h-6 w-16 bg-gray-200 rounded"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <HomeNurseReviewCards
              title="Total Students"
              comment="Assigned to classes"
              number={statistics.total_students.toString()}
              icon={<HiUsers />}
            />
            <HomeNurseReviewCards
              title="Total Classes"
              comment="Active classes"
              number={statistics.total_classes.toString()}
              icon={<HiClipboardCheck />}
            />
            <HomeNurseReviewCards
              title="Records This Month"
              comment="Health records"
              number={statistics.total_records_this_month.toString()}
              icon={<HiDocumentText />}
            />
            <HomeNurseReviewCards
              title="Currently Sick"
              comment="Active cases"
              number={statistics.currently_sick.toString()}
              icon={<HiUsers />}
            />
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Most sick classes - Pie Chart */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Most sick classes</h3>
          <div className="h-64">
            {pieChartLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main"></div>
              </div>
            ) : pieChartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart onClick={handlePieChartClick}>
                  <PinnedTooltip
                    hoveredSlice={hoveredSlice}
                    pinned={tooltipPinned}
                    onPinChange={setTooltipPinned}
                    total={pieChartTotal}
                    actionNames={pieChartData.map((entry) => entry.name)}
                    onAction={handlePieSliceAction}
                    actionLabel={() => "View sick list"}
                  />
                  <Pie
                    data={pieChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={2}
                    label={(entry: any) => `${entry.class_name}: ${entry.sick_count}`}
                    labelLine={true}
                    onMouseEnter={handlePieSliceHover}
                    onMouseMove={handlePieSliceHover}
                    onMouseLeave={handlePieSliceLeave}
                  >
                    {pieChartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieChartData[index]?.color} />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    height={30}
                    iconType="rect"
                    wrapperStyle={{ fontSize: '12px' }}
                    formatter={(value: string) => {
                      // Extract class name from label (format: "ClassName (count)")
                      const match = value.match(/^(.+?)\s*\(/);
                      return match ? match[1] : value;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Health status - Bar Chart */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-gray-900">Health status</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <SearchableSelect
                options={classOptions}
                placeholder="All Classes"
                onSelect={(value) => setSelectedClassForChart(value)}
                className="min-w-[150px]"
              />
              <label className="text-[.8rem] text-main">Date range: </label>
              <DateRangePicker
                placeholder="Select date range"
                onDateRangeChange={handleDateRangeChange}
                className="min-w-[200px]"
                position="right"
              />
            </div>
          </div>
          <div className="h-64">
            {barChartLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main"></div>
              </div>
            ) : barChartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                {dateRange.start && dateRange.end ? 'No data available for selected range' : 'Please select a date range'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} barCategoryGap="15%">
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: '#666' }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: '#666' }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.04)" }}
                    content={<CustomTooltip />}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={30}
                    iconType="rect"
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                  <Bar dataKey="healthy" fill="#111827" name="Healthy" barSize={15} />
                  <Bar dataKey="sick" fill="#9CA3AF" name="Sick" barSize={15} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Health overview Section */}
      <h3 className="text-sm font-semibold text-gray-900">Health overview</h3>
      <div className="bg-white border border-gray-200 rounded-lg mt-4">
        {/* Header with Search and Controls */}
        <div className="p-4 border-b border-gray-200">
          {/* Search and Buttons Row */}
          <div className="flex gap-3 items-center mb-3 justify-between flex-wrap">
            <div className="flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Search student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-main focus:border-transparent"
              />
            </div>
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
              <button 
                onClick={handleExport}
                disabled={selectedRecords.size === 0}
                className="bg-main text-white px-3 py-1.5 text-xs rounded-md flex items-center gap-2 hover:bg-main/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HiDownload className="w-3 h-3" />
                Export ({selectedRecords.size})
              </button>
            </div>
          </div>

          {/* Collapsible Filters */}
          {showFilters && (
            <div className="flex gap-3 items-center p-3 bg-main/5 border border-main/20 rounded-md flex-wrap">
              <div className="min-w-[150px]">
                <SearchableSelect
                  options={classOptions}
                  placeholder="Select class"
                  onSelect={(value) => setFilterClass(value)}
                />
              </div>
              <div className="min-w-[150px]">
                <SearchableSelect
                  options={statusOptions}
                  placeholder="Select status"
                  onSelect={(value) => setFilterStatus(value)}
                />
              </div>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-xs"
              />
              <select 
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded px-2 py-1 text-xs"
              >
                <option value={10}>Show 10 rows</option>
                <option value={20}>Show 20 rows</option>
                <option value={50}>Show 50 rows</option>
                <option value={100}>Show 100 rows</option>
              </select>
              <div className="flex gap-2 ml-auto">
                <button 
                  onClick={handleApplyFilters}
                  className="px-3 py-1 bg-main text-white rounded text-xs hover:bg-main/90"
                >
                  Apply
                </button>
                <button 
                  onClick={handleResetFilters}
                  className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-main text-white">
              <tr>
                <th className="px-3 py-2 text-left w-8">
                  <input 
                    type="checkbox" 
                    checked={selectedRecords.size === healthRecords.length && healthRecords.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-3 h-3 text-white bg-transparent border-white rounded" 
                  />
                </th>
                {/* <th className="px-3 py-2 text-left font-medium">Index no</th> */}
                <th className="px-3 py-2 text-left font-medium">Names</th>
                <th className="px-3 py-2 text-left font-medium">Class</th>
                <th className="px-3 py-2 text-left font-medium">Date</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-left font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tableLoading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-main mb-2"></div>
                      <p className="text-gray-500 text-xs">Loading records...</p>
                    </div>
                  </td>
                </tr>
              ) : healthRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-gray-400 text-2xl mb-2">📋</div>
                      <p className="text-gray-500 text-xs">No health records found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                healthRecords.map((record) => (
                  <tr key={record.record_id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <input 
                        type="checkbox" 
                        checked={selectedRecords.has(record.record_id)}
                        onChange={(e) => handleSelectRecord(record.record_id, e.target.checked)}
                        className="w-3 h-3 text-main bg-white border-gray-300 rounded focus:ring-main" 
                      />
                    </td>
                    {/* <td className="px-3 py-2 text-gray-900">{record.student_id}</td> */}
                    <td className="px-3 py-2 text-gray-600">{record.first_name} {record.last_name}</td>
                    <td className="px-3 py-2 text-gray-600">{record.class_name || 'N/A'}</td>
                    <td className="px-3 py-2 text-gray-600">
                      {new Date(record.recorded_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        record.is_sick 
                          ? 'bg-main text-gray-200' 
                          : 'bg-gray-100 text-main'
                      }`}>
                        {record.is_sick ? 'Sick' : 'Healthy'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-600">{record.notes || record.illness || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-xs text-gray-600">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} records
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
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
                      className={`px-3 py-1 text-xs border rounded ${
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
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
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

export default NurseReportWidget;
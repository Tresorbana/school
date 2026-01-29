import { useState, useEffect } from "react";
import { HiDownload, HiUser, HiDocumentText, HiUsers, HiClipboardCheck } from "react-icons/hi";
import { ReportTeacherReviewCard, ReportCardSkeleton } from "../../cards/Report.cards";
import { userService } from "../../../services/userService";
import { useAuth } from "../../../utils/context/AuthContext";
import { useToast } from "../../../utils/context/ToastContext";

interface TeacherReportWidgetProps {
  // Add any props needed for data fetching or configuration
}

interface ReportStatsData {
  title: string;
  value: string | number;
  subtitle: string;
  iconType: 'document' | 'clipboard' | 'users' | 'user';
}

interface RecordedAttendance {
  record_id: string;
  created_at: string;
  class_name: string;
  course_name: string;
  period: number;
  day_of_week: string;
  total_students: number;
  present_count: number;
  absent_count: number;
  sick_count: number;
}

interface AbsentStudent {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  class_name: string;
  absence_count: number;
  total_records: number;
  attendance_rate: number;
}

interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

function TeacherReportWidget({}: TeacherReportWidgetProps) {
  const { user } = useAuth();
  const userRole = user?.role;
  const userId = user?.id;
  const { addToast } = useToast();
  
  // Stats cards state
  const [statsData, setStatsData] = useState<ReportStatsData[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  // Recorded attendances state
  const [recordedAttendances, setRecordedAttendances] = useState<RecordedAttendance[]>([]);
  const [attendancesLoading, setAttendancesLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    total_pages: 0,
    total_count: 0,
    per_page: 10,
    has_next: false,
    has_prev: false
  });

  // Export functionality state
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Most absent students state
  const [absentStudents, setAbsentStudents] = useState<AbsentStudent[]>([]);
  const [absentStudentsLoading, setAbsentStudentsLoading] = useState(false);
  const [absentStudentsPagination, setAbsentStudentsPagination] = useState<PaginationInfo>({
    current_page: 1,
    total_pages: 0,
    total_count: 0,
    per_page: 10,
    has_next: false,
    has_prev: false
  });
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectAllStudents, setSelectAllStudents] = useState(false);

  useEffect(() => {
    if (userRole && userId) {
      loadReportStats();
      loadRecordedAttendances(1);
      loadMostAbsentStudents(1);
    }
  }, [userRole, userId]);

  const loadReportStats = async () => {
    if (!userId) return;

    try {
      setStatsLoading(true);
      
      const response = await userService.getTeacherReportStats(userId);

      if (response.success && response.data) {
        setStatsData(response.data as ReportStatsData[]);
      } else {
        setStatsData([]);
        addToast({
          message: response.message || 'Failed to load report statistics',
          type: 'error'
        });
      }
    } catch (error) {
      setStatsData([]);
      addToast({
        message: 'Failed to load report statistics',
        type: 'error'
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const loadRecordedAttendances = async (page: number) => {
    if (!userId) return;

    try {
      setAttendancesLoading(true);
      
      const response = await userService.getTeacherRecordedAttendances(userId, page, 10);

      if (response.success && response.data) {
        setRecordedAttendances(response.data.records);
        setPagination(response.data.pagination);
        // Reset selections when loading new page
        setSelectedRecords(new Set());
        setSelectAll(false);
      } else {
        setRecordedAttendances([]);
        addToast({
          message: response.message || 'Failed to load recorded attendances',
          type: 'error'
        });
      }
    } catch (error) {
      setRecordedAttendances([]);
      addToast({
        message: 'Failed to load recorded attendances',
        type: 'error'
      });
    } finally {
      setAttendancesLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      loadRecordedAttendances(newPage);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRecords(new Set());
    } else {
      const allRecordIds = new Set(recordedAttendances.map(record => record.record_id));
      setSelectedRecords(allRecordIds);
    }
    setSelectAll(!selectAll);
  };

  const handleSelectRecord = (recordId: string) => {
    const newSelected = new Set(selectedRecords);
    if (newSelected.has(recordId)) {
      newSelected.delete(recordId);
    } else {
      newSelected.add(recordId);
    }
    setSelectedRecords(newSelected);
    setSelectAll(newSelected.size === recordedAttendances.length);
  };

  const loadMostAbsentStudents = async (page: number) => {
    if (!userId) return;

    try {
      setAbsentStudentsLoading(true);
      
      const response = await userService.getTeacherMostAbsentStudents(userId, page, 10);

      if (response.success && response.data) {
        setAbsentStudents(response.data.students);
        setAbsentStudentsPagination(response.data.pagination);
        // Reset selections when loading new page
        setSelectedStudents(new Set());
        setSelectAllStudents(false);
      } else {
        setAbsentStudents([]);
        addToast({
          message: response.message || 'Failed to load most absent students',
          type: 'error'
        });
      }
    } catch (error) {
      setAbsentStudents([]);
      addToast({
        message: 'Failed to load most absent students',
        type: 'error'
      });
    } finally {
      setAbsentStudentsLoading(false);
    }
  };

  const handleStudentsPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= absentStudentsPagination.total_pages) {
      loadMostAbsentStudents(newPage);
    }
  };

  const handleSelectAllStudents = () => {
    if (selectAllStudents) {
      setSelectedStudents(new Set());
    } else {
      const allStudentIds = new Set(absentStudents.map(student => student.student_id));
      setSelectedStudents(allStudentIds);
    }
    setSelectAllStudents(!selectAllStudents);
  };

  const handleSelectStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
    setSelectAllStudents(newSelected.size === absentStudents.length);
  };

  const exportStudentsToCSV = () => {
    if (selectedStudents.size === 0) {
      addToast({
        message: 'Please select at least one student to export',
        type: 'warning'
      });
      return;
    }

    const selectedData = absentStudents.filter(student => 
      selectedStudents.has(student.student_id)
    );

    // Create CSV headers
    const headers = [
      'Student Name',
      'Email',
      'Class',
      'Total Absences',
      'Total Records',
      'Attendance Rate (%)'
    ];

    // Create CSV rows
    const csvRows = [
      headers.join(','),
      ...selectedData.map(student => [
        `"${student.first_name} ${student.last_name}"`,
        `"${student.email}"`,
        `"${student.class_name || 'N/A'}"`,
        student.absence_count,
        student.total_records,
        student.attendance_rate
      ].join(','))
    ];

    // Generate random code
    const generateRandomCode = () => {
      return Math.random().toString(36).substring(2, 10);
    };

    // Create and download CSV file
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      const teacherName = `${user?.first_name || 'Teacher'}_${user?.last_name || 'Report'}`.replace(/\s+/g, '_');
      const dateStr = new Date().toISOString().split('T')[0];
      const randomCode = generateRandomCode();
      const filename = `absent_students_${teacherName}_${dateStr}_${randomCode}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    addToast({
      message: `Exported ${selectedStudents.size} students successfully`,
      type: 'success'
    });
  };

  const exportToCSV = () => {
    if (selectedRecords.size === 0) {
      addToast({
        message: 'Please select at least one record to export',
        type: 'warning'
      });
      return;
    }

    const selectedData = recordedAttendances.filter(record => 
      selectedRecords.has(record.record_id)
    );

    // Create CSV headers
    const headers = [
      'Date',
      'Period',
      'Class',
      'Course',
      'Day of Week',
      'Total Students',
      'Present',
      'Absent',
      'Sick'
    ];

    // Create CSV rows
    const csvRows = [
      headers.join(','),
      ...selectedData.map(record => [
        `"${formatDate(record.created_at)}"`,
        `Period ${record.period}`,
        `"${record.class_name || 'N/A'}"`,
        `"${record.course_name || 'Self Study'}"`,
        `"${record.day_of_week}"`,
        record.total_students,
        record.present_count,
        record.absent_count,
        record.sick_count
      ].join(','))
    ];

    // Generate random code
    const generateRandomCode = () => {
      return Math.random().toString(36).substring(2, 10);
    };

    // Create and download CSV file with teacher name and random code
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      const teacherName = `${user?.first_name || 'Teacher'}_${user?.last_name || 'Report'}`.replace(/\s+/g, '_');
      const dateStr = new Date().toISOString().split('T')[0];
      const randomCode = generateRandomCode();
      const filename = `${teacherName}_${dateStr}_${randomCode}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    addToast({
      message: `Exported ${selectedRecords.size} records successfully`,
      type: 'success'
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'document': return <HiDocumentText />;
      case 'clipboard': return <HiClipboardCheck />;
      case 'users': return <HiUsers />;
      case 'user': return <HiUser />;
      default: return <HiDocumentText />;
    }
  };

  return (
    <div className="my-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsLoading ? (
          // Show skeleton loading cards
          Array.from({ length: 4 }).map((_, index) => (
            <ReportCardSkeleton key={index} />
          ))
        ) : (
          // Show real data cards
          statsData.map((stat, index) => (
            <ReportTeacherReviewCard
              key={index}
              title={stat.title}
              value={stat.value}
              subtitle={stat.subtitle}
              icon={getIcon(stat.iconType)}
            />
          ))
        )}
      </div>

      {/* Charts and table-recorded attendances */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-4 mb-6">
        {/* Recorded attendances table */}
        <div className="bg-white rounded-lg border border-gray-200 p-4"
          style={{
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05), -2px 0 4px rgba(0, 0, 0, 0.08), 2px 0 4px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08)'
          }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Recorded attendances</h3>
            <div className="flex items-center space-x-3">
              {selectedRecords.size > 0 && (
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-3 py-1 bg-gray-800 text-white rounded text-xs hover:bg-black"
                >
                  <HiDownload className="w-3 h-3" />
                  Export ({selectedRecords.size})
                </button>
              )}
              <div className="text-xs text-gray-500">
                {pagination.total_count} total records
              </div>
            </div>
          </div>
          
          {attendancesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="grid grid-cols-7 gap-2 py-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="grid grid-cols-7 gap-2 text-xs font-medium text-gray-600 uppercase pb-2 border-b">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="w-3 h-3 text-gray-800 bg-gray-100 border-gray-300 rounded focus:ring-gray-800 focus:ring-2"
                    />
                  </div>
                  <span>Date</span>
                  <span>Period</span>
                  <span>Class</span>
                  <span>Course</span>
                  <span>Students</span>
                  <span>Status</span>
                </div>
                {recordedAttendances.length > 0 ? (
                  recordedAttendances.map((record, _index) => (
                    <div key={record.record_id} className="grid grid-cols-7 gap-2 py-2 text-xs border-b border-gray-100 hover:bg-gray-50">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedRecords.has(record.record_id)}
                          onChange={() => handleSelectRecord(record.record_id)}
                          className="w-3 h-3 text-gray-800 bg-gray-100 border-gray-300 rounded focus:ring-gray-800 focus:ring-2"
                        />
                      </div>
                      <span className="text-gray-900">{formatDate(record.created_at)}</span>
                      <span className="text-gray-900">Period {record.period}</span>
                      <span className="text-gray-900">{record.class_name || 'N/A'}</span>
                      <span className="text-gray-900">{record.course_name || 'Self Study'}</span>
                      <span className="text-gray-900">{record.total_students}</span>
                      <div className="flex items-center space-x-1">
                        <span className="inline-block w-2 h-2 bg-black rounded-full"></span>
                        <span className="text-black font-medium">
                          {record.present_count}P
                        </span>
                        <span className="inline-block w-2 h-2 bg-gray-500 rounded-full ml-1"></span>
                        <span className="text-gray-500 font-medium">
                          {record.absent_count}A
                        </span>
                        {record.sick_count > 0 && (
                          <>
                            <span className="inline-block w-2 h-2 bg-gray-400 rounded-full ml-1"></span>
                            <span className="text-gray-400 font-medium">
                              {record.sick_count}S
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-[.8rem] py-8 text-gray-500">
                    No recorded attendances found
                  </div>
                )}
              </div>
              
              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    Page {pagination.current_page} of {pagination.total_pages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.current_page - 1)}
                      disabled={!pagination.has_prev}
                      className={`px-3 py-1 text-xs rounded ${
                        pagination.has_prev
                          ? 'bg-gray-800 text-white hover:bg-black'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Previous
                    </button>
                    <span className="text-xs text-gray-500">
                      {Math.min((pagination.current_page - 1) * pagination.per_page + 1, pagination.total_count)} - {Math.min(pagination.current_page * pagination.per_page, pagination.total_count)} of {pagination.total_count}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.current_page + 1)}
                      disabled={!pagination.has_next}
                      className={`px-3 py-1 text-xs rounded ${
                        pagination.has_next
                          ? 'bg-gray-800 text-white hover:bg-black'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Most Absent Students table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden"
        style={{
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05), -2px 0 4px rgba(0, 0, 0, 0.08), 2px 0 4px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.08)'
        }}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Most Absent Students</h3>
            <div className="flex items-center space-x-3">
              {selectedStudents.size > 0 && (
                <button
                  onClick={exportStudentsToCSV}
                  className="flex items-center gap-2 px-3 py-1 bg-gray-800 text-white rounded text-xs hover:bg-black"
                >
                  <HiDownload className="w-3 h-3" />
                  Export ({selectedStudents.size})
                </button>
              )}
              <div className="text-xs text-gray-500">
                {absentStudentsPagination.total_count} students with absences
              </div>
            </div>
          </div>
        </div>
        
        {absentStudentsLoading ? (
          <div className="p-4">
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="grid grid-cols-6 gap-4 py-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">
                      <input
                        type="checkbox"
                        checked={selectAllStudents}
                        onChange={handleSelectAllStudents}
                        className="w-3 h-3 text-gray-800 bg-gray-100 border-gray-300 rounded focus:ring-gray-800 focus:ring-2"
                      />
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Student Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Class</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Absences</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {absentStudents.length > 0 ? (
                    absentStudents.map((student, _index) => (
                      <tr key={student.student_id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={selectedStudents.has(student.student_id)}
                            onChange={() => handleSelectStudent(student.student_id)}
                            className="w-3 h-3 text-gray-800 bg-gray-100 border-gray-300 rounded focus:ring-gray-800 focus:ring-2"
                          />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 font-medium">
                          {student.first_name} {student.last_name}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-600">
                          {student.email}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                          {student.class_name || 'N/A'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {student.absence_count} / {student.total_records}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            student.attendance_rate >= 90 
                              ? 'bg-gray-100 text-gray-800' 
                              : student.attendance_rate >= 75 
                              ? 'bg-gray-200 text-gray-700' 
                              : 'bg-gray-300 text-gray-900'
                          }`}>
                            {student.attendance_rate}%
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-xs text-gray-500">
                        No absent students found in your classes
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {absentStudentsPagination.total_pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  Page {absentStudentsPagination.current_page} of {absentStudentsPagination.total_pages}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleStudentsPageChange(absentStudentsPagination.current_page - 1)}
                    disabled={!absentStudentsPagination.has_prev}
                    className={`px-3 py-1 text-xs rounded ${
                      absentStudentsPagination.has_prev
                        ? 'bg-gray-800 text-white hover:bg-black'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Previous
                  </button>
                  <span className="text-xs text-gray-500">
                    {Math.min((absentStudentsPagination.current_page - 1) * absentStudentsPagination.per_page + 1, absentStudentsPagination.total_count)} - {Math.min(absentStudentsPagination.current_page * absentStudentsPagination.per_page, absentStudentsPagination.total_count)} of {absentStudentsPagination.total_count}
                  </span>
                  <button
                    onClick={() => handleStudentsPageChange(absentStudentsPagination.current_page + 1)}
                    disabled={!absentStudentsPagination.has_next}
                    className={`px-3 py-1 text-xs rounded ${
                      absentStudentsPagination.has_next
                        ? 'bg-gray-800 text-white hover:bg-black'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default TeacherReportWidget;
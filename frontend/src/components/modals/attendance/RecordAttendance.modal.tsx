import React, { useState, useRef, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { classService } from "../../../services/academicService";
import { attendanceService, type AttendanceRecord } from "../../../services/attendanceService";
import { useToast } from "../../../utils/context/ToastContext";
import ModalWrapper from "../../shared/ModalWrapper";

interface Student {
  id: string;
  name: string;
  email: string;
  lesson: string;
  status: "Present" | "Absent";
  notes: string;

  absenceDays?: number;
}

interface RecordAttendanceModalProps {
  open: boolean;
  onClose: () => void;
  onRefresh?: () => void;
  classInfo?: {
    className: string;
    subject: string;
    period: string;
    day: string;
    classId?: string;
    date?: string;
  };
  viewOnly?: boolean;
}

const RecordAttendanceModal: React.FC<RecordAttendanceModalProps> = ({
  open,
  onClose,
  onRefresh,
  classInfo = {
    className: "3A",
    subject: "Mathematics",
    period: "Period 1",
    day: "Monday"
  },
  viewOnly = false
}) => {
  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { addToast } = useToast();

  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);

  const truncateText = (value: string, maxLength: number) =>
    value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;

  useEffect(() => {
    if (open && classInfo?.classId) {
      loadStudents();
    } else if (!open) {
      setStudents([]);
      setFilteredStudents([]);
      setIsSubmitted(false);
      setSearchTerm("");
      setSearchQuery("");
    }
  }, [open, classInfo?.classId]);

  useEffect(() => {
    let filtered = students;

    if (searchQuery.trim()) {
      filtered = students.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    filtered = filtered.sort((a: Student, b: Student) => a.name.localeCompare(b.name));
    setFilteredStudents(filtered);
  }, [students, searchQuery]);

  const loadStudents = async () => {
    if (!classInfo?.classId) return;

    try {
      setLoading(true);
      const response = await classService.getStudents(classInfo.classId);

      if (response.success) {
        let transformedStudents: Student[] = response.data.students
          .map((student: any) => ({
            id: student.student_id,
            name: `${student.first_name} ${student.last_name}`,
            email: student.email ?? "",
            lesson: classInfo.subject,
            status: "Present" as const,
            notes: "",
            absenceDays: 0
          }))
          .sort((a: any, b: any) => a.name.localeCompare(b.name));

        if (viewOnly) {
          try {
            const attendanceDate = classInfo?.date || new Date().toISOString().split('T')[0];
            const attendanceResponse = await attendanceService.getAttendanceByDate(
              classInfo.classId,
              attendanceDate,
              classInfo.period || undefined,
              classInfo.subject || undefined
            );

            if (attendanceResponse.success && attendanceResponse.data && attendanceResponse.data.students) {
              const attendanceMap = new Map();
              attendanceResponse.data.students.forEach((record: any) => {
                attendanceMap.set(record.student_id, {
                  status: record.is_present ? "Present" : record.is_sick ? "Sick" : "Absent",
                  notes: record.notes || ""
                });
              });

              transformedStudents = transformedStudents.map(student => {
                const existingAttendance = attendanceMap.get(student.id);
                if (existingAttendance) {
                  return {
                    ...student,
                    status: existingAttendance.status,
                    notes: existingAttendance.notes
                  };
                }
                return student;
              });

              const recordedBy = attendanceResponse.data.recorded_by;
              const courseName = attendanceResponse.data.course_name;
              const totalStudents = attendanceResponse.data.total_students;
              const presentCount = attendanceResponse.data.present_count;

              if (recordedBy) {
                addToast({
                  message: `Attendance recorded by ${recordedBy} for ${courseName} (${presentCount}/${totalStudents} present)`,
                  type: 'success'
                });
              }
            } else {
              addToast({
                message: 'No attendance records found for this specific class, period, and subject combination.',
                type: 'info'
              });
            }
          } catch (err) {
            console.error('Failed to load existing attendance:', err);
            if (err instanceof Error && err.message.includes('No attendance records found')) {
              addToast({
                message: 'No attendance records found for this period.',
                type: 'info'
              });
            } else {
              addToast({
                message: 'Failed to load existing attendance data',
                type: 'error'
              });
            }
          }
        }

        setStudents(transformedStudents);
      }
    } catch (err) {
      addToast({
        message: err instanceof Error ? err.message : 'Failed to load students',
        type: 'error'
      });
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: "Present" | "Absent") => {
    setStudents(prev => prev.map(student =>
      student.id === studentId 
        ? { 
            ...student, 
            status,
            // Clear notes when marking as present
            notes: status === "Present" ? "" : student.notes
          } 
        : student
    ));
  };

  const handleSearch = () => {
    setSearchQuery(searchTerm.trim());
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchQuery("");
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setStudents(prev => prev.map(student =>
      student.id === studentId ? { ...student, notes } : student
    ));
  };

  const handleSubmit = async () => {
    if (!classInfo?.classId) {
      addToast({
        message: 'Class information is missing',
        type: 'error'
      });
      return;
    }

    try {
      setSubmitting(true);

      const attendanceRecords: AttendanceRecord[] = students.map(student => ({
        student_id: student.id,
        status: student.status.toLowerCase() as 'present' | 'absent',
        notes: student.notes || undefined
      }));

      const currentDate = new Date().toISOString().split('T')[0];

      await attendanceService.recordAttendance({
        class_id: classInfo.classId,
        subject: classInfo.subject,
        period: classInfo.period,
        day: classInfo.day,
        date: currentDate,
        attendance_records: attendanceRecords
      });

      setIsSubmitted(true);
      addToast({
        message: 'Attendance recorded successfully!',
        type: 'success'
      });

      setTimeout(() => {
        onClose();
        if (onRefresh) {
          onRefresh();
        }
      }, 2000);
    } catch (err) {
      addToast({
        message: err instanceof Error ? err.message : 'Failed to record attendance',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStudents(prev => prev.map(student => ({
      ...student,
      status: "Present" as const,
      notes: ""
    })));
  };

  useEffect(() => {
    if (headerCheckboxRef.current && filteredStudents.length > 0) {
      const allPresent = filteredStudents.every(student => student.status === "Present");
      const somePresent = filteredStudents.some(student => student.status === "Present");
      headerCheckboxRef.current.indeterminate = somePresent && !allPresent;
    }
  }, [filteredStudents]);

  return (
    <ModalWrapper
      isOpen={open}
      onClose={onClose}
      className="w-full max-w-none"
      containerClassName="w-[80vw] left-1/2"
    >
      <div className="max-h-[95vh] w-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-800">
              {viewOnly ? 'View Attendance Record' : 'Record Attendance'}
            </h3>
            {viewOnly && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                View Only
              </span>
            )}
            {isSubmitted && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                ✅ Recorded
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded hover:bg-gray-100"
          >
            <IoClose className="text-lg" />
          </button>
        </div>

        {/* Action Buttons */}
        {!viewOnly && !isSubmitted && (
          <div className="flex justify-between items-center px-4 py-3 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 font-medium">Quick Actions:</span>
              <button
                onClick={() => {
                  setStudents(prev => prev.map(student => ({ 
                    ...student, 
                    status: "Present" as const,
                    notes: "" // Clear notes when marking all as present
                  })));
                }}
                disabled={loading || students.length === 0}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-white bg-main border border-main rounded-lg hover:bg-main/75 disabled:opacity-50 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Mark all present
              </button>
              <button
                onClick={() => {
                  setStudents(prev => prev.map(student => ({ ...student, status: "Absent" as const })));
                }}
                disabled={loading || students.length === 0}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Mark all absent
              </button>
            </div>
            <div className="text-xs text-gray-500">
              {students.length} students total
            </div>
          </div>
        )}

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Class Info - FLEX LAYOUT */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex flex-wrap gap-6 text-xs">
              <div>
                <span className="text-gray-600">Class:</span>
                <span className="ml-1 font-medium text-gray-900">{classInfo.className}</span>
              </div>
              <div>
                <span className="text-gray-600">Subject:</span>
                <span className="ml-1 font-medium text-gray-900">
                  {classInfo.subject.length > 15
                    ? `${classInfo.subject.slice(0, 15)}...`
                    : classInfo.subject}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Period:</span>
                <span className="ml-1 font-medium text-gray-900">{classInfo.period}</span>
              </div>
              <div>
                <span className="text-gray-600">Day:</span>
                <span className="ml-1 font-medium text-gray-900">{classInfo.day}</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-200">
              {viewOnly ? (
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1 text-main bg-main/10 px-2 py-1 rounded">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="font-medium">Viewing recorded attendance data</span>
                  </div>
                  <span className="text-gray-500">
                    • Date: {new Date().toLocaleDateString()}
                  </span>
                </div>
              ) : isSubmitted ? (
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1 text-main bg-main/10 px-2 py-1 rounded">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">Attendance successfully recorded</span>
                  </div>
                  <span className="text-gray-500">
                    • Date: {new Date().toLocaleDateString()}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs mb-2">
                  <div className="flex items-center gap-1 text-main bg-main/10 px-2 py-1 rounded">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="font-medium">Recording attendance for today</span>
                  </div>
                  <span className="text-gray-500">
                    • Date: {new Date().toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Search Section */}
          {!loading && students.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search students by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-main focus:border-main pr-8"
                  />
                  {searchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      title="Clear search"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <button
                  onClick={handleSearch}
                  className="px-3 py-2 bg-main text-white rounded-lg hover:bg-main/90 text-xs font-medium flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search
                </button>
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  {filteredStudents.length} of {students.length}
                </div>
              </div>
              {searchQuery && (
                <div className="mt-2 text-xs text-gray-600">
                  Showing results for: "<span className="font-medium">{searchQuery}</span>"
                  <button
                    onClick={handleClearSearch}
                    className="ml-2 text-main hover:text-main/80 underline"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto max-h-96 overflow-y-scroll border rounded-lg">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main mb-4"></div>
                <p className="text-gray-500 text-xs">Loading students...</p>
              </div>
            ) : filteredStudents.length === 0 && searchTerm ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="text-gray-400 text-4xl mb-4">🔍</div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">No students found</h3>
                <p className="text-gray-500 text-center text-xs mb-2">
                  No students match your search "{searchTerm}".
                </p>
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-xs text-main hover:text-main/80 underline"
                >
                  Clear search
                </button>
              </div>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="text-gray-400 text-4xl mb-4">👥</div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">No students found</h3>
                <p className="text-gray-500 text-center text-xs">
                  {viewOnly
                    ? "No attendance data available for this class and period."
                    : "No students are enrolled in this class."
                  }
                </p>
              </div>
            ) : (
              <table className="w-full table-fixed">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-8">
                      <input
                        ref={headerCheckboxRef}
                        type="checkbox"
                        className="w-4 h-4 text-main bg-white border-2 border-gray-300 rounded-sm focus:ring-main focus:ring-2 checked:bg-main checked:border-main"
                        onChange={(e) => {
                          if (viewOnly) return;
                          if (e.target.checked) {
                            setStudents(prev => prev.map(student => ({ 
                              ...student, 
                              status: "Present" as const,
                              notes: "" // Clear notes when marking all as present
                            })));
                          } else {
                            setStudents(prev => prev.map(student => ({ ...student, status: "Absent" as const })));
                          }
                        }}
                        checked={filteredStudents.length > 0 && filteredStudents.every(student => student.status === "Present")}
                        disabled={viewOnly}
                      />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-64">Student Name</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-36">Status</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-[28rem]">Notes</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-2 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-main bg-white border-2 border-gray-300 rounded-sm focus:ring-main focus:ring-2 checked:bg-main checked:border-main"
                          onChange={(e) => {
                            if (!viewOnly) {
                              if (e.target.checked) {
                                handleStatusChange(student.id, "Present");
                              } else {
                                handleStatusChange(student.id, "Absent");
                              }
                            }
                          }}
                          checked={student.status === "Present"}
                          disabled={viewOnly}
                        />
                      </td>
                      <td className="px-2 py-1 text-xs text-gray-900">
                        <div className="flex flex-col">
                          <span title={student.name} className="max-w-[14rem] truncate">
                            {truncateText(student.name, 15)}
                          </span>
                          {student.email && (
                            <span title={student.email} className="max-w-[14rem] truncate text-[10px] text-gray-500">
                              {student.email}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-2 py-1 whitespace-nowrap">
                        <div className="flex gap-1">
                          <button
                            onClick={() => !viewOnly && handleStatusChange(student.id, "Present")}
                            disabled={viewOnly}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${student.status === "Present"
                                ? viewOnly
                                  ? "bg-main/20 text-main border border-main/30"
                                  : "bg-main text-white shadow-sm"
                                : viewOnly
                                  ? "bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200"
                                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300"
                              }`}
                          >
                            {viewOnly && student.status === "Present" && (
                              <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            Present
                          </button>
                          <button
                            onClick={() => !viewOnly && handleStatusChange(student.id, "Absent")}
                            disabled={viewOnly}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${student.status === "Absent"
                                ? viewOnly
                                  ? "bg-gray-200 text-gray-700 border border-gray-300"
                                  : "bg-gray-600 text-white shadow-sm"
                                : viewOnly
                                  ? "bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200"
                                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300"
                              }`}
                          >
                            {viewOnly && student.status === "Absent" && (
                              <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                            Absent
                          </button>
                        </div>
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          placeholder={
                            viewOnly 
                              ? "No notes" 
                              : student.status === "Present" 
                                ? "Notes only for absent students" 
                                : "Add note..."
                          }
                          value={student.notes}
                          onChange={(e) => !viewOnly && student.status !== "Present" && handleNotesChange(student.id, e.target.value)}
                          disabled={viewOnly || student.status === "Present"}
                          className={`w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-main focus:border-main min-w-0 ${
                            viewOnly || student.status === "Present" 
                              ? 'bg-gray-50 cursor-not-allowed text-gray-500' 
                              : ''
                          }`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="border-t bg-white">
          {/* Stats Summary - Above buttons with ORIGINAL FONT SIZES */}
          {students.length > 0 && (
            <div className="flex items-center justify-center gap-6 px-4 py-3 bg-gray-50 border-b">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-main rounded-full"></div>
                <span className="text-gray-600 text-[0.8rem]">Present:</span>
                <span className="font-medium text-main text-xs">
                  {students.filter(s => s.status === "Present").length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <span className="text-gray-600 text-[0.8rem]">Absent:</span>
                <span className="font-medium text-gray-700 text-xs">
                  {students.filter(s => s.status === "Absent").length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-gray-600 text-[0.8rem]">Total:</span>
                <span className="font-medium text-gray-700 text-xs">
                  {students.length}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              {!viewOnly && !isSubmitted && (
                <button
                  onClick={handleReset}
                  disabled={submitting || students.length === 0}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset All
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isSubmitted ? (
                <>
                  <div className="flex items-center gap-2 text-xs text-main font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Attendance recorded successfully
                  </div>
                  <button
                    onClick={onClose}
                    className="px-4 py-1.5 bg-gray-500 text-white rounded-lg text-xs font-medium hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                </>
              ) : viewOnly ? (
                <button
                  onClick={onClose}
                  className="px-4 py-1.5 bg-main text-white rounded-lg text-xs font-medium hover:bg-main/90 transition-colors"
                >
                  Close
                </button>
              ) : (
                <>
                  <button
                    onClick={onClose}
                    disabled={submitting}
                    className="px-4 py-1.5 bg-gray-500 text-white rounded-lg text-xs font-medium hover:bg-gray-600 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || students.length === 0}
                    className="px-4 py-1.5 bg-main text-white rounded-lg text-xs font-medium hover:bg-main/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                  >
                    {submitting && (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    )}
                    {submitting ? 'Recording...' : 'Submit Attendance'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default RecordAttendanceModal;
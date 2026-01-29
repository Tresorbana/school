import { useState, useEffect } from "react";
import { HiX } from "react-icons/hi";
import ModalWrapper from "../../shared/ModalWrapper";
import { attendanceService } from "../../../services/attendanceService";
import { useToast } from "../../../utils/context/ToastContext";

interface SelfStudyStudent {
  student_id: string;
  student_name: string;
  student_email: string;
  status: 'present' | 'absent';
  notes?: string;
}

interface SelfStudyAttendanceViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  classId: string;
  className: string;
  period: string;
  periodDisplay: string;
  date: string;
  sessionNotes?: string;
}

function SelfStudyAttendanceViewModal({ 
  isOpen, 
  onClose, 
  sessionId,
  classId, 
  className, 
  period: _period,
  periodDisplay, 
  date,
  sessionNotes 
}: SelfStudyAttendanceViewModalProps) {
  const [students, setStudents] = useState<SelfStudyStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredStudents, setFilteredStudents] = useState<SelfStudyStudent[]>([]);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen && classId && sessionId) {
      loadAttendanceData();
    } else if (!isOpen) {
      setStudents([]);
      setFilteredStudents([]);
      setSearchTerm("");
      setSearchQuery("");
    }
  }, [isOpen, classId, sessionId]);

  useEffect(() => {
    let filtered = students;

    if (searchQuery.trim()) {
      filtered = students.filter(student =>
        student.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.student_email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    filtered = filtered.sort((a, b) => a.student_name.localeCompare(b.student_name));
    setFilteredStudents(filtered);
  }, [students, searchQuery]);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      
      const studentsResponse = await attendanceService.getSelfStudyClassStudents(classId, sessionId);
      
      if (!studentsResponse.success || !studentsResponse.data) {
        throw new Error(studentsResponse.message || 'Failed to load attendance data');
      }

      const studentData = studentsResponse.data.map(student => ({
        student_id: student.student_id,
        student_name: student.student_name,
        student_email: student.student_email,
        status: student.is_absent ? 'absent' as const : 'present' as const,
        notes: student.notes || undefined
      }));

      setStudents(studentData);

    } catch (error) {
      console.error('Failed to load attendance data:', error);
      addToast({
        message: error instanceof Error ? error.message : 'Failed to load attendance data',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
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

  if (!isOpen) return null;

  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount = students.filter(s => s.status === 'absent').length;
  const totalCount = students.length;

  return (
    <ModalWrapper 
      isOpen={isOpen} 
      onClose={onClose}
      className="w-[75vw] max-w-[1400px] mx-4"
    >
      <div className="max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-800">
              View Self-Study Attendance
            </h3>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              View Only
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded hover:bg-gray-100"
          >
            <HiX className="text-lg" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Class Info */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex flex-wrap gap-6 text-xs">
              <div>
                <span className="text-gray-600">Class:</span>
                <span className="ml-1 font-medium text-gray-900">{className}</span>
              </div>
              <div>
                <span className="text-gray-600">Period:</span>
                <span className="ml-1 font-medium text-gray-900">{periodDisplay}</span>
              </div>
              <div>
                <span className="text-gray-600">Date:</span>
                <span className="ml-1 font-medium text-gray-900">{new Date(date).toLocaleDateString()}</span>
              </div>
            </div>
            {sessionNotes && (
              <div className="mt-3 pt-2 border-t border-gray-200">
                <div className="text-xs">
                  <span className="text-gray-600">Session Notes:</span>
                  <span className="ml-1 text-gray-900 italic">"{sessionNotes}"</span>
                </div>
              </div>
            )}
            <div className="mt-3 pt-2 border-t border-gray-200">
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1 text-main bg-main/10 px-2 py-1 rounded">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="font-medium">Viewing recorded attendance data</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search Section */}
          {!loading && students.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search students by name or email..."
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
                <p className="text-gray-500 text-xs">Loading attendance data...</p>
              </div>
            ) : filteredStudents.length === 0 && searchTerm ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="text-gray-400 text-4xl mb-4">🔍</div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">No students found</h3>
                <p className="text-gray-500 text-center text-xs mb-2">
                  No students match your search "{searchTerm}".
                </p>
                <button
                  onClick={handleClearSearch}
                  className="text-xs text-main hover:text-main/80 underline"
                >
                  Clear search
                </button>
              </div>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="text-gray-400 text-4xl mb-4">📋</div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">No attendance data found</h3>
                <p className="text-gray-500 text-center text-xs">
                  No attendance data available for this session.
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-44">Student Name</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-52">Email</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-28">Status</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.student_id} className="hover:bg-gray-50">
                      <td className="px-2 py-1.5 text-sm font-medium text-gray-900">
                        <div className="max-w-[160px] truncate" title={student.student_name}>
                          {student.student_name}
                        </div>
                      </td>
                      <td className="px-2 py-1.5 text-sm text-gray-600">
                        <div className="max-w-[180px] truncate" title={student.student_email}>
                          {student.student_email}
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex gap-1">
                          <button
                            disabled
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              student.status === 'present'
                                ? 'bg-main/20 text-main border border-main/30'
                                : 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200'
                            }`}
                          >
                            {student.status === 'present' && (
                              <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            Present
                          </button>
                          <button
                            disabled
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              student.status === 'absent'
                                ? 'bg-gray-200 text-gray-700 border border-gray-300'
                                : 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200'
                            }`}
                          >
                            {student.status === 'absent' && (
                              <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                            Absent
                          </button>
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          placeholder="No notes"
                          value={student.notes || ''}
                          disabled
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-main focus:border-main bg-gray-50 cursor-not-allowed text-gray-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-white">
          {/* Stats Summary */}
          {students.length > 0 && (
            <div className="flex items-center justify-center gap-6 px-4 py-3 bg-gray-50 border-b">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-main rounded-full"></div>
                <span className="text-gray-600 text-[0.8rem]">Present:</span>
                <span className="font-medium text-main text-xs">{presentCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <span className="text-gray-600 text-[0.8rem]">Absent:</span>
                <span className="font-medium text-gray-700 text-xs">{absentCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-gray-600 text-[0.8rem]">Total:</span>
                <span className="font-medium text-gray-700 text-xs">{totalCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600 text-[0.8rem]">Attendance Rate:</span>
                <span className="font-medium text-blue-600 text-xs">
                  {totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0}%
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end p-4">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-main text-white rounded-lg text-xs font-medium hover:bg-main/90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}

export default SelfStudyAttendanceViewModal;
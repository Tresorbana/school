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
  notes: string;
  selected: boolean;
}

interface SelfStudyAttendanceRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className: string;
  period: string;
  periodDisplay: string;
  date: string;
  onAttendanceRecorded?: () => void;
}

function SelfStudyAttendanceRecordModal({ 
  isOpen, 
  onClose, 
  classId, 
  className, 
  period, 
  periodDisplay, 
  date,
  onAttendanceRecorded 
}: SelfStudyAttendanceRecordModalProps) {
  const [students, setStudents] = useState<SelfStudyStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen && classId) {
      loadStudents();
    }
  }, [isOpen, classId]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await attendanceService.getSelfStudyClassStudents(classId);
      
      if (response.success && response.data) {
        // Convert to our format - all students start as present
        const studentData = response.data.map(student => ({
          student_id: student.student_id,
          student_name: student.student_name,
          student_email: student.student_email,
          status: 'present' as const,
          notes: '',
          selected: true
        }));
        setStudents(studentData);
      } else {
        throw new Error(response.message || 'Failed to load students');
      }
    } catch (error) {
      console.error('Failed to load students:', error);
      addToast({
        message: error instanceof Error ? error.message : 'Failed to load students',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllPresent = () => {
    setStudents(prev => prev.map(student => ({ ...student, status: 'present' as const })));
  };

  const handleMarkAllAbsent = () => {
    setStudents(prev => prev.map(student => ({ ...student, status: 'absent' as const })));
  };

  const handleStatusChange = (studentId: string, status: 'present' | 'absent') => {
    setStudents(prev => prev.map(student => 
      student.student_id === studentId ? { ...student, status } : student
    ));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setStudents(prev => prev.map(student => 
      student.student_id === studentId ? { ...student, notes } : student
    ));
  };

  const handleSelectChange = (studentId: string, selected: boolean) => {
    setStudents(prev => prev.map(student => 
      student.student_id === studentId ? { ...student, selected } : student
    ));
  };

  const handleReset = () => {
    setStudents(prev => prev.map(student => ({ 
      ...student, 
      status: 'present' as const, 
      notes: '', 
      selected: true 
    })));
  };

  const handleSubmitAttendance = async () => {
    try {
      setSubmitting(true);

      // First create the session
      const sessionResponse = await attendanceService.createSelfStudySession(
        classId,
        period,
        date
      );

      if (!sessionResponse.success || !sessionResponse.data) {
        throw new Error(sessionResponse.message || 'Failed to create attendance session');
      }

      const sessionId = sessionResponse.data.self_study_attendance_id;

      // Get only absent students (for efficiency)
      const absentStudents = students
        .filter(student => student.status === 'absent')
        .map(student => ({
          student_id: student.student_id,
          notes: student.notes || undefined
        }));

      // Submit attendance with absent students
      const submitResponse = await attendanceService.submitSelfStudyAttendance(
        sessionId,
        absentStudents
      );

      if (!submitResponse.success) {
        throw new Error(submitResponse.message || 'Failed to submit attendance');
      }

      const presentCount = students.filter(s => s.status === 'present').length;
      const absentCount = students.filter(s => s.status === 'absent').length;

      addToast({
        message: `Attendance recorded successfully! ${presentCount} present, ${absentCount} absent`,
        type: 'success'
      });

      onAttendanceRecorded?.();
      onClose();

    } catch (error) {
      console.error('Failed to submit attendance:', error);
      addToast({
        message: error instanceof Error ? error.message : 'Failed to submit attendance',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount = students.filter(s => s.status === 'absent').length;

  return (
    <ModalWrapper 
      isOpen={isOpen} 
      onClose={onClose}
      className="w-[75vw] max-w-[1400px] mx-4"
    >
      <div className="max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Record Self-Study Attendance</h2>
            <p className="text-sm text-gray-600 mt-1">{periodDisplay} - {className}</p>
            <p className="text-xs text-gray-500">{new Date(date).toLocaleDateString()}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleMarkAllPresent}
              className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-2"
            >
              <span className="text-gray-600">✓</span> Mark all present
            </button>
            <button
              onClick={handleMarkAllAbsent}
              className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-2"
            >
              <span className="text-gray-800">✗</span> Mark all absent
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl hover:bg-main/10 rounded-full p-2"
            >
              <HiX />
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="px-6 py-3 bg-blue-50 border-b border-gray-200">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-gray-900">Total Students: {students.length}</span>
            <div className="flex gap-6">
              <span className="text-gray-700 font-medium">Present: {presentCount}</span>
              <span className="text-gray-700 font-medium">Absent: {absentCount}</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-3 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main"></div>
              <span className="ml-2 text-gray-600">Loading students...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 uppercase w-12">
                      <input
                        type="checkbox"
                        className="w-3 h-3 text-main border-gray-300 rounded"
                        checked={students.every(s => s.selected)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setStudents(prev => prev.map(student => ({ ...student, selected: checked })));
                        }}
                      />
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 uppercase w-44">Student Name</th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 uppercase w-52">Email</th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 uppercase w-28">Status</th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.student_id} className="hover:bg-gray-50">
                      <td className="px-2 py-1.5">
                        <input
                          type="checkbox"
                          className="w-3 h-3 text-main border-gray-300 rounded"
                          checked={student.selected}
                          onChange={(e) => handleSelectChange(student.student_id, e.target.checked)}
                        />
                      </td>
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
                            onClick={() => handleStatusChange(student.student_id, 'present')}
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              student.status === 'present'
                                ? 'bg-gray-800 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            onClick={() => handleStatusChange(student.student_id, 'absent')}
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              student.status === 'absent'
                                ? 'bg-gray-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          placeholder="Reason for absence..."
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-main"
                          value={student.notes}
                          onChange={(e) => handleNotesChange(student.student_id, e.target.value)}
                          disabled={student.status === 'present'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2"
            disabled={submitting}
          >
            <span>🔄</span> Reset All
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitAttendance}
              disabled={submitting || loading}
              className="px-6 py-2 text-sm font-medium text-white bg-main rounded hover:bg-main/90 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Recording...
                </>
              ) : (
                'Record Attendance'
              )}
            </button>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}

export default SelfStudyAttendanceRecordModal;
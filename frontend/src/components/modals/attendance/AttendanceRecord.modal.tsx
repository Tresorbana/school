import { useState } from "react";
import { HiX } from "react-icons/hi";
import ModalWrapper from "../../shared/ModalWrapper";

interface Student {
  id: number;
  name: string;
  lesson: string;
  status: 'Present' | 'Absent';
  notes: string;
  selected: boolean;
}

interface AttendanceRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  period: string;
  className: string;
}

const mockStudents: Student[] = [
  { id: 1, name: "Alice Johnson", lesson: "Mathematics", status: "Present", notes: "", selected: true },
  { id: 2, name: "Bob Smith", lesson: "Physics", status: "Present", notes: "", selected: true },
  { id: 3, name: "Carol Williams", lesson: "Mathematics", status: "Present", notes: "", selected: true },
  { id: 4, name: "David Brown", lesson: "Physics", status: "Present", notes: "", selected: true },
  { id: 5, name: "Emma Davis", lesson: "Physics", status: "Present", notes: "", selected: true },
  { id: 6, name: "Frank Miller", lesson: "Physics", status: "Present", notes: "", selected: true },
];

function AttendanceRecordModal({ isOpen, onClose, period, className }: AttendanceRecordModalProps) {
  const [students, setStudents] = useState<Student[]>(mockStudents);

  if (!isOpen) return null;

  const handleMarkAllPresent = () => {
    setStudents(prev => prev.map(student => ({ ...student, status: 'Present' as const })));
  };

  const handleMarkAllAbsent = () => {
    setStudents(prev => prev.map(student => ({ ...student, status: 'Absent' as const })));
  };

  const handleStatusChange = (id: number, status: 'Present' | 'Absent') => {
    setStudents(prev => prev.map(student => 
      student.id === id ? { ...student, status } : student
    ));
  };

  const handleNotesChange = (id: number, notes: string) => {
    setStudents(prev => prev.map(student => 
      student.id === id ? { ...student, notes } : student
    ));
  };

  const handleSelectChange = (id: number, selected: boolean) => {
    setStudents(prev => prev.map(student => 
      student.id === id ? { ...student, selected } : student
    ));
  };

  const handleReset = () => {
    setStudents(mockStudents.map(student => ({ ...student, status: 'Present' as const, notes: '', selected: true })));
  };

  const handleSaveDraft = () => {
    console.log('Saving draft...', students);
    // Add save draft logic here
  };

  const handleSubmitAttendance = () => {
    console.log('Submitting attendance...', students);
    // Add submit logic here
    onClose();
  };

  return (
    <ModalWrapper 
      isOpen={isOpen} 
      onClose={onClose}
      className="w-full max-w-2xl"
    >
      <div className="max-h-[70vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Record attendance</h2>
            <p className="text-xs text-gray-600">{period} - {className}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllPresent}
              className="px-3 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              ✓ Mark all present
            </button>
            <button
              onClick={handleMarkAllAbsent}
              className="px-3 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              ✗ Mark all absent
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl hover:bg-main/10 rounded-full p-1"
            >
              <HiX />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-3 overflow-y-auto max-h-[45vh]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">
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
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Names</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Lesson</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2">
                      <input
                        type="checkbox"
                        className="w-3 h-3 text-main border-gray-300 rounded"
                        checked={student.selected}
                        onChange={(e) => handleSelectChange(student.id, e.target.checked)}
                      />
                    </td>
                    <td className="px-2 py-2 text-xs font-medium text-gray-900">
                      {student.name}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-600">
                      {student.lesson}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleStatusChange(student.id, 'Present')}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            student.status === 'Present'
                              ? 'bg-main text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleStatusChange(student.id, 'Absent')}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            student.status === 'Absent'
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        placeholder="Add notes (optional)"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-main"
                        value={student.notes}
                        onChange={(e) => handleNotesChange(student.id, e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-between items-center p-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleReset}
            className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            <span>🔄 </span>
            <span>Reset</span>
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={handleSaveDraft}
              className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              <span>💾 </span>
              <span>Save draft</span>
            </button>
            <button
              onClick={handleSubmitAttendance}
              className="px-4 py-1 text-xs font-medium text-white bg-main rounded hover:bg-main/90"
            >
              Submit attendance
            </button>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}

export default AttendanceRecordModal;
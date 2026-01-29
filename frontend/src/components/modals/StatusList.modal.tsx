import React, { useMemo, useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { IoClose } from "react-icons/io5";
import ModalWrapper from "../shared/ModalWrapper";

interface AttendanceStudent {
  id: string;
  name: string;
  className: string;
  reason?: string;
  email?: string;
  gender?: string;
}

interface StatusListModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  students?: AttendanceStudent[];
}

const StatusListModal: React.FC<StatusListModalProps> = ({
  open,
  onClose,
  title,
  students = []
}) => {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedStudentIds, setExpandedStudentIds] = useState<Set<string>>(new Set());

  const filteredStudents = useMemo(() => {
    const byClass = (!selectedClass || selectedClass === "All classes")
      ? students
      : students.filter(student => student.className === selectedClass);

    if (!searchQuery.trim()) {
      return byClass;
    }

    const query = searchQuery.trim().toLowerCase();
    return byClass.filter(student =>
      student.name.toLowerCase().includes(query)
      || student.className.toLowerCase().includes(query)
      || student.reason?.toLowerCase().includes(query)
      || student.email?.toLowerCase().includes(query)
      || student.gender?.toLowerCase().includes(query)
    );
  }, [students, selectedClass, searchQuery]);

  const toggleStudentDetails = (studentId: string) => {
    setExpandedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  if (!open) return null;

  return (
    <ModalWrapper isOpen={open} onClose={onClose} className="w-[32rem] max-w-[32rem]">
      <div className="w-full max-h-[80vh] rounded-xl bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-base font-semibold text-gray-800">
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded hover:bg-gray-100"
          >
            <IoClose className="text-lg" />
          </button>
        </div>

        <div className="px-4 py-3 border-b space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Filter by class:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-gray-100 border-0 rounded px-3 py-1 text-sm text-gray-700 focus:outline-none"
            >
              <option value="">All classes</option>
              {[...new Set(students.map(student => student.className))]
                .filter(Boolean)
                .map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
            </select>
          </div>
          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setSearchQuery(searchInput);
            }}
          >
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search students"
              className="flex-1 bg-gray-100 border-0 rounded px-3 py-1 text-sm text-gray-700 focus:outline-none"
            />
            <button
              type="submit"
              className="px-3 py-1 text-sm font-medium text-white bg-main rounded hover:bg-main/90"
            >
              Search
            </button>
          </form>
        </div>

        <div className="flex-1 px-4 pb-4 pt-2 space-y-2 overflow-y-auto">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <div
                key={student.id}
                className="bg-gray-100 rounded-lg px-3 py-2"
              >
              <div
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-main rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">{student.name}</div>
                  <div className="text-xs text-gray-600">{student.className}</div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleStudentDetails(student.id)}
                  title={`Show full detail of ${student.name}`}
                  className="p-1 rounded hover:bg-gray-200 text-gray-600"
                >
                  {expandedStudentIds.has(student.id) ? <FiChevronUp /> : <FiChevronDown />}
                </button>
              </div>
              {expandedStudentIds.has(student.id) && (
                <div className="mt-2 rounded-md bg-white px-3 py-2 text-xs text-gray-600 space-y-1">
                  <div><span className="font-medium text-gray-700">Gender:</span> {student.gender ?? '—'}</div>
                  <div><span className="font-medium text-gray-700">Email:</span> {student.email ?? '—'}</div>
                  <div><span className="font-medium text-gray-700">Class:</span> {student.className}</div>
                  {student.reason && (
                    <div><span className="font-medium text-gray-700">Notes:</span> {student.reason}</div>
                  )}
                </div>
              )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No students found.</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default StatusListModal;

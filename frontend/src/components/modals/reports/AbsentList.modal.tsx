import React, { useState, useMemo } from "react";
import { IoClose } from "react-icons/io5";

interface AbsentStudent {
  id: string;
  name: string;
  class: string;
}

interface AbsentListModalProps {
  open: boolean;
  onClose: () => void;
  day?: string;
  period?: string;
  absentStudents?: AbsentStudent[];
}

const AbsentListModal: React.FC<AbsentListModalProps> = ({
  open,
  onClose,
  day = "Monday",
  period = "Period 1",
  absentStudents = []
}) => {
  const [selectedClass, setSelectedClass] = useState<string>("");

  // Filter students based on selected class
  const filteredStudents = useMemo(() => {
    if (!selectedClass || selectedClass === "All classes") {
      return absentStudents;
    }
    return absentStudents.filter(student => student.class === selectedClass);
  }, [absentStudents, selectedClass]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">
              Absent list - {day}
            </h3>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1 rounded hover:bg-gray-100"
            >
              <IoClose className="text-xl" />
            </button>
          </div>

          {/* Filter */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Filter by class:</span>
              <select 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-gray-200 border-0 rounded px-3 py-1 text-sm text-gray-700 focus:outline-none"
              >
                <option value="">All classes</option>
                <option value="Y2A">Y2A</option>
                <option value="Y2B">Y2B</option>
                <option value="Y2C">Y2C</option>
              </select>
            </div>
          </div>

          {/* Student List */}
          <div className="px-4 pb-4 space-y-2 max-h-80 overflow-y-auto">
            {filteredStudents.length > 0 ? (
              <>
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="bg-gray-200 rounded-lg p-3 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 bg-main rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">{student.name}</div>
                      <div className="text-xs text-gray-600">{student.class}</div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">
                  {selectedClass ? `No absent students in ${selectedClass} for ${period}` : `No absent students for ${period}`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbsentListModal;

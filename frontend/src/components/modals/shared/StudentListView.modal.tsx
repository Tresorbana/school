import { HiX } from "react-icons/hi";
import { useState, useEffect } from "react";
import ModalWrapper from "../../shared/ModalWrapper";
import { apiClient } from "../../../utils/apiClient";

interface Student {
  name: string;
  classroom: string;
  reason?: string;
  notes?: string;
  recorded_at?: string;
  email?: string;
  gender?: string;
  class_name?: string;
  student_name?: string;
}

interface ClassData {
  class_id: string;
  class_name: string;
  year_level: number;
}

interface StudentListViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  students: Student[];
}

function StudentListViewModal({ 
  isOpen, 
  onClose, 
  title, 
  students 
}: StudentListViewModalProps) {
  const classOptions = Array.from(
    new Set(
      students
        .map((student) => student.classroom || student.class_name)
        .filter((value): value is string => Boolean(value))
    )
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>(students);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Load classes when modal opens
  useEffect(() => {
    if (isOpen) {
      loadClasses();
    }
  }, [isOpen]);

  // Update filtered students when search term, selected class, or students change
  useEffect(() => {
    const normalize = (value?: string) => (value ?? '').trim().toLowerCase();
    let filtered = students;

    // Filter by search term (name)
    if (searchTerm) {
      const query = normalize(searchTerm);
      filtered = filtered.filter(student =>
        normalize(student.name || student.student_name).includes(query)
      );
    }

    // Filter by selected class
    if (selectedClass) {
      const selected = normalize(selectedClass);
      filtered = filtered.filter(student =>
        normalize(student.classroom || student.class_name) === selected
      );
    }

    setFilteredStudents(filtered);
  }, [searchTerm, selectedClass, students]);

  const loadClasses = async () => {
    try {
      const response = await apiClient.get('/api/dashboard/classes');
      console.log('Modal classes response:', response);
      if (response.status === 'success') {
        setClasses(response.data);
        console.log('Modal classes loaded:', response.data);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedClass('');
  };

  const getStudentKey = (student: Student, index: number) =>
    `${student.name || student.student_name || 'student'}-${student.classroom || student.class_name || 'class'}-${index}`;

  const toggleRow = (key: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!isOpen) return null;

  return (
    <ModalWrapper 
      isOpen={isOpen} 
      onClose={onClose}
      className="w-full max-w-4xl"
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <HiX className="text-xl" />
          </button>
        </div>

        {/* Filters Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search by name
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter student name..."
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Class Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All classes</option>
                {classOptions.length > 0
                  ? classOptions.map((className) => (
                      <option key={className} value={className}>
                        {className}
                      </option>
                    ))
                  : classes.map((cls) => (
                      <option key={cls.class_id} value={cls.class_name}>
                        {cls.class_name}
                      </option>
                    ))}
              </select>
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredStudents.length} of {students.length} students
          </div>
        </div>

        {/* Students List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredStudents.map((student, idx) => {
            const key = getStudentKey(student, idx);
            const isExpanded = Boolean(expandedRows[key]);
            const statusLabel = student.reason || 'Unknown';
            const classLabel = student.classroom || student.class_name || 'N/A';
            const emailLabel = student.email || 'N/A';
            const genderLabel = student.gender || 'N/A';
            const recordedLabel = student.recorded_at
              ? new Date(student.recorded_at).toLocaleString()
              : 'N/A';

            return (
              <div key={key} className="rounded-lg border bg-gray-50">
                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <h4 className="text-[.8rem] font-medium text-gray-900">{student.name || student.student_name}</h4>
                    <p className="text-[.8rem] text-gray-600">{classLabel}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-[.8rem] rounded-full">
                      {statusLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleRow(key)}
                      className="text-[.8rem] text-gray-600 hover:text-gray-800"
                    >
                      {isExpanded ? 'Hide details ▲' : 'Show details ▼'}
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t bg-white px-4 py-3 text-[.8rem] text-gray-700">
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <div>
                        <span className="font-medium">Email:</span> {emailLabel}
                      </div>
                      <div>
                        <span className="font-medium">Gender:</span> {genderLabel}
                      </div>
                      <div>
                        <span className="font-medium">Class:</span> {classLabel}
                      </div>
                      <div>
                        <span className="font-medium">Recorded:</span> {recordedLabel}
                      </div>
                    </div>
                    <div className="mt-3 text-[.8rem]">
                      <span className="font-medium">Notes:</span>{' '}
                      {student.notes || 'None'}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filteredStudents.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {students.length === 0 ? 'No students found' : 'No students match the current filters'}
              </p>
            </div>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
}

export default StudentListViewModal;
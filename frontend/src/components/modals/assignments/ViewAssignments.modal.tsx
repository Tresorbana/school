import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { FiUser, FiBook, FiTrash2 } from "react-icons/fi";
import { classCourseService, classService, type Class } from "../../../services/academicService";
import { useToast } from "../../../utils/context/ToastContext";

interface ViewAssignmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

interface Assignment {
  course_id: string;
  course_name: string;
  year_level: number;
  teacher_id: string | null;
  teacher_first_name: string | null;
  teacher_last_name: string | null;
  teacher_email: string | null;
  assignment_id: string;
  assigned_at: string;
}

export default function ViewAssignmentsModal({ isOpen, onClose, onRefresh }: ViewAssignmentsModalProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const { addToast } = useToast();

  // Load classes on modal open
  useEffect(() => {
    if (isOpen) {
      loadClasses();
    }
  }, [isOpen]);

  // Load assignments when class is selected
  useEffect(() => {
    if (selectedClassId) {
      loadAssignments();
    } else {
      setAssignments([]);
      setSelectedClass(null);
    }
  }, [selectedClassId]);

  const loadClasses = async () => {
    try {
      const response = await classService.getClasses();
      if (response.success && response.data) {
        setClasses(response.data);
      }
    } catch (error: any) {
      addToast({ message: 'Failed to load classes: ' + error.message, type: 'error' });
    }
  };

  const loadAssignments = async () => {
    if (!selectedClassId) return;

    try {
      setIsLoading(true);
      const response = await classCourseService.getClassAssignments(selectedClassId);
      
      if (response.success && response.data) {
        setAssignments(response.data.courses || []);
        setSelectedClass(response.data.class);
      }
    } catch (error: any) {
      addToast({ message: 'Failed to load assignments: ' + error.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTeacher = async (assignment: Assignment) => {
    if (!assignment.teacher_id) return;

    const confirmRemove = window.confirm(
      `Remove ${assignment.teacher_first_name} ${assignment.teacher_last_name} from ${assignment.course_name}?`
    );

    if (!confirmRemove) return;

    try {
      setIsRemoving(assignment.assignment_id);
      const response = await classCourseService.removeTeacherFromCourse(
        selectedClassId,
        assignment.course_id
      );

      if (response.success) {
        addToast({ message: response.message, type: 'success' });
        loadAssignments(); // Refresh assignments
        onRefresh?.(); // Refresh parent component
      }
    } catch (error: any) {
      addToast({ message: 'Failed to remove teacher: ' + error.message, type: 'error' });
    } finally {
      setIsRemoving(null);
    }
  };

  const handleClose = () => {
    setSelectedClassId("");
    setAssignments([]);
    setSelectedClass(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Teacher Assignments</h2>
            <p className="text-sm text-gray-600 mt-1">
              View and manage teacher-course assignments by class
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <IoClose size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Class Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Class
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-main/20 focus:border-main text-[.8rem]"
            >
              <option value="">Choose a class to view assignments</option>
              {classes.map(cls => (
                <option key={cls.class_id} value={cls.class_id}>
                  {cls.class_name} (Year {cls.year_level})
                </option>
              ))}
            </select>
          </div>

          {/* Assignments Display */}
          {selectedClassId && (
            <div>
              {/* Class Info */}
              {selectedClass && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-900">
                    {selectedClass.class_name} - Year {selectedClass.year_level}
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    {assignments.length} course{assignments.length !== 1 ? 's' : ''} assigned
                  </p>
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-main mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading assignments...</p>
                </div>
              )}

              {/* Assignments List */}
              {!isLoading && assignments.length > 0 && (
                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.assignment_id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        {/* Course Info */}
                        <div className="flex items-center gap-2">
                          <FiBook className="text-blue-600 w-4 h-4" />
                          <div>
                            <h4 className="font-medium text-gray-900 text-sm">
                              {assignment.course_name}
                            </h4>
                            <p className="text-xs text-gray-500">
                              Year {assignment.year_level}
                            </p>
                          </div>
                        </div>

                        {/* Teacher Info */}
                        <div className="flex items-center gap-2 ml-4">
                          <FiUser className="text-green-600 w-4 h-4" />
                          <div>
                            {assignment.teacher_id ? (
                              <>
                                <p className="font-medium text-gray-900 text-sm">
                                  {assignment.teacher_first_name} {assignment.teacher_last_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {assignment.teacher_email}
                                </p>
                              </>
                            ) : (
                              <p className="text-[.8rem] text-gray-500 italic">
                                No teacher assigned
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      {assignment.teacher_id && (
                        <button
                          onClick={() => handleRemoveTeacher(assignment)}
                          disabled={isRemoving === assignment.assignment_id}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Remove Teacher"
                        >
                          {isRemoving === assignment.assignment_id ? (
                            <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <FiTrash2 size={14} />
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!isLoading && assignments.length === 0 && selectedClassId && (
                <div className="text-center py-6">
                  <FiBook className="mx-auto text-gray-400 mb-3" size={32} />
                  <h3 className="text-base font-medium text-gray-900 mb-1">
                    No Courses Assigned
                  </h3>
                  <p className="text-sm text-gray-600">
                    This class doesn't have any courses assigned yet.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* No Class Selected */}
          {!selectedClassId && (
            <div className="text-center py-6">
              <FiUser className="mx-auto text-gray-400 mb-3" size={32} />
              <h3 className="text-base font-medium text-gray-900 mb-1">
                Select a Class
              </h3>
              <p className="text-sm text-gray-600">
                Choose a class from the dropdown to view teacher assignments.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
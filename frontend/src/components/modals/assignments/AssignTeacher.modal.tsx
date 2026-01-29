import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { FiUser, FiBook, FiUsers } from "react-icons/fi";
import { classCourseService } from "../../../services/academicService";
import { userService, type User } from "../../../services/userService";
import SearchableSelect from "../../shared/SearchableSelect";
import { useToast } from "../../../utils/context/ToastContext";

interface AssignTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: {
    class_id: string;
    class_name: string;
    year_level: number;
    course_id: string;
    course_name: string;
  } | null;
  onSuccess?: () => void;
}

export default function AssignTeacherModal({ isOpen, onClose, assignment, onSuccess }: AssignTeacherModalProps) {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [selectedTeacherEmail, setSelectedTeacherEmail] = useState<string>("");
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      loadTeachers();
      setSelectedTeacherEmail(""); // Reset selection
    } else {
      // Restore body scroll when modal is closed
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to restore scroll on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const loadTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const response = await userService.getUsersByRole('teacher');
      
      if (response.status === 'success' && response.data) {
        setTeachers(response.data);
      } else {
        setTeachers([]);
      }
    } catch (error: any) {
      console.error('Failed to load teachers:', error);
      addToast({ message: 'Failed to load teachers: ' + error.message, type: 'error' });
      setTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleAssign = async () => {
    if (!assignment || !selectedTeacherEmail) {
      addToast({ message: 'Please select a teacher', type: 'error' });
      return;
    }

    try {
      setIsAssigning(true);
      const response = await classCourseService.assignTeacherToCourse(
        assignment.class_id, 
        assignment.course_id, 
        selectedTeacherEmail
      );
      
      if (response.success) {
        addToast({ message: response.message, type: 'success' });
        onSuccess?.();
        handleClose();
      }
    } catch (error: any) {
      addToast({ message: 'Failed to assign teacher: ' + error.message, type: 'error' });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleClose = () => {
    setSelectedTeacherEmail("");
    // Restore body scroll
    document.body.style.overflow = 'unset';
    onClose();
  };

  if (!isOpen || !assignment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FiUser className="text-main" size={18} />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Assign Teacher</h2>
              <p className="text-xs text-gray-600">Select a teacher for this course-class assignment</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <IoClose size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Assignment Info */}
          <div className="bg-main/5 border border-main/20 rounded-lg p-3 mb-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
              <FiBook className="text-main" size={14} />
              Assignment Details
            </h3>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <FiUsers className="text-gray-500" size={12} />
                <span className="font-medium text-gray-700">Class:</span>
                <span className="text-gray-900">{assignment.class_name} (Year {assignment.year_level})</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <FiBook className="text-gray-500" size={12} />
                <span className="font-medium text-gray-700">Course:</span>
                <span className="text-gray-900">{assignment.course_name}</span>
              </div>
            </div>
          </div>

          {/* Teacher Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Teacher <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              options={teachers.map(teacher => ({
                value: teacher.email,
                label: `${teacher.first_name} ${teacher.last_name}`,
                subtitle: teacher.email
              }))}
              placeholder="Search and select a teacher"
              onSelect={(teacherEmail) => {
                setSelectedTeacherEmail(teacherEmail);
              }}
              disabled={isAssigning}
              loading={loadingTeachers}
              className="w-full"
            />
            {selectedTeacherEmail && (
              <p className="mt-2 text-xs text-green-600">
                ✓ Teacher selected: {teachers.find(t => t.email === selectedTeacherEmail)?.first_name} {teachers.find(t => t.email === selectedTeacherEmail)?.last_name}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 justify-end p-4 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={isAssigning}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedTeacherEmail || isAssigning}
            className="px-4 py-2 bg-main text-white rounded-lg text-sm hover:bg-main/90 disabled:opacity-50 flex items-center gap-2"
          >
            {isAssigning && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            Assign Teacher
          </button>
        </div>
      </div>
    </div>
  );
}
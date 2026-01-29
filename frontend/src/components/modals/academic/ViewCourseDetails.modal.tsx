import { HiX } from "react-icons/hi";
import ModalWrapper from "../../shared/ModalWrapper";

interface Course {
  course_id: string;
  course_name: string;
  year_level: number;
  created_at: string;
}

interface Assignment {
  class_id: string;
  class_name: string;
  assigned_at: string;
}

interface ViewCourseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  assignments: Assignment[];
}

function ViewCourseDetailsModal({ 
  isOpen, 
  onClose, 
  course, 
  assignments 
}: ViewCourseDetailsModalProps) {
  if (!isOpen || !course) return null;

  return (
    <ModalWrapper 
      isOpen={isOpen} 
      onClose={onClose}
      className="w-full max-w-2xl"
    >
      <div className="p-4 max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Course Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Course Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Course Information</h4>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Course Name</label>
                  <p className="text-gray-900 bg-gray-50 p-2 rounded text-sm">{course.course_name}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Year Level</label>
                  <p className="text-gray-900 bg-gray-50 p-2 rounded text-sm">Year {course.year_level}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Created Date</label>
                  <p className="text-gray-900 bg-gray-50 p-2 rounded text-sm">{new Date(course.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Class Assignments */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Assigned Classes ({assignments.length})</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {assignments.length > 0 ? (
                  assignments.map((assignment) => (
                    <div key={assignment.class_id} className="bg-gray-50 p-2 rounded">
                      <p className="text-sm font-medium text-gray-900">{assignment.class_name}</p>
                      <p className="text-xs text-gray-500">Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No classes assigned to this course yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}

export default ViewCourseDetailsModal;
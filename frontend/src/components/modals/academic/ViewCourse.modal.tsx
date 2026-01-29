import { IoClose } from "react-icons/io5";
import { FaBook, FaCalendarAlt } from "react-icons/fa";
import type { Course } from "../../../services/academicService";

interface ViewCourseDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  courseDetails: Course | null;
}

function ViewCourseDetailsModal({ isOpen, onClose, courseDetails }: ViewCourseDetailsProps) {
  if (!isOpen || !courseDetails) return null;

  const getYearLevelColor = (yearLevel: number) => {
    switch (yearLevel) {
      case 1: return "bg-green-100 text-green-800 border-green-200";
      case 2: return "bg-blue-100 text-blue-800 border-blue-200";
      case 3: return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-main/10 flex items-center justify-center">
              <FaBook className="text-main text-xs" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Course Details
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors"
          >
            <IoClose size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Course Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-semibold text-gray-900">{courseDetails.course_name}</p>
            </div>
          </div>

          {/* Year Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
            <div className="bg-gray-50 rounded-lg p-3">
              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${getYearLevelColor(courseDetails.year_level)}`}>
                <FaCalendarAlt className="text-xs" />
                Year {courseDetails.year_level}
              </span>
            </div>
          </div>

          {/* Timestamps */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Created:</span>
                <span className="text-xs font-medium text-gray-900">{formatDate(courseDetails.created_at)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Updated:</span>
                <span className="text-xs font-medium text-gray-900">{formatDate(courseDetails.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ViewCourseDetailsModal;
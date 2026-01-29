import { IoClose } from "react-icons/io5";
import { FaChalkboardTeacher, FaUsers, FaBook, FaCalendarAlt, FaClock } from "react-icons/fa";
import type { Class } from "../../../services/academicService";

interface ViewClassDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  classDetails: Class | null;
}

function ViewClassDetailsModal({ isOpen, onClose, classDetails }: ViewClassDetailsProps) {
  if (!isOpen || !classDetails) return null;

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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md max-h-[70vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-main/10 flex items-center justify-center">
              <FaChalkboardTeacher className="text-main text-sm" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                {classDetails.class_name}
              </h2>
              <p className="text-xs text-gray-500">Class Details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-colors"
          >
            <IoClose size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 overflow-y-auto max-h-[calc(70vh-100px)]">
          {/* Year Level Badge */}
          <div className="mb-4">
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${getYearLevelColor(classDetails.year_level)}`}>
              Year {classDetails.year_level}
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Class Name */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <FaChalkboardTeacher className="text-main text-xs" />
                <span className="text-xs font-medium text-gray-700">Class Name</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{classDetails.class_name}</p>
            </div>

            {/* Year Level */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <FaCalendarAlt className="text-main text-xs" />
                <span className="text-xs font-medium text-gray-700">Year Level</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">Year {classDetails.year_level}</p>
            </div>

            {/* Student Count */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <FaUsers className="text-main text-xs" />
                <span className="text-xs font-medium text-gray-700">Students</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{(classDetails as any).student_count || 0}</p>
            </div>

            {/* Course Count */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <FaBook className="text-main text-xs" />
                <span className="text-xs font-medium text-gray-700">Courses</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{(classDetails as any).course_count || 0}</p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-4">
            {/* Timestamps */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-xs font-medium text-gray-900 mb-2 flex items-center gap-1.5">
                <FaClock className="text-xs" />
                Timeline
              </h3>
              <div className="text-[.8rem] text-gray-700 space-y-1">
                <p><span className="font-medium">Created:</span> {formatDate(classDetails.created_at)}</p>
                <p><span className="font-medium">Last Updated:</span> {formatDate(classDetails.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ViewClassDetailsModal;
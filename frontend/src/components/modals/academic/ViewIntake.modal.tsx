import { IoClose } from "react-icons/io5";
import { FaGraduationCap, FaBook, FaCalendarAlt, FaClock } from "react-icons/fa";
import ModalWrapper from "../../shared/ModalWrapper";

import type { Intake } from "../../../services/academicService";

interface ViewIntakeDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  intakeDetails: Intake | null;
}

function ViewIntakeDetailsModal({ isOpen, onClose, intakeDetails }: ViewIntakeDetailsProps) {
  if (!isOpen || !intakeDetails) return null;

  // Derive status from the intake data
  const getStatus = (intake: Intake) => {
    if (!intake.is_active) return 'inactive';
    if (intake.current_year_level >= 3) return 'completed';
    if (intake.start_year > new Date().getFullYear()) return 'upcoming';
    return 'active';
  };

  const status = getStatus(intakeDetails);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "upcoming":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "inactive":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusDot = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-500";
      case "completed":
        return "bg-blue-500";
      case "upcoming":
        return "bg-yellow-500";
      case "inactive":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
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
    <ModalWrapper isOpen={isOpen} onClose={onClose} className="w-full max-w-sm sm:max-w-md max-h-[70vh]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-h-[70vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-main/10 flex items-center justify-center">
              <FaGraduationCap className="text-main text-sm" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                {intakeDetails.intake_name}
              </h2>
              <p className="text-xs text-gray-500">Intake Details</p>
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
          {/* Status Badge */}
          <div className="mb-4">
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(status)}`}></span>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Academic Year */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <FaCalendarAlt className="text-main text-xs" />
                <span className="text-xs font-medium text-gray-700">Academic Year</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{intakeDetails.start_year}-{intakeDetails.start_year + 1}</p>
            </div>

            {/* Graduation Year */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <FaGraduationCap className="text-main text-xs" />
                <span className="text-xs font-medium text-gray-700">Graduation Year</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{intakeDetails.end_year}</p>
            </div>

            {/* Current Year Level */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <FaBook className="text-main text-xs" />
                <span className="text-xs font-medium text-gray-700">Current Year Level</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">Year {intakeDetails.current_year_level}</p>
            </div>

            {/* Duration */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <FaClock className="text-main text-xs" />
                <span className="text-xs font-medium text-gray-700">Duration</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{intakeDetails.end_year - intakeDetails.start_year} Years</p>
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
                <p><span className="font-medium">Created:</span> {formatDate(intakeDetails.created_at)}</p>
                <p><span className="font-medium">Last Updated:</span> {formatDate(intakeDetails.updated_at)}</p>
                <p><span className="font-medium">Active:</span> {intakeDetails.is_active ? 'Yes' : 'No'}</p>
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
    </ModalWrapper>
  );
}

export default ViewIntakeDetailsModal;
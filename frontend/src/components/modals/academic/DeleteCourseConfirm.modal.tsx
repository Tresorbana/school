import { HiX } from "react-icons/hi";
import { IoWarning } from "react-icons/io5";
import ModalWrapper from "../../shared/ModalWrapper";

interface Course {
  course_id: string;
  course_name: string;
  year_level: number;
}

interface DeleteCourseConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  onConfirm: () => void;
}

function DeleteCourseConfirmModal({ 
  isOpen, 
  onClose, 
  course, 
  onConfirm 
}: DeleteCourseConfirmModalProps) {
  if (!isOpen || !course) return null;

  return (
    <ModalWrapper 
      isOpen={isOpen} 
      onClose={onClose}
      className="w-full max-w-md"
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0">
            <IoWarning className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Delete Course</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-3">
            Are you sure you want to delete the course <strong>"{course.course_name}"</strong>?
          </p>
          <p className="text-sm text-red-600 font-medium">
            This action cannot be undone and will remove all associated data.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Delete Course
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

export default DeleteCourseConfirmModal;
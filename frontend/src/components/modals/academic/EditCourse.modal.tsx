import { useState, useEffect } from "react";
import { HiX } from "react-icons/hi";
import ModalWrapper from "../../shared/ModalWrapper";

interface Course {
  course_id: string;
  course_name: string;
  year_level: number;
}

interface EditCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  onSave: (courseData: { course_name: string; year_level: number }) => void;
}

function EditCourseModal({ 
  isOpen, 
  onClose, 
  course, 
  onSave 
}: EditCourseModalProps) {
  const [courseName, setCourseName] = useState("");
  const [yearLevel, setYearLevel] = useState(1);

  useEffect(() => {
    if (course) {
      setCourseName(course.course_name);
      setYearLevel(course.year_level);
    }
  }, [course]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ course_name: courseName, year_level: yearLevel });
  };

  if (!isOpen || !course) return null;

  return (
    <ModalWrapper 
      isOpen={isOpen} 
      onClose={onClose}
      className="w-full max-w-md"
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Edit Course</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Name
            </label>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year Level
            </label>
            <select
              value={yearLevel}
              onChange={(e) => setYearLevel(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent"
            >
              <option value={1}>Year 1</option>
              <option value={2}>Year 2</option>
              <option value={3}>Year 3</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-main border border-transparent rounded-md hover:bg-main/90 focus:outline-none focus:ring-2 focus:ring-main"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </ModalWrapper>
  );
}

export default EditCourseModal;
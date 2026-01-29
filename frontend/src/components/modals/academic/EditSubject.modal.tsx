import React, { useState, useEffect, useRef } from "react";
import { IoClose } from "react-icons/io5";
import { classCourseService, type ClassCourseAssignment } from "../../../services/timetableService";
import { useToast } from "../../../utils/context/ToastContext";

interface EditSubjectModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { assignment_id: string; course_name: string }) => void;
  classId?: string;
  timetableClassId?: string; // The actual class_id from the timetable
  initialSubject?: string;
  periodType?: 'lesson' | 'break' | 'lunch';
}

const EditSubjectModal: React.FC<EditSubjectModalProps> = ({
  open,
  onClose,
  onSave,
  classId,
  timetableClassId,
  initialSubject = "",
  periodType = 'lesson',
}) => {
  const [courses, setCourses] = useState<ClassCourseAssignment[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const toastShownRef = useRef(false);

  // Check if this is a break or lunch period
  const isBreakPeriod = periodType === 'break';
  const isLunchPeriod = periodType === 'lunch';
  const isLessonPeriod = periodType === 'lesson';

  useEffect(() => {
    if (open && isLessonPeriod) {
      // Reset toast flag when modal opens
      toastShownRef.current = false;
      
      // Always prioritize timetableClassId (the actual class from timetable data)
      const targetClassId = timetableClassId || classId;
      if (targetClassId) {
        loadCourses();
      }
    }
    
    // Set initial values
    if (initialSubject) {
      const course = courses.find(c => c.course_name === initialSubject);
      if (course) {
        setSelectedCourse(course.assignment_id);
      }
    }
  }, [open, classId, timetableClassId, initialSubject, courses.length, isLessonPeriod]);

  // Separate useEffect for showing toast about courses without teachers
  useEffect(() => {
    if (open && courses.length > 0 && !toastShownRef.current) {
      const coursesWithoutTeacher = courses.filter(course => course.teacher_id === null);
      if (coursesWithoutTeacher.length > 0) {
        toastShownRef.current = true; // Mark as shown to prevent multiple toasts
        addToast({
          title: `${coursesWithoutTeacher.length} course${coursesWithoutTeacher.length > 1 ? 's' : ''} hidden`,
          message: `Some courses don't have assigned teachers: ${coursesWithoutTeacher.map(c => c.course_name).join(', ')}. To use these courses, assign teachers first in the Courses Management section.`,
          type: 'warning',
          duration: 10000 // 10 seconds
        });
      }
    }
  }, [open, courses.length]); // Only depend on open and courses.length, not the full courses array

  const loadCourses = async () => {
    // CRITICAL: Use timetableClassId (from timetable data) not classId (from dropdown)
    const targetClassId = timetableClassId || classId;
    if (!targetClassId) {
      console.error('No class ID available for loading courses');
      return;
    }
    
    try {
      setLoading(true);
      const response = await classCourseService.getClassCourses(targetClassId);
      if (response.success) {
        setCourses(response.data.courses);
      }
    } catch (err) {
      addToast({
        message: err instanceof Error ? err.message : 'Failed to load courses',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    course.teacher_id !== null // Only show courses with assigned teachers
  );

  // const selectedCourseData = courses.find(c => c.assignment_id === selectedCourse);

  const handleSave = () => {
    if (isBreakPeriod || isLunchPeriod) {
      // For break/lunch periods, we don't save anything
      onClose();
      return;
    }

    if (!selectedCourse) {
      addToast({
        message: 'Please select a course',
        type: 'warning'
      });
      return;
    }

    if (!/^[0-9a-fA-F-]{36}$/.test(selectedCourse)) {
      addToast({
        message: 'Invalid course assignment selected. Please refresh and try again.',
        type: 'error'
      });
      return;
    }

    const courseData = courses.find(c => c.assignment_id === selectedCourse);
    if (courseData) {
      onSave({ 
        assignment_id: courseData.assignment_id,
        course_name: courseData.course_name
      });
    }
  };

  const handleClose = () => {
    setSelectedCourse("");
    setSearchTerm("");
    toastShownRef.current = false; // Reset toast flag when closing
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[6px] z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-4 w-[400px] border border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-base text-gray-800">
            {isBreakPeriod ? 'Break Period' : isLunchPeriod ? 'Lunch Period' : 'Edit Subject'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-main-hover/15 rounded-full"
          >
            <IoClose size={20} />
          </button>
        </div>

        {isBreakPeriod || isLunchPeriod ? (
          <div className="mb-4">
            <div className="p-3 bg-gray-50 rounded-lg border">
              <p className="text-sm text-gray-600 mb-2">
                This is a scheduled {isBreakPeriod ? 'break' : 'lunch'} period.
              </p>
              <p className="text-xs text-gray-500">
                {isBreakPeriod ? 'Break periods cannot be edited.' : 'Lunch periods cannot be edited.'}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-3">
              <label className="block mb-1 text-gray-700 text-sm">
                Search Course
              </label>
              <input
                type="text"
                className="border border-gray-300 w-full rounded-lg px-3 py-2 focus:ring-2 focus:ring-main/70 outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type to search courses..."
                disabled={loading}
              />
            </div>

            <div className="mb-3">
              <label className="block mb-1 text-gray-700 text-sm">
                Available Courses
              </label>
              {loading ? (
                <div className="p-3 text-center text-gray-500 text-sm">
                  Loading courses...
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg max-h-40 overflow-y-auto">
                  {filteredCourses.length === 0 ? (
                    <div className="p-3 text-center text-gray-500 text-sm">
                      {searchTerm ? 'No courses match your search' : 'No courses with assigned teachers available'}
                    </div>
                  ) : (
                    filteredCourses.map((course) => (
                      <div
                        key={course.assignment_id}
                        className={`p-2 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                          selectedCourse === course.assignment_id ? 'bg-main/10 border-main/20' : ''
                        }`}
                        onClick={() => setSelectedCourse(course.assignment_id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {course.course_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              Teacher: {course.teacher_first_name && course.teacher_last_name 
                                ? `${course.teacher_first_name} ${course.teacher_last_name}`
                                : 'Not assigned'}
                            </p>
                          </div>
                          {selectedCourse === course.assignment_id && (
                            <div className="w-4 h-4 bg-main rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* {selectedCourseData && (
              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">
                  Selected: {selectedCourseData.course_name}
                </p>
                <p className="text-xs text-blue-600">
                  Teacher: {selectedCourseData.teacher_first_name && selectedCourseData.teacher_last_name 
                    ? `${selectedCourseData.teacher_first_name} ${selectedCourseData.teacher_last_name}`
                    : 'Will be assigned automatically'}
                </p>
                <p className="text-xs text-blue-500 mt-1">
                  Class: {timetableClassId ? `Using timetable class (${timetableClassId})` : `Using selected class (${classId})`}
                </p>
              </div>
            )} */}
          </>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={handleClose}
            className="border border-gray-400 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition text-sm"
          >
            Cancel
          </button>
          {isLessonPeriod && (
            <button
              onClick={handleSave}
              disabled={!selectedCourse || loading}
              className="bg-main text-white px-3 py-1.5 rounded-lg shadow-md hover:bg-main/90 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditSubjectModal;

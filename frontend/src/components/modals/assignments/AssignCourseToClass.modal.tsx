import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { FiBook, FiUsers, FiCheck } from "react-icons/fi";
import { classCourseService, classService, type Class, type Course } from "../../../services/academicService";
import { useToast } from "../../../utils/context/ToastContext";

interface AssignCourseToClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  onRefresh?: () => void;
}

interface ClassWithAssignmentStatus extends Class {
  isAssigned: boolean;
}

export default function AssignCourseToClassModal({ isOpen, onClose, course, onRefresh }: AssignCourseToClassModalProps) {
  const [classes, setClasses] = useState<ClassWithAssignmentStatus[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen && course) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      loadClassesWithAssignmentStatus();
    } else {
      // Restore body scroll when modal is closed
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to restore scroll on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, course]);

  const loadClassesWithAssignmentStatus = async () => {
    if (!course) return;

    try {
      setIsLoading(true);
      
      // Load all classes for this year level
      const classesResponse = await classService.getClasses();
      if (!classesResponse.success || !classesResponse.data) {
        throw new Error('Failed to load classes');
      }

      const matchingClasses = classesResponse.data.filter((cls: Class) => cls.year_level === course.year_level);

      // Load current assignments for this course
      let assignedClassIds: string[] = [];
      try {
        const assignmentsResponse = await classCourseService.getCourseAssignments(course.course_id);
        if (assignmentsResponse.success && assignmentsResponse.data) {
          assignedClassIds = assignmentsResponse.data.classes?.map((cls: any) => cls.class_id) || [];
        }
      } catch (error) {
        // If no assignments found, that's okay - all classes are unassigned
        assignedClassIds = [];
      }

      // Mark classes as assigned or not
      const classesWithStatus: ClassWithAssignmentStatus[] = matchingClasses.map((cls: Class) => ({
        ...cls,
        isAssigned: assignedClassIds.includes(cls.class_id)
      }));

      setClasses(classesWithStatus);
    } catch (error: any) {
      addToast({ message: 'Failed to load classes: ' + error.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClassToggle = (classId: string) => {
    setSelectedClassIds(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const handleAssign = async () => {
    if (!course || selectedClassIds.length === 0) {
      addToast({ message: 'Please select at least one class', type: 'error' });
      return;
    }

    try {
      setIsAssigning(true);
      
      let successCount = 0;
      let errorCount = 0;
      
      // Assign course to each selected class
      for (const classId of selectedClassIds) {
        try {
          await classCourseService.assignCourseToClass(classId, course.course_id);
          successCount++;
        } catch (error: any) {
          errorCount++;
          console.error(`Failed to assign to class ${classId}:`, error);
        }
      }

      if (successCount > 0) {
        addToast({ 
          message: `Course assigned to ${successCount} class${successCount > 1 ? 'es' : ''}${errorCount > 0 ? ` (${errorCount} failed)` : ''}`, 
          type: successCount === selectedClassIds.length ? 'success' : 'warning'
        });
        
        // Only refresh parent data if we had successful assignments
        onRefresh?.();
      } else {
        addToast({ message: 'Failed to assign course to any classes', type: 'error' });
      }
      
      setSelectedClassIds([]);
      
      // Refresh the modal data to show updated assignments
      await loadClassesWithAssignmentStatus();
    } catch (error: any) {
      addToast({ message: 'Failed to assign course: ' + error.message, type: 'error' });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleClose = () => {
    setSelectedClassIds([]);
    // Restore body scroll
    document.body.style.overflow = 'unset';
    onClose();
  };

  // Get unassigned classes for selection
  const unassignedClasses = classes.filter(cls => !cls.isAssigned);
  const assignedClasses = classes.filter(cls => cls.isAssigned);

  if (!isOpen || !course) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FiBook className="text-main" size={18} />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Assign Course to Classes</h2>
              <p className="text-xs text-gray-600">{course.course_name} (Year {course.year_level})</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <IoClose size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-main mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading classes...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Already Assigned Classes */}
              {assignedClasses.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <FiCheck className="text-main" size={14} />
                    Already Assigned ({assignedClasses.length})
                  </h3>
                  <div className="space-y-2">
                    {assignedClasses.map((cls) => (
                      <div
                        key={cls.class_id}
                        className="flex items-center gap-3 py-2 px-3 bg-main/5 border border-main/20 rounded-lg"
                      >
                        <FiUsers className="text-main flex-shrink-0" size={16} />
                        <div className="flex gap-3 justify-between">
                          <p className="text-sm font-medium text-gray-900">{cls.class_name}</p>
                          <p className="text-xs text-gray-600">Year {cls.year_level}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available to Assign */}
              {unassignedClasses.length > 0 ? (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Available to Assign ({unassignedClasses.length})
                  </h3>
                  <div className="space-y-2">
                    {unassignedClasses.map((cls) => (
                      <label
                        key={cls.class_id}
                        className="flex items-center gap-3 py-2 px-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedClassIds.includes(cls.class_id)}
                          onChange={() => handleClassToggle(cls.class_id)}
                          className="h-4 w-4 text-main focus:ring-main border-gray-300 rounded flex-shrink-0"
                        />
                        <FiUsers className="text-gray-500 flex-shrink-0" size={16} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{cls.class_name}</p>
                          <p className="text-xs text-gray-500">Year {cls.year_level}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ) : assignedClasses.length > 0 ? (
                <div className="text-center py-6 bg-main/5 rounded-lg">
                  <FiCheck className="mx-auto text-main mb-2" size={24} />
                  <p className="text-sm text-gray-900 font-medium">All Classes Assigned!</p>
                  <p className="text-xs text-gray-600">This course is assigned to all Year {course.year_level} classes</p>
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <FiUsers className="mx-auto text-gray-400 mb-2" size={24} />
                  <p className="text-sm text-gray-600">
                    No Year {course.year_level} classes found
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="flex gap-2 justify-end p-4 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={isAssigning}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Close
          </button>
          {unassignedClasses.length > 0 && (
            <button
              onClick={handleAssign}
              disabled={selectedClassIds.length === 0 || isAssigning}
              className="px-3 py-2 bg-main text-white rounded-lg text-sm hover:bg-main/90 disabled:opacity-50 flex items-center gap-2"
            >
              {isAssigning && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              Assign to {selectedClassIds.length} Class{selectedClassIds.length !== 1 ? 'es' : ''}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
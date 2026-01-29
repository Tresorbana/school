import { useState, useEffect } from "react";
import { FiEdit2, FiDownload, FiPlus, FiSearch, FiFilter, FiTrash2, FiEye, FiUserPlus, FiUsers } from "react-icons/fi";
import { FaGraduationCap, FaChalkboardTeacher, FaUserTimes } from "react-icons/fa";
import SharedHeader from "../../shared/SharedHeader";
import { courseService, classCourseService, type Course } from "../../../services/academicService";
import AddCourseModal from "../../modals/academic/AddCourse.modal";
import AssignCourseToClassModal from "../../modals/assignments/AssignCourseToClass.modal";
import AssignTeacherModal from "../../modals/assignments/AssignTeacher.modal";
import AllowedRoles from "../../shared/AllowedRoles";
import Role from "../../../utils/constants";
import { useToast } from "../../../utils/context/ToastContext";
import ViewHeader from "../../shared/ViewHeader";

function CoursesView() {
  // Data states
  const [allCourses, setAllCourses] = useState<Course[]>([]); // Raw data from API
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]); // Filtered data for display
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("course_name");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
  const [showFilters, setShowFilters] = useState(false);

  // Statistics states
  const [statistics, setStatistics] = useState({
    total_courses: 0,
    year_1_courses: 0,
    year_2_courses: 0,
    year_3_courses: 0,
    courses_with_classes: 0,
    courses_with_teachers: 0,
    courses_without_teachers: 0,
    total_teachers: 0,
    teachers_with_assignments: 0,
    teachers_without_assignments: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Filter states
  const [yearLevelFilter, setYearLevelFilter] = useState("");
  const [courseNameFilter, setCourseNameFilter] = useState("");

  // Selection and modal states
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [isAssignCourseToClassModalOpen, setIsAssignCourseToClassModalOpen] = useState(false);
  const [courseToAssign, setCourseToAssign] = useState<Course | null>(null);
  const [isViewCourseModalOpen, setIsViewCourseModalOpen] = useState(false);
  const [isEditCourseModalOpen, setIsEditCourseModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseAssignments, setCourseAssignments] = useState<any[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [isAssignTeacherModalOpen, setIsAssignTeacherModalOpen] = useState(false);
  const [teacherAssignment, setTeacherAssignment] = useState<{
    class_id: string;
    class_name: string;
    year_level: number;
    course_id: string;
    course_name: string;
  } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    course: Course | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    course: null,
    isLoading: false
  });

  const { addToast } = useToast();

  useEffect(() => {
    loadCourses();
    loadStatistics();
  }, []); // Only load once on mount

  const loadStatistics = async () => {
    try {
      setLoadingStats(true);
      const response = await courseService.getStatistics();

      if (response.success && response.data) {
        setStatistics(response.data);
      }
    } catch (error: any) {
      console.error('Load statistics error:', error);
      addToast({ message: 'Failed to load statistics: ' + error.message, type: 'error' });
    } finally {
      setLoadingStats(false);
    }
  };

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await courseService.getCourses({
        sort_by: sortBy,
        sort_order: sortOrder
      });

      if (response.success) {
        setAllCourses(response.data);
        setFilteredCourses(response.data); // Initially show all data
      }
    } catch (error: any) {
      console.error('Load courses error:', error);
      addToast({ message: 'Failed to load courses: ' + error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (newSortBy: string) => {
    let newSortOrder: "ASC" | "DESC" = "ASC";

    if (sortBy === newSortBy) {
      newSortOrder = sortOrder === "ASC" ? "DESC" : "ASC";
    } else {
      newSortOrder = "ASC";
    }

    setSortBy(newSortBy);
    setSortOrder(newSortOrder);

    // Apply sorting immediately for column headers
    applySortingToData(newSortBy, newSortOrder);
  };

  const applySortingToData = (sortField: string, sortDirection: "ASC" | "DESC") => {
    // Get the current filtered data and apply sorting to it
    let currentData = [...filteredCourses];

    // Apply sorting
    currentData.sort((a, b) => {
      let aValue: any = a[sortField as keyof Course];
      let bValue: any = b[sortField as keyof Course];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'ASC') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredCourses(currentData);
  };

  const handleApplyFilters = () => {
    let filtered = [...allCourses];

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter((course: Course) =>
        course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.year_level.toString().includes(searchTerm)
      );
    }

    // Apply year level filter
    if (yearLevelFilter) {
      filtered = filtered.filter((course: Course) =>
        course.year_level.toString() === yearLevelFilter
      );
    }

    // Apply course name filter
    if (courseNameFilter) {
      filtered = filtered.filter((course: Course) =>
        course.course_name.toLowerCase().includes(courseNameFilter.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Course];
      let bValue: any = b[sortBy as keyof Course];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'ASC') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredCourses(filtered);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setYearLevelFilter("");
    setCourseNameFilter("");
    setSortBy("course_name");
    setSortOrder("ASC");
    // Apply the reset immediately
    let resetFiltered = [...allCourses];
    resetFiltered.sort((a, b) => {
      const aValue = a.course_name.toLowerCase();
      const bValue = b.course_name.toLowerCase();
      return aValue > bValue ? 1 : -1;
    });
    setFilteredCourses(resetFiltered);
  };

  const handleDeleteCourse = (course: Course) => {
    setDeleteModal({
      isOpen: true,
      course: course,
      isLoading: false
    });
  };

  const confirmDeleteCourse = async () => {
    if (!deleteModal.course) return;

    try {
      setDeleteModal(prev => ({ ...prev, isLoading: true }));

      const response = await courseService.deleteCourse(deleteModal.course.course_id);

      if (response.success) {
        addToast({ message: response.message, type: 'success' });
        setDeleteModal({ isOpen: false, course: null, isLoading: false });
        loadCourses(); // Reload the list
      }
    } catch (error: any) {
      console.error('Delete course error:', error);
      addToast({ message: 'Failed to delete course: ' + error.message, type: 'error' });
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const totalResults = filteredCourses.length;

  const handleSelectAllCourses = (checked: boolean) => {
    if (checked) {
      setSelectedCourses(filteredCourses.map((c) => c.course_id.toString()));
    } else {
      setSelectedCourses([]);
    }
  };

  const handleSelectCourse = (id: string) => {
    setSelectedCourses((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setIsEditCourseModalOpen(true);
  };

  const loadCourseAssignments = async (courseId: string) => {
    try {
      setLoadingAssignments(true);
      // Get all classes that have this course assigned with teacher info
      const response = await classCourseService.getCourseAssignments(courseId);

      if (response.success && response.data) {
        setCourseAssignments(response.data.classes || []);
      } else {
        setCourseAssignments([]);
      }
    } catch (error: any) {
      // If no assignments found, that's okay - just show empty state
      setCourseAssignments([]);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleViewCourse = async (course: Course) => {
    setSelectedCourse(course);
    setCourseAssignments([]);
    setIsViewCourseModalOpen(true);

    // Load assignments for this course
    await loadCourseAssignments(course.course_id);
  };

  const handleAssignCourseToClass = (course: Course) => {
    setCourseToAssign(course);
    setIsAssignCourseToClassModalOpen(true);
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-main"></div>
      </div>
    );
  }

  return (
    <div className="font-poppins min-w-0">
      <SharedHeader placeholder="Search courses" />

      <div className="px-4 sm:px-6 lg:px-10 mb-4">
        <AllowedRoles roles={Role.ADMIN}>
          <div className="mt-4 mb-6">
            <ViewHeader title="Courses" />
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div className="flex gap-4 justify-end">
                <button className="hover:bg-main/5 px-4 py-3 text-[.73rem] rounded-lg flex gap-3 border border-main whitespace-nowrap">
                  <FiDownload className="w-3 h-3" />
                  Export
                </button>
                <button
                  onClick={() => setIsAddCourseModalOpen(true)}
                  className="bg-main hover:bg-main/80 px-4 py-3 text-[.73rem] text-white rounded-lg flex gap-3 whitespace-nowrap"
                >
                  <FiPlus className="w-3 h-3" />
                  <span className="hidden md:block">Add Course</span>
                </button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Total Courses */}
              <div
                className="bg-white/80 backdrop-blur-sm rounded-xl border hover:scale-105 cursor-pointer border-gray-200/50 p-6 transition-all duration-300 hover:bg-white/90"
                style={{
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), -4px 0 8px rgba(0, 0, 0, 0.15), 4px 0 8px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.15)'
                }}
              >
                <div className="mb-4">
                  <span className="text-sm font-semibold text-gray-800">Total Courses</span>
                  <span className="text-gray-400 mx-2">|</span>
                  <span className="text-xs text-blue-500 font-medium">All Levels</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-main flex items-center justify-center shadow-md">
                    <FaGraduationCap className="text-white text-xl" />
                  </div>
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-gray-800 mb-1">
                      {loadingStats ? '...' : statistics.total_courses}
                    </div>
                    <div className="text-xs text-gray-500">Academic courses</div>
                  </div>
                </div>
              </div>

              {/* Courses with Classes */}
              <div
                className="bg-white/80 backdrop-blur-sm rounded-xl border hover:scale-105 cursor-pointer border-gray-200/50 p-6 transition-all duration-300 hover:bg-white/90"
                style={{
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), -4px 0 8px rgba(0, 0, 0, 0.15), 4px 0 8px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.15)'
                }}
              >
                <div className="mb-4">
                  <span className="text-sm font-semibold text-gray-800">Assigned to Classes</span>
                  <span className="text-gray-400 mx-2">|</span>
                  <span className="text-xs text-blue-500 font-medium">Active</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-main flex items-center justify-center shadow-md">
                    <FiUsers className="text-white text-xl" />
                  </div>
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-gray-800 mb-1">
                      {loadingStats ? '...' : statistics.courses_with_classes}
                    </div>
                    <div className="text-xs text-gray-500">Courses with classes</div>
                  </div>
                </div>
              </div>

              {/* Courses with Teachers */}
              <div
                className="bg-white/80 backdrop-blur-sm rounded-xl border hover:scale-105 cursor-pointer border-gray-200/50 p-6 transition-all duration-300 hover:bg-white/90"
                style={{
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), -4px 0 8px rgba(0, 0, 0, 0.15), 4px 0 8px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.15)'
                }}
              >
                <div className="mb-4">
                  <span className="text-sm font-semibold text-gray-800">With Teachers</span>
                  <span className="text-gray-400 mx-2">|</span>
                  <span className="text-xs text-blue-500 font-medium">Assigned</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-main flex items-center justify-center shadow-md">
                    <FaChalkboardTeacher className="text-white text-xl" />
                  </div>
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-gray-800 mb-1">
                      {loadingStats ? '...' : statistics.courses_with_teachers}
                    </div>
                    <div className="text-xs text-gray-500">Courses with teachers</div>
                  </div>
                </div>
              </div>

              {/* Teachers Without Assignments */}
              <div
                className="bg-white/80 backdrop-blur-sm rounded-xl border hover:scale-105 cursor-pointer border-gray-200/50 p-6 transition-all duration-300 hover:bg-white/90"
                style={{
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), -4px 0 8px rgba(0, 0, 0, 0.15), 4px 0 8px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.15)'
                }}
              >
                <div className="mb-4">
                  <span className="text-sm font-semibold text-gray-800">Unassigned Teachers</span>
                  <span className="text-gray-400 mx-2">|</span>
                  <span className="text-xs text-blue-500 font-medium">Available</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-main flex items-center justify-center shadow-md">
                    <FaUserTimes className="text-white text-xl" />
                  </div>
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-gray-800 mb-1">
                      {loadingStats ? '...' : statistics.teachers_without_assignments}
                    </div>
                    <div className="text-xs text-gray-500">Teachers available</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-300 p-4 mb-6">
              <div className="flex flex-col gap-4">
                {/* Search and Filter Toggle Row */}
                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                  <div className="flex-1 relative flex">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleApplyFilters();
                          }
                        }}
                        className="w-full pl-4 pr-4 py-2 border border-gray-200 rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-main/20 focus:border-main border-r-0"
                      />
                    </div>
                    <button
                      onClick={handleApplyFilters}
                      className="px-3 py-2 bg-main text-white rounded-r-lg text-sm hover:bg-main/90 flex items-center gap-2 border border-main"
                    >
                      <FiSearch className="w-4 h-4 sm:hidden" />
                      <span className="hidden sm:inline">Search</span>
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`${showFilters
                          ? 'bg-main text-white'
                          : 'bg-white text-gray-700 border border-gray-300'
                        } px-3 py-2 text-sm rounded-lg flex items-center gap-2 hover:opacity-90 transition-colors`}
                    >
                      <FiFilter className="w-4 h-4" />
                      Filters
                    </button>

                  </div>
                </div>

                {/* Collapsible Filters */}
                {showFilters && (
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center p-3 bg-main/5 border border-main/20 rounded-lg">
                    <select
                      value={sortBy}
                      onChange={(e) => handleSortChange(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-main/20 focus:border-main"
                    >
                      <option value="course_name">Sort by Name</option>
                      <option value="year_level">Sort by Year Level</option>
                      <option value="created_at">Sort by Created</option>
                    </select>
                    <select
                      value={yearLevelFilter}
                      onChange={(e) => setYearLevelFilter(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="">All Year Levels</option>
                      <option value="1">Year 1</option>
                      <option value="2">Year 2</option>
                      <option value="3">Year 3</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Filter by course name..."
                      value={courseNameFilter}
                      onChange={(e) => setCourseNameFilter(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-sm flex-1"
                    />

                    <div className="flex gap-2 ml-auto">
                      <button
                        onClick={handleApplyFilters}
                        className="px-3 py-1 bg-main text-white rounded text-sm hover:bg-main/90"
                      >
                        Apply
                      </button>
                      <button
                        onClick={handleResetFilters}
                        className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Courses Table */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-300 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-[0.98rem] text-main">Courses ({totalResults})</h2>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-main text-white text-xs">
                      <th className="py-2 px-3 text-left">
                        <input
                          type="checkbox"
                          checked={
                            selectedCourses.length === filteredCourses.length && filteredCourses.length > 0
                          }
                          onChange={(e) => handleSelectAllCourses(e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-gray-300"
                        />
                      </th>
                      <th className="py-2 px-3 text-left font-medium cursor-pointer hover:bg-main/80" onClick={() => handleSortChange('course_name')}>
                        Course name {sortBy === 'course_name' && (sortOrder === 'ASC' ? '↑' : '↓')}
                      </th>
                      <th className="py-2 px-3 text-left font-medium cursor-pointer hover:bg-main/80" onClick={() => handleSortChange('year_level')}>
                        Year Level {sortBy === 'year_level' && (sortOrder === 'ASC' ? '↑' : '↓')}
                      </th>
                      <th className="py-2 px-3 text-left font-medium cursor-pointer hover:bg-main/80" onClick={() => handleSortChange('created_at')}>
                        Created {sortBy === 'created_at' && (sortOrder === 'ASC' ? '↑' : '↓')}
                      </th>
                      <th className="py-2 px-3 text-left font-medium">
                        Status
                      </th>
                      <th className="py-2 px-3 text-left font-medium">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCourses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center">
                          <div className="text-gray-500">
                            <p className="text-lg font-semibold mb-2">No courses found</p>
                            <p className="text-sm">
                              {searchTerm || yearLevelFilter || courseNameFilter
                                ? 'No courses match your search criteria.'
                                : 'Get started by adding your first course.'
                              }
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredCourses.map((course, idx) => (
                        <tr
                          key={course.course_id}
                          className={idx % 2 === 0 ? "bg-gray-50 hover:bg-gray-100" : "bg-white hover:bg-gray-50"}
                        >
                          <td className="py-2 px-3">
                            <input
                              type="checkbox"
                              checked={selectedCourses.includes(course.course_id.toString())}
                              onChange={() => handleSelectCourse(course.course_id.toString())}
                              className="w-3.5 h-3.5 rounded border-gray-300"
                            />
                          </td>
                          <td className="py-2 px-3 text-xs text-gray-700 font-medium">
                            {course.course_name}
                          </td>
                          <td className="py-2 px-3 text-xs text-gray-700">
                            Year {course.year_level}
                          </td>
                          <td className="py-2 px-3 text-xs text-gray-700">
                            {new Date(course.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-3">
                            <span className="bg-main text-white px-3 py-1 rounded text-[0.65rem] font-medium">
                              Active
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewCourse(course)}
                                className="text-gray-600 hover:text-main transition-colors"
                                title="View Course Details & Assignments"
                              >
                                <FiEye size={14} />
                              </button>
                              <button
                                onClick={() => handleAssignCourseToClass(course)}
                                className="text-gray-600 hover:text-main transition-colors"
                                title="Assign Course to Classes"
                              >
                                <FiUserPlus size={14} />
                              </button>
                              <button
                                onClick={() => handleEditCourse(course)}
                                className="text-gray-600 hover:text-blue-600 transition-colors"
                                title="Edit Course"
                              >
                                <FiEdit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteCourse(course)}
                                className="text-gray-600 hover:text-red-600 transition-colors"
                                title="Delete Course"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </AllowedRoles>

        {/* Add Course Modal */}
        <AddCourseModal
          isOpen={isAddCourseModalOpen}
          onClose={() => {
            setIsAddCourseModalOpen(false);
            // Only reload if a course was actually added - let the modal handle this
          }}
          onRefresh={loadCourses}
        />

        {/* Assign Course to Class Modal */}
        <AssignCourseToClassModal
          isOpen={isAssignCourseToClassModalOpen}
          onClose={() => {
            setIsAssignCourseToClassModalOpen(false);
            setCourseToAssign(null);
            // Don't reload courses here - only reload when actual assignments happen
          }}
          course={courseToAssign}
          onRefresh={loadCourses}
        />




        {/* View Course Modal */}
        {isViewCourseModalOpen && selectedCourse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 w-full max-w-2xl mx-4 max-h-[85vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Course Details</h3>
                <button
                  onClick={() => {
                    setIsViewCourseModalOpen(false);
                    setSelectedCourse(null);
                    setCourseAssignments([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
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
                        <p className="text-gray-900 bg-gray-50 p-2 rounded text-sm">{selectedCourse.course_name}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Year Level</label>
                        <p className="text-gray-900 bg-gray-50 p-2 rounded text-sm">Year {selectedCourse.year_level}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Created Date</label>
                        <p className="text-gray-900 bg-gray-50 p-2 rounded text-sm">{new Date(selectedCourse.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Teacher Assignments */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Teacher Assignments</h4>

                    {loadingAssignments ? (
                      <div className="text-center py-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-main mx-auto"></div>
                        <p className="mt-2 text-xs text-gray-600">Loading assignments...</p>
                      </div>
                    ) : courseAssignments.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {courseAssignments.map((assignment: any, index: number) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-2">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900 text-xs">
                                  {assignment.class_name} (Year {assignment.year_level})
                                </h5>
                                {assignment.teacher_id ? (
                                  <>
                                    <p className="text-xs text-gray-700">
                                      {assignment.teacher_first_name} {assignment.teacher_last_name}
                                    </p>
                                    <p className="text-xs text-gray-500">{assignment.teacher_email}</p>
                                  </>
                                ) : (
                                  <div className="mt-1">
                                    <p className="text-xs text-gray-500 italic mb-2">No teacher assigned</p>
                                    <button
                                      onClick={() => {
                                        setTeacherAssignment({
                                          class_id: assignment.class_id,
                                          class_name: assignment.class_name,
                                          year_level: assignment.year_level,
                                          course_id: selectedCourse.course_id,
                                          course_name: selectedCourse.course_name
                                        });
                                        setIsAssignTeacherModalOpen(true);
                                      }}
                                      className="w-full px-3 py-2 text-xs bg-main text-white rounded-lg hover:bg-main/90 flex items-center justify-center gap-2"
                                    >
                                      <FiUserPlus size={12} />
                                      Assign Teacher
                                    </button>
                                  </div>
                                )}
                              </div>
                              {assignment.teacher_id && (
                                <button
                                  onClick={async () => {
                                    try {
                                      const response = await classCourseService.removeTeacherFromCourse(
                                        assignment.class_id,
                                        selectedCourse.course_id
                                      );
                                      if (response.success) {
                                        addToast({ message: response.message, type: 'success' });
                                        loadCourseAssignments(selectedCourse.course_id); // Refresh
                                      }
                                    } catch (error: any) {
                                      addToast({ message: 'Failed to remove teacher: ' + error.message, type: 'error' });
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-800 text-xs ml-2 flex-shrink-0"
                                  title="Remove Teacher"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-3 bg-gray-50 rounded-lg">
                        <FiUsers className="mx-auto text-gray-400 mb-2" size={20} />
                        <p className="text-xs text-gray-600">No teacher assignments yet</p>
                        <button
                          onClick={() => {
                            setIsViewCourseModalOpen(false);
                            handleAssignCourseToClass(selectedCourse);
                          }}
                          className="mt-1 text-xs text-main hover:text-main/80"
                        >
                          Assign to Classes
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-4 pt-3 border-t">
                <button
                  onClick={() => {
                    setIsViewCourseModalOpen(false);
                    setSelectedCourse(null);
                    setCourseAssignments([]);
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setIsViewCourseModalOpen(false);
                    handleAssignCourseToClass(selectedCourse);
                  }}
                  className="px-3 py-1.5 bg-main text-white rounded-lg text-xs hover:bg-main/90"
                >
                  Assign to Classes
                </button>
                <button
                  onClick={() => {
                    setIsViewCourseModalOpen(false);
                    setIsEditCourseModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-main text-white rounded-lg text-xs hover:bg-main/90"
                >
                  Edit Course
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Course Modal */}
        {isEditCourseModalOpen && selectedCourse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Edit Course</h3>
                <button
                  onClick={() => {
                    setIsEditCourseModalOpen(false);
                    setSelectedCourse(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const courseName = formData.get('course_name') as string;
                const yearLevel = parseInt(formData.get('year_level') as string);

                try {
                  const response = await courseService.updateCourse(selectedCourse.course_id, {
                    course_name: courseName,
                    year_level: yearLevel
                  });

                  if (response.success) {
                    addToast({ message: response.message, type: 'success' });
                    setIsEditCourseModalOpen(false);
                    setSelectedCourse(null);
                    loadCourses();
                  }
                } catch (error: any) {
                  addToast({ message: 'Failed to update course: ' + error.message, type: 'error' });
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                    <input
                      type="text"
                      name="course_name"
                      defaultValue={selectedCourse.course_name}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-main/20 focus:border-main"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
                    <select
                      name="year_level"
                      defaultValue={selectedCourse.year_level}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-main/20 focus:border-main"
                    >
                      <option value={1}>Year 1</option>
                      <option value={2}>Year 2</option>
                      <option value={3}>Year 3</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 justify-end mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditCourseModalOpen(false);
                      setSelectedCourse(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-main text-white rounded-lg text-sm hover:bg-main/90"
                  >
                    Update Course
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal.isOpen && deleteModal.course && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <FiTrash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Course</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                Are you sure you want to delete <strong>{deleteModal.course.course_name}</strong>?
                This will remove the course and all associated data.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteModal({ isOpen: false, course: null, isLoading: false })}
                  disabled={deleteModal.isLoading}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteCourse}
                  disabled={deleteModal.isLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {deleteModal.isLoading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  Delete Course
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Teacher Modal */}
        <AssignTeacherModal
          isOpen={isAssignTeacherModalOpen}
          onClose={() => {
            setIsAssignTeacherModalOpen(false);
            setTeacherAssignment(null);
          }}
          assignment={teacherAssignment}
          onSuccess={() => {
            if (selectedCourse) {
              loadCourseAssignments(selectedCourse.course_id);
            }
          }}
        />
      </div>
    </div>
  );
}

export default CoursesView;
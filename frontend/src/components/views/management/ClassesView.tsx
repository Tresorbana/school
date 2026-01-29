import { useState, useEffect, useMemo } from "react";
import { FiExternalLink, FiTrash2, FiEye, FiPlus, FiSearch, FiFilter, FiMoreVertical, FiEdit2, FiArrowLeft } from "react-icons/fi";
import { FaGraduationCap, FaUsers, FaCalendarAlt, FaChartLine } from "react-icons/fa";
import { IoSearch } from "react-icons/io5";
import SharedHeader from "../../shared/SharedHeader";
import ModalWrapper from "../../shared/ModalWrapper";
import { classService, type Class } from "../../../services/academicService";
import StudentListModal from "../../modals/reports/StudentList.modal";
import AddClassModal from "../../modals/academic/AddClass.modal";
import AllowedRoles from "../../shared/AllowedRoles";
import Role from "../../../utils/constants";
import { useToast } from "../../../utils/context/ToastContext";
import { isTeacher } from "../../../utils/auth";
import ViewHeader from "../../shared/ViewHeader";

interface Student {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  gender?: string;
}

function ClassesView() {
  // Data states
  const [allClasses, setAllClasses] = useState<Class[]>([]); // Raw data from API
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]); // Filtered data for display
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]); // Teacher's classes from API
  const [loading, setLoading] = useState(true);
  const [teacherLoading, setTeacherLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("class_name");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [yearLevelFilter, setYearLevelFilter] = useState("");
  const [classNameFilter, setClassNameFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [studentSearchInput, setStudentSearchInput] = useState("");

  // Modal states
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedClassStudents, setSelectedClassStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [isViewClassModalOpen, setIsViewClassModalOpen] = useState(false);
  const [isEditClassModalOpen, setIsEditClassModalOpen] = useState(false);
  const [selectedClassForModal, setSelectedClassForModal] = useState<Class | null>(null);
  const [isTeacherClassDetailsModalOpen, setIsTeacherClassDetailsModalOpen] = useState(false);
  const [selectedTeacherClass, setSelectedTeacherClass] = useState<any>(null);
  const [showStudentsInModal, setShowStudentsInModal] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [teacherClassStudents, setTeacherClassStudents] = useState<Student[]>([]);
  const [teacherStudentsLoading, setTeacherStudentsLoading] = useState(false);
  const [actionsModal, setActionsModal] = useState<{
    isOpen: boolean;
    class: Class | null;
  }>({
    isOpen: false,
    class: null
  });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    class: Class | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    class: null,
    isLoading: false
  });

  const { addToast } = useToast();

  // Filter students based on search term for teacher modal
  const filteredStudents = useMemo(() => {
    if (!studentSearchTerm.trim()) {
      return teacherClassStudents;
    }
    return teacherClassStudents.filter(student =>
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(studentSearchTerm.toLowerCase())
    );
  }, [teacherClassStudents, studentSearchTerm]);

  const handleMainSearch = () => {
    setSearchTerm(searchInput);
    handleApplyFilters();
  };

  const handleMainSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleMainSearch();
    }
  };

  const handleStudentSearch = () => {
    setStudentSearchTerm(studentSearchInput);
  };

  const handleStudentSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleStudentSearch();
    }
  };

  useEffect(() => {
    loadClasses();
    if (isTeacher()) {
      loadTeacherClasses();
    }
  }, []); // Only load once on mount

  const loadClasses = async () => {
    try {
      setLoading(true);
      const response = await classService.getClasses({
        with_courses: true,
        sort_by: sortBy,
        sort_order: sortOrder
      });

      if (response.success) {
        setAllClasses(response.data);
        setFilteredClasses(response.data); // Initially show all data
      }
    } catch (error: any) {
      console.error('Load classes error:', error);
      addToast({ message: 'Failed to load classes: ' + error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadTeacherClasses = async () => {
    try {
      setTeacherLoading(true);
      const response = await classService.getTeacherClasses();

      if (response.success) {
        setTeacherClasses(response.data);
      }
    } catch (error: any) {
      console.error('Load teacher classes error:', error);
      addToast({ message: 'Failed to load teacher classes: ' + error.message, type: 'error' });
    } finally {
      setTeacherLoading(false);
    }
  };

  const handleViewDetails = async (classData: any) => {
    try {
      setStudentsLoading(true);
      setSelectedClass(classData);

      // Fetch students for this class
      const response = await classService.getStudents(classData.class_id);
      if (response.success) {
        setSelectedClassStudents(response.data.students || []);
      } else {
        setSelectedClassStudents([]);
        addToast({ message: 'Failed to load students', type: 'error' });
      }

      setIsStudentModalOpen(true);
    } catch (error: any) {
      console.error('Error loading students:', error);
      setSelectedClassStudents([]);
      addToast({ message: 'Failed to load students: ' + error.message, type: 'error' });
      setIsStudentModalOpen(true); // Still open modal to show empty state
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleViewTeacherClassDetails = async (classItem: any) => {
    setSelectedTeacherClass(classItem);
    setShowStudentsInModal(false); // Start with details view
    setIsTeacherClassDetailsModalOpen(true);

    // Pre-load students for this class
    try {
      setTeacherStudentsLoading(true);
      const response = await classService.getStudents(classItem.class_id);
      if (response.success) {
        setTeacherClassStudents(response.data.students || []);
      } else {
        setTeacherClassStudents([]);
      }
    } catch (error: any) {
      console.error('Error loading teacher class students:', error);
      setTeacherClassStudents([]);
    } finally {
      setTeacherStudentsLoading(false);
    }
  };

  const handleShowStudentsInTeacherModal = () => {
    setShowStudentsInModal(true);
  };

  const handleBackToDetails = () => {
    setShowStudentsInModal(false);
  };

  const handleShowActions = (classItem: Class) => {
    setActionsModal({
      isOpen: true,
      class: classItem
    });
  };

  const handleDeleteClass = (classItem: Class) => {
    setDeleteModal({
      isOpen: true,
      class: classItem,
      isLoading: false
    });
  };

  const confirmDeleteClass = async () => {
    if (!deleteModal.class) return;

    try {
      setDeleteModal(prev => ({ ...prev, isLoading: true }));

      const response = await classService.deleteClass(deleteModal.class.class_id);

      if (response.success) {
        addToast({ message: response.message, type: 'success' });
        setDeleteModal({ isOpen: false, class: null, isLoading: false });
        loadClasses(); // Reload the list
      }
    } catch (error: any) {
      console.error('Delete class error:', error);
      addToast({ message: 'Failed to delete class: ' + error.message, type: 'error' });
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleEditClass = (classItem: Class) => {
    setSelectedClassForModal(classItem);
    setIsEditClassModalOpen(true);
  };

  const handleViewClass = (classItem: Class) => {
    setSelectedClassForModal(classItem);
    setIsViewClassModalOpen(true);
  };

  const handleSortChange = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(newSortBy);
      setSortOrder("ASC");
    }
    // Apply filters immediately when sort changes
    setTimeout(() => handleApplyFilters(), 0);
  };

  const handleApplyFilters = () => {
    let filtered = [...allClasses];

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter((classItem: Class) =>
        classItem.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        classItem.year_level.toString().includes(searchTerm)
      );
    }

    // Apply year level filter
    if (yearLevelFilter) {
      filtered = filtered.filter((classItem: Class) =>
        classItem.year_level.toString() === yearLevelFilter
      );
    }

    // Apply class name filter
    if (classNameFilter) {
      filtered = filtered.filter((classItem: Class) =>
        classItem.class_name.toLowerCase().includes(classNameFilter.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Class];
      let bValue: any = b[sortBy as keyof Class];

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

    setFilteredClasses(filtered);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearchTerm("");
    setYearLevelFilter("");
    setClassNameFilter("");
    setSortBy("class_name");
    setSortOrder("ASC");
    setFilteredClasses(allClasses); // Reset to show all data
  };

  const closeModal = () => {
    setIsStudentModalOpen(false);
    setSelectedClass(null);
    setSelectedClassStudents([]);
  };

  // Calculate stats based on FILTERED data
  const totalClasses = filteredClasses.length;
  const year1Classes = filteredClasses.filter(c => c.year_level === 1).length;
  const year2Classes = filteredClasses.filter(c => c.year_level === 2).length;
  const year3Classes = filteredClasses.filter(c => c.year_level === 3).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-main"></div>
      </div>
    );
  }

  return (
    <div className="font-poppins min-w-0">
      <SharedHeader placeholder="Search classes and students" />

      <AllowedRoles roles={Role.ADMIN}>
        <div className="px-4 sm:px-6 lg:px-10 mb-4">
          <ViewHeader title="Classes" />
          {/* Header */}

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div className="flex gap-4 justify-end">
              <button className="hover:bg-main/5 px-4 py-3 text-[.73rem] rounded-lg flex gap-3 border border-main whitespace-nowrap">
                <FiExternalLink className="w-3 h-3" />
                Export
              </button>
              <button
                onClick={() => {
                  setIsAddClassModalOpen(true);
                }}
                className="bg-main hover:bg-main/80 px-4 py-3 text-[.73rem] text-white rounded-lg flex gap-3 whitespace-nowrap"
              >
                <FiPlus className="w-3 h-3" />
                <span className="hidden md:block">Add Class</span>
              </button>
            </div>
          </div>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div
              className="bg-white/80 backdrop-blur-sm rounded-xl border hover:scale-105 cursor-pointer border-gray-200/50 p-6 transition-all duration-300 hover:bg-white/90"
              style={{
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), -4px 0 8px rgba(0, 0, 0, 0.15), 4px 0 8px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.15)'
              }}
            >
              <div className="mb-4">
                <span className="text-sm font-semibold text-gray-800">Total Classes</span>
                <span className="text-gray-400 mx-2">|</span>
                <span className="text-xs text-blue-500 font-medium">All Levels</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-main flex items-center justify-center shadow-md">
                  <FaGraduationCap className="text-white text-xl" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-gray-800 mb-1">{totalClasses}</div>
                  <div className="text-xs text-gray-500">Academic classes</div>
                </div>
              </div>
            </div>

            <div
              className="bg-white/80 backdrop-blur-sm rounded-xl border hover:scale-105 cursor-pointer border-gray-200/50 p-6 transition-all duration-300 hover:bg-white/90"
              style={{
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), -4px 0 8px rgba(0, 0, 0, 0.15), 4px 0 8px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.15)'
              }}
            >
              <div className="mb-4">
                <span className="text-sm font-semibold text-gray-800">Year 1 Classes</span>
                <span className="text-gray-400 mx-2">|</span>
                <span className="text-xs text-blue-500 font-medium">Foundation</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-main flex items-center justify-center shadow-md">
                  <FaUsers className="text-white text-xl" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-gray-800 mb-1">{year1Classes}</div>
                  <div className="text-xs text-gray-500">First year classes</div>
                </div>
              </div>
            </div>

            <div
              className="bg-white/80 backdrop-blur-sm rounded-xl border hover:scale-105 cursor-pointer border-gray-200/50 p-6 transition-all duration-300 hover:bg-white/90"
              style={{
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), -4px 0 8px rgba(0, 0, 0, 0.15), 4px 0 8px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.15)'
              }}
            >
              <div className="mb-4">
                <span className="text-sm font-semibold text-gray-800">Year 2 Classes</span>
                <span className="text-gray-400 mx-2">|</span>
                <span className="text-xs text-blue-500 font-medium">Intermediate</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-main flex items-center justify-center shadow-md">
                  <FaCalendarAlt className="text-white text-xl" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-gray-800 mb-1">{year2Classes}</div>
                  <div className="text-xs text-gray-500">Second year classes</div>
                </div>
              </div>
            </div>

            <div
              className="bg-white/80 backdrop-blur-sm rounded-xl border hover:scale-105 cursor-pointer border-gray-200/50 p-6 transition-all duration-300 hover:bg-white/90"
              style={{
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), -4px 0 8px rgba(0, 0, 0, 0.15), 4px 0 8px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.15)'
              }}
            >
              <div className="mb-4">
                <span className="text-sm font-semibold text-gray-800">Year 3 Classes</span>
                <span className="text-gray-400 mx-2">|</span>
                <span className="text-xs text-blue-500 font-medium">Advanced</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-main flex items-center justify-center shadow-md">
                  <FaChartLine className="text-white text-xl" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-gray-800 mb-1">{year3Classes}</div>
                  <div className="text-xs text-gray-500">Third year classes</div>
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
                      placeholder="Search classes..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyPress={handleMainSearchKeyPress}
                      className="w-full pl-4 pr-4 py-2 border border-gray-200 rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-main/20 focus:border-main border-r-0"
                    />
                  </div>
                  <button
                    onClick={handleMainSearch}
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

                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-main/20 focus:border-main"
                  >
                    <option value="class_name">Sort by Name</option>
                    <option value="year_level">Sort by Year Level</option>
                    <option value="created_at">Sort by Created</option>
                  </select>
                </div>
              </div>

              {/* Collapsible Filters */}
              {showFilters && (
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center p-3 bg-main/5 border border-main/20 rounded-lg">
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
                    placeholder="Filter by class name..."
                    value={classNameFilter}
                    onChange={(e) => setClassNameFilter(e.target.value)}
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

          {/* Classes Grid */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-300 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-[0.98rem] text-main">Classes ({totalClasses})</h2>
            </div>

            {filteredClasses.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-main/10 flex items-center justify-center mx-auto mb-4">
                  <FaGraduationCap className="text-main text-2xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No classes found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {searchTerm || yearLevelFilter || classNameFilter ? 'No classes match your search criteria.' : 'Get started by creating your first class to organize students by year level.'}
                </p>
                {!(searchTerm || yearLevelFilter || classNameFilter) && (
                  <button
                    onClick={() => {
                      setIsAddClassModalOpen(true);
                    }}
                    className="bg-main hover:bg-main/80 px-6 py-3 text-sm text-white rounded-lg transition-colors"
                  >
                    Add new Class
                  </button>
                )}
              </div>
            ) : (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredClasses.map((classItem) => (
                  <div key={classItem.class_id} className="relative group">
                    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">{classItem.class_name}</h3>
                          <p className="text-xs text-gray-500">Year {classItem.year_level}</p>
                        </div>
                        <span className="bg-main/10 text-main px-2 py-1 rounded text-xs font-medium">
                          Active
                        </span>
                      </div>

                      <div className="space-y-2 text-xs text-gray-600">
                        <div className="flex justify-between">
                          <span>Created:</span>
                          <span>{new Date(classItem.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Students:</span>
                          <span>0</span> {/* TODO: Add student count from API */}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons Overlay */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                      <button
                        onClick={() => handleViewClass(classItem)}
                        className="p-1.5 bg-white/90 hover:bg-white rounded-full shadow-md transition-colors"
                        title="View Details"
                      >
                        <FiEye className="w-3 h-3 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleViewDetails(classItem)}
                        className="p-1.5 bg-white/90 hover:bg-white rounded-full shadow-md transition-colors"
                        title="View Students"
                      >
                        <FaUsers className="w-3 h-3 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleShowActions(classItem)}
                        className="p-1.5 bg-white/90 hover:bg-white rounded-full shadow-md transition-colors"
                        title="More Actions"
                      >
                        <FiMoreVertical className="w-3 h-3 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteClass(classItem)}
                        className="p-1.5 bg-white/90 hover:bg-red-50 rounded-full shadow-md transition-colors"
                        title="Delete Class"
                      >
                        <FiTrash2 className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AllowedRoles>

      <AllowedRoles roles={Role.TEACHER}>
        <div className="px-4 sm:px-6 lg:px-10 mb-4">
          <ViewHeader title="My Classes" />

          {teacherLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main"></div>
            </div>
          ) : teacherClasses.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-main/10 flex items-center justify-center mx-auto mb-4">
                <FaGraduationCap className="text-main text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No classes assigned</h3>
              <p className="text-gray-600">You are not currently assigned to teach any classes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {teacherClasses.map((classItem, idx) => (
                <div key={classItem.class_id || idx} className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-4 hover:shadow-md transition-all duration-300 hover:bg-white/90 hover:scale-105">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{classItem.class_name}</h3>
                      <p className="text-xs text-gray-500">Year {classItem.year_level}</p>
                    </div>
                    <span className="bg-main/10 text-main px-2 py-1 rounded text-xs font-medium">
                      {classItem.courses_count} Course{classItem.courses_count !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-gray-600 font-medium mb-1">Courses:</p>
                    <p className="text-xs text-gray-500 line-clamp-2">{classItem.courses_taught || 'No courses assigned'}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails({
                        class_id: classItem.class_id,
                        className: classItem.class_name
                      })}
                      className="flex-1 px-2 py-1.5 bg-main/10 text-main rounded text-xs hover:bg-main/20 transition-colors flex items-center justify-center gap-1"
                    >
                      <FiEye className="w-3 h-3" />
                      Students
                    </button>
                    <button
                      onClick={() => handleViewTeacherClassDetails(classItem)}
                      className="flex-1 px-2 py-1.5 bg-main text-white rounded text-xs hover:bg-main/90 transition-colors flex items-center justify-center gap-1"
                    >
                      <FiMoreVertical className="w-3 h-3" />
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AllowedRoles>

      {/* Student List Modal */}
      <StudentListModal
        open={isStudentModalOpen}
        onClose={closeModal}
        className={selectedClass?.className || selectedClass?.class_name}
        students={studentsLoading ? [] : selectedClassStudents}
      />

      {/* Add Class Modal */}
      <AddClassModal
        isOpen={isAddClassModalOpen}
        onClose={() => {
          setIsAddClassModalOpen(false);
          loadClasses(); // Reload classes after adding
        }}
      />

      {/* View Class Modal */}
      {isViewClassModalOpen && selectedClassForModal && (
        <ModalWrapper
          isOpen={isViewClassModalOpen}
          onClose={() => {
            setIsViewClassModalOpen(false);
            setSelectedClassForModal(null);
          }}
          className="w-full max-w-md"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Class Details</h3>
              <button
                onClick={() => {
                  setIsViewClassModalOpen(false);
                  setSelectedClassForModal(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded">{selectedClassForModal.class_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded">Year {selectedClassForModal.year_level}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded">{new Date(selectedClassForModal.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setIsViewClassModalOpen(false);
                  setSelectedClassForModal(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setIsViewClassModalOpen(false);
                  setIsEditClassModalOpen(true);
                }}
                className="px-4 py-2 bg-main text-white rounded-lg text-sm hover:bg-main/90"
              >
                Edit Class
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* Edit Class Modal */}
      {isEditClassModalOpen && selectedClassForModal && (
        <ModalWrapper
          isOpen={isEditClassModalOpen}
          onClose={() => {
            setIsEditClassModalOpen(false);
            setSelectedClassForModal(null);
          }}
          className="w-full max-w-md"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Class</h3>
              <button
                onClick={() => {
                  setIsEditClassModalOpen(false);
                  setSelectedClassForModal(null);
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
              const className = formData.get('class_name') as string;
              const yearLevel = parseInt(formData.get('year_level') as string);

              try {
                const response = await classService.updateClass(selectedClassForModal.class_id, {
                  class_name: className,
                  year_level: yearLevel
                });

                if (response.success) {
                  addToast({ message: response.message, type: 'success' });
                  setIsEditClassModalOpen(false);
                  setSelectedClassForModal(null);
                  loadClasses();
                }
              } catch (error: any) {
                addToast({ message: 'Failed to update class: ' + error.message, type: 'error' });
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
                  <input
                    type="text"
                    name="class_name"
                    defaultValue={selectedClassForModal.class_name}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-main/20 focus:border-main"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
                  <select
                    name="year_level"
                    defaultValue={selectedClassForModal.year_level}
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
                    setIsEditClassModalOpen(false);
                    setSelectedClassForModal(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-main text-white rounded-lg text-sm hover:bg-main/90"
                >
                  Update Class
                </button>
              </div>
            </form>
          </div>
        </ModalWrapper>
      )}

      {/* Actions Modal */}
      {actionsModal.isOpen && actionsModal.class && (
        <ModalWrapper
          isOpen={actionsModal.isOpen}
          onClose={() => setActionsModal({ isOpen: false, class: null })}
          className="w-full max-w-md"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Actions for {actionsModal.class.class_name}
              </h3>
              <button
                onClick={() => setActionsModal({ isOpen: false, class: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              {/* View Action */}
              <button
                onClick={() => {
                  handleViewClass(actionsModal.class!);
                  setActionsModal({ isOpen: false, class: null });
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-green-50 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <FiEye className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">View Details</p>
                  <p className="text-sm text-gray-500">See class information</p>
                </div>
              </button>

              {/* Edit Action */}
              <button
                onClick={() => {
                  handleEditClass(actionsModal.class!);
                  setActionsModal({ isOpen: false, class: null });
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <FiEdit2 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Edit Class</p>
                  <p className="text-sm text-gray-500">Modify class details</p>
                </div>
              </button>

              {/* View Students Action */}
              <button
                onClick={() => {
                  handleViewDetails(actionsModal.class!);
                  setActionsModal({ isOpen: false, class: null });
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-green-50 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <FaUsers className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">View Students</p>
                  <p className="text-sm text-gray-500">See enrolled students</p>
                </div>
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.class && (
        <ModalWrapper
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, class: null, isLoading: false })}
          className="w-full max-w-md"
        >
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <FiTrash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Class</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong>{deleteModal.class.class_name}</strong>?
              This will remove the class and all associated student assignments.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal({ isOpen: false, class: null, isLoading: false })}
                disabled={deleteModal.isLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteClass}
                disabled={deleteModal.isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {deleteModal.isLoading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                Delete Class
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* Teacher Class Details Modal */}
      {isTeacherClassDetailsModalOpen && selectedTeacherClass && (
        <ModalWrapper
          isOpen={isTeacherClassDetailsModalOpen}
          onClose={() => {
            setIsTeacherClassDetailsModalOpen(false);
            setSelectedTeacherClass(null);
            setShowStudentsInModal(false);
            setStudentSearchTerm("");
            setStudentSearchInput("");
            setTeacherClassStudents([]);
          }}
          className="w-full max-w-2xl"
        >
          <div className="max-h-[85vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  {showStudentsInModal && (
                    <button
                      onClick={handleBackToDetails}
                      className="p-1 hover:bg-gray-100 rounded transition-colors mr-2"
                    >
                      <FiArrowLeft className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                  <div className="w-8 h-8 bg-main/10 rounded-full flex items-center justify-center">
                    {showStudentsInModal ? (
                      <FaUsers className="w-4 h-4 text-main" />
                    ) : (
                      <FaGraduationCap className="w-4 h-4 text-main" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {showStudentsInModal ? `${selectedTeacherClass.class_name} Students` : 'Class Details'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {showStudentsInModal
                        ? `${filteredStudents.length} of ${teacherClassStudents.length} students`
                        : 'Teaching assignment'
                      }
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsTeacherClassDetailsModalOpen(false);
                    setSelectedTeacherClass(null);
                    setShowStudentsInModal(false);
                    setStudentSearchTerm("");
                    setStudentSearchInput("");
                    setTeacherClassStudents([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {!showStudentsInModal ? (
                // Class Details View
                <div className="space-y-4">
                  {/* Class Information */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2 text-sm">
                      <FaGraduationCap className="w-3 h-3 text-main" />
                      Class Information
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Class Name</label>
                        <p className="text-sm text-gray-900 bg-white p-2 rounded border">{selectedTeacherClass.class_name}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Year Level</label>
                        <p className="text-sm text-gray-900 bg-white p-2 rounded border">Year {selectedTeacherClass.year_level}</p>
                      </div>
                    </div>
                  </div>

                  {/* Teaching Assignment */}
                  <div className="bg-main/5 rounded-lg p-3">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2 text-sm">
                      <FaUsers className="w-3 h-3 text-main" />
                      Teaching Assignment
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Courses Taught</label>
                        <div className="bg-white p-2 rounded border">
                          <p className="text-sm text-gray-900">{selectedTeacherClass.courses_taught || 'No courses assigned'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Total Courses</label>
                          <div className="bg-white p-2 rounded border text-center">
                            <span className="text-lg font-bold text-main">{selectedTeacherClass.courses_count}</span>
                            <p className="text-xs text-gray-500">Course{selectedTeacherClass.courses_count !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Year Level</label>
                          <div className="bg-white p-2 rounded border text-center">
                            <span className="text-lg font-bold text-main">{selectedTeacherClass.year_level}</span>
                            <p className="text-xs text-gray-500">Level</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2 text-sm">
                      <FaCalendarAlt className="w-3 h-3 text-main" />
                      Additional Information
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Class Created</label>
                        <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                          {selectedTeacherClass.created_at ? new Date(selectedTeacherClass.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Last Updated</label>
                        <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                          {selectedTeacherClass.updated_at ? new Date(selectedTeacherClass.updated_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Students View
                <div className="space-y-4">
                  {/* Search Input */}
                  <div className="relative flex">
                    <div className="relative flex-1">
                      <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={studentSearchInput}
                        onChange={(e) => setStudentSearchInput(e.target.value)}
                        onKeyPress={handleStudentSearchKeyPress}
                        className="w-full pl-8 pr-4 py-2 text-sm border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-main/20 focus:border-main border-r-0"
                      />
                    </div>
                    <button
                      onClick={handleStudentSearch}
                      className="px-3 py-2 bg-main text-white rounded-r-lg text-sm hover:bg-main/90 flex items-center gap-1 border border-main"
                    >
                      <span>Search</span>
                    </button>
                  </div>

                  {/* Students Table */}
                  <div className="border rounded-lg min-h-0 flex-1">
                    {teacherStudentsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-main mx-auto mb-2"></div>
                        <p className="text-gray-500 text-sm">Loading students...</p>
                      </div>
                    ) : filteredStudents.length > 0 ? (
                      <div className="h-64 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredStudents.map((student, index) => (
                              <tr key={student.student_id || index} className="hover:bg-gray-50 transition-colors">
                                <td className="px-3 py-2 text-xs text-gray-900">
                                  {student.first_name} {student.last_name}
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-600">{student.email}</td>
                                <td className="px-3 py-2 text-xs">
                                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${student.is_active
                                      ? 'bg-main/10 text-main'
                                      : 'bg-gray-200 text-gray-700'
                                    }`}>
                                    {student.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FaUsers className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">
                          {studentSearchTerm.trim() ? "No students found" : "No students available"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end mt-4 pt-4 border-t">
                <button
                  onClick={() => {
                    setIsTeacherClassDetailsModalOpen(false);
                    setSelectedTeacherClass(null);
                    setShowStudentsInModal(false);
                    setStudentSearchTerm("");
                    setStudentSearchInput("");
                    setTeacherClassStudents([]);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-xs hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                {!showStudentsInModal && (
                  <button
                    onClick={handleShowStudentsInTeacherModal}
                    className="px-3 py-2 bg-main text-white rounded-lg text-xs hover:bg-main/90 transition-colors flex items-center gap-1"
                  >
                    <FiEye className="w-3 h-3" />
                    View Students
                  </button>
                )}
              </div>
            </div>
          </div>
        </ModalWrapper>
      )}
    </div>
  );
}

export default ClassesView;
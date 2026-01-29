import { useState, useEffect, useRef } from "react";

import { FiEdit, FiUsers, FiUserCheck, FiUserX, FiActivity, FiFilter, FiSearch } from "react-icons/fi";
import { studentService, intakeService, classService, type Student, type Intake, type Class } from "../../../services/academicService";
import Role from "../../../utils/constants";
import AllowedRoles from "../../shared/AllowedRoles";
import SharedHeader from "../../shared/SharedHeader";
import { useToast } from "../../../utils/context/ToastContext";
import ConfirmationModal from "../../modals/shared/ConfirmationModal";
import ViewHeader from "../../shared/ViewHeader";
import ModalWrapper from "../../shared/ModalWrapper";

function StudentsView() {
  const [students, setStudents] = useState<Student[]>([]);
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'with_intake_no_class' | 'by_class' | 'by_intake'>('all');
  const [filterValue, setFilterValue] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    student: Student | null;
    action: 'activate' | 'deactivate';
  }>({
    isOpen: false,
    student: null,
    action: 'activate'
  });
  const [selectedIntake, setSelectedIntake] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addTab, setAddTab] = useState<'single' | 'csv'>('single');
  const [newStudent, setNewStudent] = useState({
    first_name: '',
    last_name: '',
    email: '',
    gender: ''
  });
  const [csvFileName, setCsvFileName] = useState('');
  const [csvRows, setCsvRows] = useState<Array<{ first_name: string; last_name: string; email: string; gender: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const { addToast } = useToast();

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    loadStudents();
  }, [currentPage, searchTerm]); // Remove automatic filter triggers

  useEffect(() => {
    // Load other data only once
    loadOtherData();
  }, []);

  const loadAllStudents = async () => {
    try {
      setLoading(true);

      // Build filter parameters for all students (no filters)
      const params: any = {
        page: 1, // Reset to first page
        limit: ITEMS_PER_PAGE,
        search: '', // No search
        sort_by: 'first_name',
        sort_order: 'ASC'
      };

      // Use proper backend pagination
      const studentsResponse = await studentService.getStudents(params);

      if (studentsResponse.success) {
        setStudents(studentsResponse.data);
        if (studentsResponse.pagination) {
          setTotalPages(studentsResponse.pagination.total_pages);
          setTotalStudents(studentsResponse.pagination.total);
        } else {
          setTotalPages(1);
          setTotalStudents(studentsResponse.data.length);
        }
      }
    } catch (error: any) {
      console.error('Load all students error:', error);
      addToast({ message: 'Failed to load students: ' + error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);

      // Build filter parameters
      const params: any = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: searchTerm,
        sort_by: 'first_name',
        sort_order: 'ASC'
      };

      // Add filter parameters based on filter type
      if (filterType === 'with_intake_no_class') {
        params.filter = 'with_intake_no_class';
      } else if (filterType === 'by_class' && filterValue) {
        params.class_id = filterValue;
      } else if (filterType === 'by_intake' && filterValue) {
        params.intake_id = filterValue;
      }

      // Use proper backend pagination
      const studentsResponse = await studentService.getStudents(params);

      // console.log('Students Response:', studentsResponse);

      if (studentsResponse.success) {
        setStudents(studentsResponse.data);
        if (studentsResponse.pagination) {
          setTotalPages(studentsResponse.pagination.total_pages);
          setTotalStudents(studentsResponse.pagination.total);
          // console.log('Pagination:', studentsResponse.pagination);
        } else {
          console.error('No pagination data received from backend!');
          // This should not happen anymore
          setTotalPages(1);
          setTotalStudents(studentsResponse.data.length);
        }
      }
    } catch (error: any) {
      console.error('Load students error:', error);
      addToast({ message: 'Failed to load students: ' + error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadOtherData = async () => {
    try {
      // Load intakes, classes, and stats separately
      const [intakesResponse, classesResponse, statsResponse] = await Promise.all([
        intakeService.getIntakes(),
        classService.getClasses(),
        studentService.getStats()
      ]);

      if (intakesResponse.success) setIntakes(intakesResponse.data);
      if (classesResponse.success) setClasses(classesResponse.data);
      if (statsResponse.success) {
        setStats(statsResponse.data);
        // console.log('Stats:', statsResponse.data);
      }
    } catch (error: any) {
      console.error('Load other data error:', error);
      addToast({ message: 'Failed to load additional data: ' + error.message, type: 'error' });
    }
  };

  const handleToggleActive = async (student: Student) => {
    // Show confirmation modal instead of directly toggling
    const currentStatus = Boolean(student.is_active);
    const action = currentStatus ? 'deactivate' : 'activate';

    setConfirmationModal({
      isOpen: true,
      student: student,
      action: action
    });
  };

  const confirmToggleActive = async () => {
    if (!confirmationModal.student) return;

    try {
      const student = confirmationModal.student;
      const currentStatus = Boolean(student.is_active);
      const newStatus = !currentStatus;

      // console.log('Toggling student status:', {
      //   studentId: student.student_id,
      //   currentStatus,
      //   newStatus,
      //   originalValue: student.is_active
      // });

      const response = await studentService.toggleActive(student.student_id, newStatus);
      if (response.success) {
        // Update local state instead of refetching all data
        setStudents(prevStudents =>
          prevStudents.map(s =>
            s.student_id === student.student_id
              ? { ...s, is_active: newStatus }
              : s
          )
        );

        // Update stats locally
        if (stats) {
          setStats((prevStats: any) => ({
            ...prevStats,
            total_students: newStatus
              ? prevStats.total_students + 1
              : Math.max(0, prevStats.total_students - 1)
          }));
        }

        addToast({ message: response.message, type: 'success' });
      }
    } catch (error: any) {
      console.error('Toggle active error:', error);
      addToast({ message: 'Failed to update student status: ' + error.message, type: 'error' });
    }
  };

  const handleBulkAssignIntake = async () => {
    if (selectedStudents.length === 0 || !selectedIntake) {
      addToast({ message: 'Please select students and an intake', type: 'error' });
      return;
    }

    try {
      const response = await studentService.bulkAssignToIntake(selectedStudents, selectedIntake);
      if (response.success) {
        // Update local state for assigned students
        const selectedIntakeData = intakes.find(i => i.intake_id === selectedIntake);
        setStudents(prevStudents =>
          prevStudents.map(s =>
            selectedStudents.includes(s.student_id)
              ? { ...s, intake_id: selectedIntake, intake_name: selectedIntakeData?.intake_name }
              : s
          )
        );

        setSelectedStudents([]);
        setSelectedIntake("");
        setShowBulkActions(false);
        addToast({ message: response.message, type: 'success' });

        // Refresh stats only
        loadOtherData();
      }
    } catch (error: any) {
      addToast({ message: 'Failed to assign students to intake: ' + error.message, type: 'error' });
    }
  };

  const handleBulkAssignClass = async () => {
    if (selectedStudents.length === 0 || !selectedClass) {
      addToast({ message: 'Please select students and a class', type: 'error' });
      return;
    }

    try {
      const response = await studentService.bulkAssignToClass(selectedStudents, selectedClass);
      if (response.success) {
        // Update local state for assigned students
        const selectedClassData = classes.find(c => c.class_id === selectedClass);
        setStudents(prevStudents =>
          prevStudents.map(s =>
            selectedStudents.includes(s.student_id)
              ? { ...s, class_id: selectedClass, class_name: selectedClassData?.class_name }
              : s
          )
        );

        setSelectedStudents([]);
        setSelectedClass("");
        setShowBulkActions(false);
        addToast({ message: response.message, type: 'success' });

        // Refresh stats only
        loadOtherData();
      }
    } catch (error: any) {
      addToast({ message: 'Failed to assign students to class: ' + error.message, type: 'error' });
    }
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    loadStudents(); // Manually trigger data loading
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterType('all');
    setFilterValue("");
    setCurrentPage(1);
    loadAllStudents(); // Load all students without any filters
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.student_id));
    }
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
    setAddTab('single');
  };

  const handleCloseAddModal = () => {
    if (isSubmitting) return;
    setIsAddModalOpen(false);
    setNewStudent({ first_name: '', last_name: '', email: '', gender: '' });
    setCsvRows([]);
    setCsvFileName('');
    if (csvInputRef.current) {
      csvInputRef.current.value = '';
    }
  };

  const handleClearCsv = () => {
    setCsvRows([]);
    setCsvFileName('');
    if (csvInputRef.current) {
      csvInputRef.current.value = '';
    }
  };

  const handleCsvFile = async (file: File) => {
    setCsvFileName(file.name);
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);

    if (lines.length < 2) {
      setCsvRows([]);
      addToast({ message: 'CSV must include a header and at least one row.', type: 'error' });
      return;
    }
    const header = lines[0].split(',').map((item) => item.trim().toLowerCase());
    const required = ['first_name', 'last_name', 'email', 'gender'];
    const hasRequired = required.every((field) => header.includes(field));
    if (!hasRequired) {
      setCsvRows([]);
      addToast({ message: 'CSV header must include first_name, last_name, email, gender.', type: 'error' });
      return;
    }
    const rows = lines.slice(1).map((line) => line.split(',').map((item) => item.trim()));
    const parsed = rows
      .map((row) => ({
        first_name: row[header.indexOf('first_name')] || '',
        last_name: row[header.indexOf('last_name')] || '',
        email: row[header.indexOf('email')] || '',
        gender: row[header.indexOf('gender')] || ''
      }))
      .filter((row) => row.first_name && row.last_name && row.email);
    setCsvRows(parsed);
  };

  const handleSubmitSingle = async () => {
    if (!newStudent.first_name || !newStudent.last_name || !newStudent.email || !newStudent.gender) {
      addToast({ message: 'Please fill all fields.', type: 'error' });
      return;
    }
    try {
      setIsSubmitting(true);
      const response = await studentService.createStudent(newStudent);
      if (response.success) {
        addToast({ message: response.message || 'Student created.', type: 'success' });
        handleCloseAddModal();
        loadStudents();
        loadOtherData();
      }
    } catch (error: any) {
      addToast({ message: `Failed to create student: ${error.message}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitCsv = async () => {
    if (csvRows.length === 0) {
      addToast({ message: 'Please upload a valid CSV file first.', type: 'error' });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await studentService.bulkCreate(csvRows);
      if (response.success) {
        addToast({ message: response.message || 'Students uploaded.', type: 'success' });
        handleCloseAddModal();
        loadStudents();
        loadOtherData();
      }
    } catch (error: any) {
      addToast({ message: `Failed to upload students: ${error.message}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="font-poppins min-w-0 px-4 sm:px-6 lg:px-10 py-6 text-sm text-gray-500">
        Loading students...
      </div>
    );
  }

  return (
    <div className="font-poppins min-w-0">
      <SharedHeader placeholder="Search students..." />

      <AllowedRoles roles={Role.ADMIN}>
        <div className="px-4 sm:px-6 lg:px-10 mb-4">
          {/* ... (rest of the code remains the same) */}
          <div className="flex items-center justify-between">
            <ViewHeader title="Students" />
            <div>
              <button
                className="bg-main text-white px-4 py-2 rounded-md"
                onClick={handleOpenAddModal}
              >
                + Add Student
              </button>
            </div>
          </div>

          {/* Stats Cards - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 my-6">
            {[
              { title: "Total Students", date: "Active", numbers: stats?.total_students || 0, comment: "All registered students", icon: <FiUsers /> },
              { title: "Without Intake", date: "Needs Assignment", numbers: stats?.without_intake || 0, comment: "Unassigned students", icon: <FiUserX /> },
              { title: "Without Class", date: "Needs Assignment", numbers: stats?.without_current_class || 0, comment: "Without current class", icon: <FiUserCheck /> },
              { title: "Currently Sick", date: "Health Alert", numbers: stats?.sick_count || 0, comment: "Students with illness", icon: <FiActivity /> }
            ].map((card, idx) => (
              <div
                key={idx}
                className="bg-white/80 backdrop-blur-sm rounded-xl border hover:scale-105 cursor-pointer border-gray-200/50 p-4 sm:p-6 transition-all duration-300 hover:bg-white/90"
                style={{
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), -4px 0 8px rgba(0, 0, 0, 0.15), 4px 0 8px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.15)'
                }}
              >
                <div className="mb-4">
                  <span className="text-sm font-semibold text-gray-800">{card.title}</span>
                  <span className="text-gray-400 mx-2">|</span>
                  <span className="text-xs text-blue-500 font-medium">{card.date}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-main flex items-center justify-center shadow-md flex-shrink-0">
                    <div className="text-white text-xl">{card.icon}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-2xl font-bold text-gray-800 mb-1">{card.numbers}</div>
                    <div className="text-xs text-gray-500 truncate">{card.comment}</div>
                  </div>
                </div>
              </div>
            ))}
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
                      placeholder="Search students..."
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
                    className="px-3 py-2 bg-main text-white rounded-r-lg text-sm hover:bg-main/90"
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
                  <button className="bg-main text-white text-[.8rem] p-2 rounded-md hidden">
                    Export
                  </button>
                </div>
              </div>

              {/* Collapsible Filters */}
              {showFilters && (
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center p-3 bg-main/5 border border-main/20 rounded-lg">
                  <select
                    value={filterType}
                    onChange={(e) => {
                      setFilterType(e.target.value as any);
                      setFilterValue("");
                      // Remove setCurrentPage(1) to prevent auto-refresh
                    }}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="all">All Students</option>
                    <option value="with_intake_no_class">With Intake, No Class</option>
                    <option value="by_class">Filter by Class</option>
                    <option value="by_intake">Filter by Intake</option>
                  </select>

                  {/* Secondary Filter for old filter type */}
                  {(filterType === 'by_class' || filterType === 'by_intake') && (
                    <select
                      value={filterValue}
                      onChange={(e) => {
                        setFilterValue(e.target.value);
                        // Remove setCurrentPage(1) to prevent auto-refresh
                      }}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="">
                        {filterType === 'by_class' ? 'Select class...' : 'Select intake...'}
                      </option>
                      {filterType === 'by_class'
                        ? classes.map((cls) => (
                          <option key={cls.class_id} value={cls.class_id}>
                            {cls.class_name} (Year {cls.year_level})
                          </option>
                        ))
                        : intakes.map((intake) => (
                          <option key={intake.intake_id} value={intake.intake_id}>
                            {intake.intake_name}
                          </option>
                        ))
                      }
                    </select>
                  )}

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

          {/* Main Content Area - Responsive */}
          <div className="w-full">
            {/* Students Table */}
            <div
              className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-300 transition-all duration-300 overflow-hidden"
            // style={{
            //   boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), -4px 0 8px rgba(0, 0, 0, 0.15), 4px 0 8px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.15)'
            // }}
            >
              {/* Table Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="font-semibold text-[0.98rem] text-main">Students List ({totalStudents})</h2>
                {selectedStudents.length > 0 && (
                  <button
                    onClick={() => setShowBulkActions(!showBulkActions)}
                    className="px-3 py-2 bg-main text-white rounded-lg text-sm hover:bg-main/90 transition-colors"
                  >
                    Actions ({selectedStudents.length})
                  </button>
                )}
              </div>

              {/* Bulk Actions Panel */}
              {showBulkActions && selectedStudents.length > 0 && (
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Bulk Actions ({selectedStudents.length} students)</h3>
                  <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-1 lg:grid-cols-2 md:gap-3">
                    {/* Intake Assignment */}
                    <div className="space-y-2 md:space-y-0 md:flex md:items-center md:gap-2">
                      <label className="block text-xs font-medium text-gray-700 md:hidden">Assign to Intake:</label>
                      <select
                        value={selectedIntake}
                        onChange={(e) => setSelectedIntake(e.target.value)}
                        className="w-full md:flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-main"
                      >
                        <option value="">Select intake...</option>
                        {intakes.map((intake) => (
                          <option key={intake.intake_id} value={intake.intake_id}>
                            {intake.intake_name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleBulkAssignIntake}
                        disabled={!selectedIntake}
                        className="w-full md:w-auto px-4 py-2 bg-main text-white rounded-md text-sm hover:bg-main/80 disabled:opacity-50 transition-colors whitespace-nowrap"
                      >
                        Assign to Intake
                      </button>
                    </div>

                    {/* Class Assignment */}
                    <div className="space-y-2 md:space-y-0 md:flex md:items-center md:gap-2">
                      <label className="block text-xs font-medium text-gray-700 md:hidden">Assign to Class:</label>
                      <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full md:flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-main"
                      >
                        <option value="">Select class...</option>
                        {classes.map((cls) => (
                          <option key={cls.class_id} value={cls.class_id}>
                            {cls.class_name} (Year {cls.year_level})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleBulkAssignClass}
                        disabled={!selectedClass}
                        className="w-full md:w-auto px-4 py-2 bg-main text-white rounded-md text-sm hover:bg-main/80 disabled:opacity-50 transition-colors whitespace-nowrap"
                      >
                        Assign to Class
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left w-8">
                        <input
                          type="checkbox"
                          checked={selectedStudents.length === students.length && students.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-main focus:ring-main"
                        />
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Student</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Intake</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Class</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.student_id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.student_id)}
                            onChange={() => handleSelectStudent(student.student_id)}
                            className="rounded border-gray-300 text-main focus:ring-main"
                          />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-gray-900 truncate">
                              {student.first_name} {student.last_name}
                            </div>
                            {student.is_sick && (
                              <div className="text-xs text-red-600 flex items-center gap-1 mt-1">
                                <FiActivity className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{student.current_illness}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900 truncate">{student.email}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900 truncate">
                            {student.intake_name || <span className="text-gray-400 italic">Not assigned</span>}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900 truncate">
                            {student.class_name || <span className="text-gray-400 italic">Not assigned</span>}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${student.is_active ? 'bg-main text-white' : 'bg-white text-main border border-main'
                            }`}>
                            {student.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                          <div className="flex items-center gap-1">
                            <button className="p-1 hover:bg-gray-100 rounded" title="Edit">
                              <FiEdit className="w-3 h-3 text-gray-500" />
                            </button>
                            <button
                              onClick={() => handleToggleActive(student)}
                              className="p-1 hover:bg-gray-100 rounded"
                              title={student.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {student.is_active ?
                                <FiUserX className="w-3 h-3 text-red-500" /> :
                                <FiUserCheck className="w-3 h-3 text-main" />
                              }
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tablet Table View - Simplified */}
              <div className="hidden md:block lg:hidden overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left w-8">
                        <input
                          type="checkbox"
                          checked={selectedStudents.length === students.length && students.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-main focus:ring-main"
                        />
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Student</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Assignment</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.student_id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.student_id)}
                            onChange={() => handleSelectStudent(student.student_id)}
                            className="rounded border-gray-300 text-main focus:ring-main"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {student.first_name} {student.last_name}
                            </div>
                            <div className="text-xs text-gray-500 truncate">{student.email}</div>
                            {student.is_sick && (
                              <div className="text-xs text-red-600 flex items-center gap-1 mt-1">
                                <FiActivity className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{student.current_illness}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-xs text-gray-900">
                            <div className="truncate">
                              <span className="font-medium">Intake:</span> {student.intake_name || <span className="text-gray-400 italic">Not assigned</span>}
                            </div>
                            <div className="truncate mt-1">
                              <span className="font-medium">Class:</span> {student.class_name || <span className="text-gray-400 italic">Not assigned</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${student.is_active ? 'bg-main text-white' : 'bg-white text-main border border-main'
                            }`}>
                            {student.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs font-medium">
                          <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-gray-100 rounded" title="Edit">
                              <FiEdit className="w-4 h-4 text-gray-500" />
                            </button>
                            <button
                              onClick={() => handleToggleActive(student)}
                              className="p-2 hover:bg-gray-100 rounded"
                              title={student.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {student.is_active ?
                                <FiUserX className="w-4 h-4 text-red-500" /> :
                                <FiUserCheck className="w-4 h-4 text-main" />
                              }
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden">
                {/* Select All for Mobile */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedStudents.length === students.length && students.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-main focus:ring-main"
                    />
                    <span className="font-medium text-gray-700">
                      Select All ({students.length} students)
                    </span>
                  </label>
                </div>

                {/* Student Cards */}
                <div className="divide-y divide-gray-200">
                  {students.map((student) => (
                    <div key={student.student_id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.student_id)}
                          onChange={() => handleSelectStudent(student.student_id)}
                          className="rounded border-gray-300 text-main focus:ring-main mt-1 flex-shrink-0"
                        />

                        {/* Student Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {student.first_name} {student.last_name}
                              </h3>
                              <p className="text-xs text-gray-500 truncate mt-1">{student.email}</p>
                            </div>

                            {/* Status Badge */}
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${student.is_active ? 'bg-main text-white' : 'bg-white text-main border border-main'
                              }`}>
                              {student.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                          {/* Health Status */}
                          {student.is_sick && (
                            <div className="text-xs text-red-600 flex items-center gap-1 mt-2 p-2 bg-red-50 rounded">
                              <FiActivity className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{student.current_illness}</span>
                            </div>
                          )}

                          {/* Assignment Info */}
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="font-medium text-gray-700">Intake:</span>
                              <div className="text-gray-900 truncate">
                                {student.intake_name || <span className="text-gray-400 italic">Not assigned</span>}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Class:</span>
                              <div className="text-gray-900 truncate">
                                {student.class_name || <span className="text-gray-400 italic">Not assigned</span>}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                            <button className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                              <FiEdit className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleActive(student)}
                              className={`flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-colors ${student.is_active
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-main hover:bg-main/5'
                                }`}
                            >
                              {student.is_active ? (
                                <>
                                  <FiUserX className="w-3 h-3" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <FiUserCheck className="w-3 h-3" />
                                  Activate
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Responsive Pagination */}
              <div className="flex flex-col gap-3 p-4 border-t border-gray-200 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="text-xs text-gray-500 text-center sm:text-left order-2 sm:order-1">
                  Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, ((currentPage - 1) * ITEMS_PER_PAGE) + students.length)} of {totalStudents} results
                  {searchTerm && ` (filtered)`}
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-center gap-1 order-1 sm:order-2">
                  {/* Mobile Pagination - Simplified */}
                  <div className="flex items-center gap-1 sm:hidden">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    <div className="px-3 py-2 text-sm text-gray-700 min-w-0">
                      <span className="font-medium">{currentPage}</span>
                      <span className="text-gray-400 mx-1">of</span>
                      <span className="font-medium">{totalPages}</span>
                    </div>

                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage >= totalPages}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>

                  {/* Desktop Pagination - Full */}
                  <div className="hidden sm:flex items-center gap-1 flex-wrap">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    {/* First page */}
                    {currentPage > 3 && (
                      <>
                        <button
                          onClick={() => setCurrentPage(1)}
                          className="px-2 py-1 rounded text-xs border border-gray-300 hover:bg-gray-50"
                        >
                          1
                        </button>
                        {currentPage > 4 && (
                          <span className="px-2 py-1 text-xs text-gray-500">...</span>
                        )}
                      </>
                    )}

                    {/* Pages around current page */}
                    {Array.from({ length: 5 }, (_, i) => {
                      const pageNum = currentPage - 2 + i;
                      if (pageNum < 1 || pageNum > totalPages) return null;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-2 py-1 rounded text-xs ${pageNum === currentPage
                            ? 'bg-main text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    {/* Last page */}
                    {currentPage < totalPages - 2 && (
                      <>
                        {currentPage < totalPages - 3 && (
                          <span className="px-2 py-1 text-xs text-gray-500">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className="px-2 py-1 rounded text-xs border border-gray-300 hover:bg-gray-50"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage >= totalPages}
                      className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AllowedRoles>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal({ isOpen: false, student: null, action: 'activate' })}
        onConfirm={confirmToggleActive}
        title={`${confirmationModal.action === 'activate' ? 'Activate' : 'Deactivate'} Student`}
        message={
          confirmationModal.student
            ? `Are you sure you want to ${confirmationModal.action} ${confirmationModal.student.first_name} ${confirmationModal.student.last_name}? ${confirmationModal.action === 'deactivate'
              ? 'This will prevent the student from accessing the system and appearing in active student lists.'
              : 'This will allow the student to access the system and appear in active student lists.'
            }`
            : ''
        }
        confirmText={confirmationModal.action === 'activate' ? 'Activate Student' : 'Deactivate Student'}
        cancelText="Cancel"
        type={confirmationModal.action === 'deactivate' ? 'danger' : 'info'}
      />

      <ModalWrapper isOpen={isAddModalOpen} onClose={handleCloseAddModal}>
        <div className="w-[95vw] max-w-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Add Students</h3>
            <button
              onClick={handleCloseAddModal}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="px-6 pt-4">
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
              <button
                className={`px-4 py-2 text-sm rounded-md ${addTab === 'single' ? 'bg-white text-main shadow-sm' : 'text-gray-600'}`}
                onClick={() => setAddTab('single')}
              >
                Single Student
              </button>
              <button
                className={`px-4 py-2 text-sm rounded-md ${addTab === 'csv' ? 'bg-white text-main shadow-sm' : 'text-gray-600'}`}
                onClick={() => setAddTab('csv')}
              >
                Upload CSV
              </button>
            </div>
          </div>

          <div className="px-6 py-4">
            {addTab === 'single' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600">First Name</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={newStudent.first_name}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, first_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Last Name</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={newStudent.last_name}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, last_name: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-gray-600">Email</label>
                  <input
                    type="email"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Gender</label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={newStudent.gender}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, gender: e.target.value }))}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-600">
                  <p className="font-medium text-gray-800">CSV Template</p>
                  <p className="mt-1">Headers: first_name, last_name, email, gender</p>
                  <p className="mt-1 text-xs text-gray-500">Example: John,Doe,john@example.com,Male</p>
                </div>
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleCsvFile(file);
                    }
                  }}
                  className="hidden"
                />
                <div
                  onClick={() => csvInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      handleCsvFile(file);
                    }
                  }}
                  className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-sm transition-colors ${isDragging ? 'border-main bg-main/5' : 'border-gray-300'}`}
                >
                  <span className="font-medium text-gray-800">Drop CSV here or click to upload</span>
                  <span className="text-xs text-gray-500">Only .csv files with the required headers.</span>
                  {csvFileName && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="truncate max-w-[220px]">{csvFileName}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearCsv();
                        }}
                        className="text-red-500 hover:text-red-600"
                      >
                        Cancel upload
                      </button>
                    </div>
                  )}
                </div>

                <div className="max-h-40 overflow-auto rounded-lg border border-gray-200">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">First</th>
                        <th className="px-3 py-2 text-left">Last</th>
                        <th className="px-3 py-2 text-left">Email</th>
                        <th className="px-3 py-2 text-left">Gender</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvRows.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-4 text-center text-gray-400">
                            Upload a CSV to preview rows.
                          </td>
                        </tr>
                      ) : (
                        csvRows.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-3 py-2">{row.first_name}</td>
                            <td className="px-3 py-2">{row.last_name}</td>
                            <td className="px-3 py-2">{row.email}</td>
                            <td className="px-3 py-2">{row.gender}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {csvRows.length > 5 && (
                  <div className="text-xs text-gray-500">Showing first 5 of {csvRows.length} rows.</div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200">
            <button
              onClick={handleCloseAddModal}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={addTab === 'single' ? handleSubmitSingle : handleSubmitCsv}
              className="px-4 py-2 text-sm bg-main text-white rounded-md disabled:opacity-50"
              disabled={isSubmitting}
            >
              {addTab === 'single' ? 'Create Student' : 'Upload Students'}
            </button>
          </div>
        </div>
      </ModalWrapper>

    </div>
  );
}

export default StudentsView;
import { useState, useEffect } from "react";
import { FiPlus, FiSearch, FiFilter, FiEye, FiTrash2 } from "react-icons/fi";

import { FaGraduationCap, FaUsers, FaCalendarAlt, FaChartLine } from "react-icons/fa";
import { intakeService, type Intake as ApiIntake } from "../../../services/academicService";
import Role from "../../../utils/constants";
import { AdminIntakeCard } from "../../cards/Intake.cards";
import AllowedRoles from "../../shared/AllowedRoles";
import SharedHeader from "../../shared/SharedHeader";
import ModalWrapper from "../../shared/ModalWrapper";
import AddIntakeModal from "../../modals/academic/AddIntake.modal";
import UpdateIntakeModal from "../../modals/academic/UpdateIntake.modal";
import ViewIntakeDetailsModal from "../../modals/academic/ViewIntake.modal";
import StudentListModal from "../../modals/reports/StudentList.modal";
import DeleteConfirmationModal from "../../modals/shared/DeleteConfirmationModal";
import { useToast } from "../../../utils/context/ToastContext";
import ViewHeader from "../../shared/ViewHeader";

export interface MockIntake {
  id: number;
  name: string;
  academicYear: string;
  graduationYear: string;
  studentCount: number;
  courseCount: number;
  status: 'active' | 'completed' | 'upcoming' | 'inactive';
}

function IntakeView() {
  const [allIntakes, setAllIntakes] = useState<ApiIntake[]>([]); // Raw data from API
  const [filteredIntakes, setFilteredIntakes] = useState<ApiIntake[]>([]); // Filtered data for display
  const [intakeStatistics, setIntakeStatistics] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("start_year");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [selectedIntake, setSelectedIntake] = useState<ApiIntake | null>(null);
  const [selectedIntakeStudents, setSelectedIntakeStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [actionsModal, setActionsModal] = useState<{
    isOpen: boolean;
    intake: ApiIntake | null;
  }>({
    isOpen: false,
    intake: null
  });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    intake: ApiIntake | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    intake: null,
    isLoading: false
  });

  const { addToast } = useToast();

  // Convert API Intake to Mock Intake format for the card component
  const convertIntakeForCard = (apiIntake: ApiIntake): MockIntake => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const currentAcademicStartYear = currentMonth >= 8 ? currentYear : currentYear - 1;

    // Determine if intake has finished (students have graduated)
    // Academic year ends in July, so students graduate in July/August
    let intakeFinished = false;
    if (currentMonth >= 8) {
      // After July, so current academic year has ended
      intakeFinished = (currentYear >= apiIntake.end_year);
    } else {
      // Before August, so current academic year is still ongoing
      intakeFinished = (currentYear > apiIntake.end_year);
    }

    const status: 'active' | 'completed' | 'upcoming' | 'inactive' =
      apiIntake.start_year > currentAcademicStartYear ? 'upcoming' :
        intakeFinished ? 'completed' :
          apiIntake.is_active ? 'active' : 'inactive';

    return {
      id: parseInt(apiIntake.intake_id.replace(/-/g, '').substring(0, 8), 16),
      name: apiIntake.intake_name,
      academicYear: `${apiIntake.start_year}-${apiIntake.start_year + 1}`,
      graduationYear: apiIntake.end_year.toString(),
      studentCount: 0,
      courseCount: intakeStatistics[apiIntake.intake_id] || 0,
      status
    };
  };

  useEffect(() => {
    loadIntakes();
    loadIntakeStatistics();
  }, []); // Only load once on mount

  const loadIntakeStatistics = async () => {
    try {
      const response = await intakeService.getStatistics();

      if (response.success && response.data) {
        // Convert array to object with intake_id as key and course_count as value
        const statsMap: { [key: string]: number } = {};
        response.data.forEach((stat: any) => {
          statsMap[stat.intake_id] = stat.course_count;
        });
        setIntakeStatistics(statsMap);
      }
    } catch (error: any) {
      console.error('Load intake statistics error:', error);
      addToast({ message: 'Failed to load intake statistics: ' + error.message, type: 'error' });
    }
  };

  const loadIntakes = async () => {
    try {
      setLoading(true);
      const response = await intakeService.getIntakes({
        sort_by: sortBy,
        sort_order: sortOrder
      });

      if (response.success) {
        setAllIntakes(response.data);
        setFilteredIntakes(response.data); // Initially show all data
      }
    } catch (error: any) {
      console.error('Load intakes error:', error);
      addToast({ message: 'Failed to load intakes: ' + error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleShowActions = (intake: ApiIntake) => {
    setActionsModal({
      isOpen: true,
      intake: intake
    });
  };

  const handleViewIntake = (apiIntake: ApiIntake) => {
    setSelectedIntake(apiIntake);
    setIsViewModalOpen(true);
  };

  const handleViewStudents = async (apiIntake: ApiIntake) => {
    try {
      setStudentsLoading(true);
      setSelectedIntake(apiIntake);

      const response = await intakeService.getStudents(apiIntake.intake_id);
      if (response.success) {
        setSelectedIntakeStudents(response.data.students || []);
      } else {
        setSelectedIntakeStudents([]);
        addToast({ message: 'Failed to load students', type: 'error' });
      }

      setIsStudentModalOpen(true);
    } catch (error: any) {
      console.error('Error loading students:', error);
      setSelectedIntakeStudents([]);
      addToast({ message: 'Failed to load students: ' + error.message, type: 'error' });
      setIsStudentModalOpen(true);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleUpdateIntake = (intake: ApiIntake) => {
    setSelectedIntake(intake);
    setIsUpdateModalOpen(true);
  };

  const handleDeleteIntake = (intake: ApiIntake) => {
    setDeleteModal({
      isOpen: true,
      intake: intake,
      isLoading: false
    });
  };

  const confirmDeleteIntake = async () => {
    if (!deleteModal.intake) return;

    try {
      setDeleteModal(prev => ({ ...prev, isLoading: true }));

      const response = await intakeService.deleteIntake(deleteModal.intake.intake_id);

      if (response.success) {
        addToast({ message: response.message, type: 'success' });
        setDeleteModal({ isOpen: false, intake: null, isLoading: false });
        loadIntakes(); // Reload the list
      }
    } catch (error: any) {
      console.error('Delete intake error:', error);
      addToast({ message: 'Failed to delete intake: ' + error.message, type: 'error' });
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handlePromoteIntake = async (intake: ApiIntake) => {
    try {
      const response = await intakeService.promoteIntake(intake.intake_id);
      if (response.success) {
        addToast({ message: response.message, type: 'success' });
        loadIntakes();
      }
    } catch (error: any) {
      addToast({ message: 'Failed to promote intake: ' + error.message, type: 'error' });
    }
  };

  const handleToggleActive = async (intake: ApiIntake) => {
    try {
      const response = intake.is_active
        ? await intakeService.deactivateIntake(intake.intake_id)
        : await intakeService.activateIntake(intake.intake_id);

      if (response.success) {
        addToast({ message: response.message, type: 'success' });
        loadIntakes();
      }
    } catch (error: any) {
      addToast({ message: `Failed to ${intake.is_active ? 'deactivate' : 'activate'} intake: ` + error.message, type: 'error' });
    }
  };

  const handleSortChange = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(newSortBy);
      setSortOrder("DESC");
    }
    // Apply filters immediately when sort changes
    setTimeout(() => handleApplyFilters(), 0);
  };

  const handleApplyFilters = () => {
    let filtered = [...allIntakes];

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter((intake: ApiIntake) =>
        intake.intake_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intake.start_year.toString().includes(searchTerm) ||
        intake.end_year.toString().includes(searchTerm)
      );
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter((intake: ApiIntake) => {
        if (statusFilter === 'active') return intake.is_active;
        if (statusFilter === 'inactive') return !intake.is_active;
        return true;
      });
    }

    // Apply year filter
    if (yearFilter) {
      filtered = filtered.filter((intake: ApiIntake) =>
        intake.start_year.toString() === yearFilter
      );
    }

    // Apply level filter
    if (levelFilter) {
      filtered = filtered.filter((intake: ApiIntake) =>
        intake.current_year_level.toString() === levelFilter
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof ApiIntake];
      let bValue: any = b[sortBy as keyof ApiIntake];

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

    setFilteredIntakes(filtered);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setYearFilter("");
    setLevelFilter("");
    setSortBy("start_year");
    setSortOrder("DESC");
    setFilteredIntakes(allIntakes); // Reset to show all data
  };

  // Calculate stats based on FILTERED data
  const totalIntakes = filteredIntakes.length;
  const activeIntakes = filteredIntakes.filter(i => i.is_active).length;
  const inactiveIntakes = filteredIntakes.filter(i => !i.is_active).length;
  const currentYearIntakes = filteredIntakes.filter(i => i.start_year === new Date().getFullYear()).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-main"></div>
      </div>
    );
  }

  return (
    <div className="font-poppins min-w-0">
      <SharedHeader placeholder="Search intakes..." />

      <AllowedRoles roles={Role.ADMIN}>
        <div className="px-4 sm:px-6 lg:px-10 mb-5">
          <ViewHeader title="Intake" />
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 mt-4">
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-main hover:bg-main/80 px-4 py-3 text-[.73rem] text-white rounded-lg flex gap-3 whitespace-nowrap"
              >
                <FiPlus className="w-3 h-3" />
                <span className="hidden md:block">Add Intake</span>
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
                <span className="text-sm font-semibold text-gray-800">Total Intakes</span>
                <span className="text-gray-400 mx-2">|</span>
                <span className="text-xs text-blue-500 font-medium">All Time</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-main flex items-center justify-center shadow-md">
                  <FaGraduationCap className="text-white text-xl" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-gray-800 mb-1">{totalIntakes}</div>
                  <div className="text-xs text-gray-500">Academic intakes</div>
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
                <span className="text-sm font-semibold text-gray-800">Active Intakes</span>
                <span className="text-gray-400 mx-2">|</span>
                <span className="text-xs text-blue-500 font-medium">Currently Running</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-main flex items-center justify-center shadow-md">
                  <FaUsers className="text-white text-xl" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-gray-800 mb-1">{activeIntakes}</div>
                  <div className="text-xs text-gray-500">Active programs</div>
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
                <span className="text-sm font-semibold text-gray-800">Current Year</span>
                <span className="text-gray-400 mx-2">|</span>
                <span className="text-xs text-blue-500 font-medium">{new Date().getFullYear()}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-main flex items-center justify-center shadow-md">
                  <FaCalendarAlt className="text-white text-xl" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-gray-800 mb-1">{currentYearIntakes}</div>
                  <div className="text-xs text-gray-500">This year's intakes</div>
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
                <span className="text-sm font-semibold text-gray-800">Completion Rate</span>
                <span className="text-gray-400 mx-2">|</span>
                <span className="text-xs text-blue-500 font-medium">Overall</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-main flex items-center justify-center shadow-md">
                  <FaChartLine className="text-white text-xl" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-gray-800 mb-1">{totalIntakes > 0 ? Math.round((inactiveIntakes / totalIntakes) * 100) : 0}%</div>
                  <div className="text-xs text-gray-500">Completed programs</div>
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
                      placeholder="Search intakes..."
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

                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-main/20 focus:border-main"
                  >
                    <option value="start_year">Sort by Year</option>
                    <option value="intake_name">Sort by Name</option>
                    <option value="current_year_level">Sort by Level</option>
                    <option value="created_at">Sort by Created</option>
                  </select>
                </div>
              </div>

              {/* Collapsible Filters */}
              {showFilters && (
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center p-3 bg-main/5 border border-main/20 rounded-lg">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>

                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="">All Years</option>
                    {Array.from(new Set(allIntakes.map(i => i.start_year))).sort().map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>

                  <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="">All Levels</option>
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                  </select>

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

          {/* Intakes Grid */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-300 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-[0.98rem] text-main">Intakes ({totalIntakes})</h2>
            </div>

            {filteredIntakes.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-main/10 flex items-center justify-center mx-auto mb-4">
                  <FaGraduationCap className="text-main text-2xl" />
                </div>
                <h3 className="text-md font-semibold text-gray-800 mb-2">No intakes found</h3>
                <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">
                  {searchTerm || statusFilter || yearFilter || levelFilter ? 'No intakes match your search criteria.' : 'Get started by creating your first intake to organize students by academic year.'}
                </p>
                {!(searchTerm || statusFilter || yearFilter || levelFilter) && (
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-main hover:bg-main/80 px-6 py-3 text-sm text-white rounded-lg transition-colors"
                  >
                    Add new Intake
                  </button>
                )}
              </div>
            ) : (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredIntakes.map((intake) => (
                  <div key={intake.intake_id} className="relative group">
                    <div className="transform hover:scale-105 transition-transform duration-200 ease-in-out">
                      <AdminIntakeCard
                        intake={convertIntakeForCard(intake)}
                        setModalOpen={() => { }} // Not used anymore
                        setIntakeDetails={() => { }} // Not used anymore
                      />
                    </div>

                    {/* Single Actions Button */}
                    <div className="absolute top-2 right-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity">

                      <button
                        onClick={() => handleShowActions(intake)}
                        className="px-3 py-1.5 bg-white/90 hover:bg-white rounded-full shadow-md transition-colors text-xs font-medium text-gray-700"
                        title="Actions"
                      >
                        Actions
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AllowedRoles>

      {/* Modals */}
      <AddIntakeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          loadIntakes();
        }}
      />

      <UpdateIntakeModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        intake={selectedIntake}
        onSuccess={() => {
          setIsUpdateModalOpen(false);
          loadIntakes();
        }}
      />

      <ViewIntakeDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        intakeDetails={selectedIntake}
      />

      <StudentListModal
        open={isStudentModalOpen}
        onClose={() => {
          setIsStudentModalOpen(false);
          setSelectedIntake(null);
          setSelectedIntakeStudents([]);
        }}
        className={selectedIntake?.intake_name || ''}
        students={studentsLoading ? [] : selectedIntakeStudents}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, intake: null, isLoading: false })}
        onConfirm={confirmDeleteIntake}
        title="Delete Intake"
        message="Are you sure you want to delete this intake? This will remove all associated students and data."
        itemName={deleteModal.intake?.intake_name || ''}
        itemType="Intake"
        isLoading={deleteModal.isLoading}
        warningText="All students assigned to this intake will be unassigned and their class assignments will be removed."
      />

      {/* Actions Modal */}
      {actionsModal.isOpen && actionsModal.intake && (
        <ModalWrapper
          isOpen={actionsModal.isOpen}
          onClose={() => setActionsModal({ isOpen: false, intake: null })}
          className="w-full max-w-md"
        >
          <div className="p-6 bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Actions for {actionsModal.intake.intake_name}
              </h3>
              <button
                onClick={() => setActionsModal({ isOpen: false, intake: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              {/* View Details Action */}
              <button
                onClick={() => {
                  handleViewIntake(actionsModal.intake!);
                  setActionsModal({ isOpen: false, intake: null });
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                  <FiEye className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">View Intake</p>
                  <p className="text-sm text-gray-500">See intake details</p>
                </div>
              </button>

              {/* View Students Action */}
              <button
                onClick={() => {
                  handleViewStudents(actionsModal.intake!);
                  setActionsModal({ isOpen: false, intake: null });
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaUsers className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">View Students</p>
                  <p className="text-sm text-gray-500">List students in intake</p>
                </div>
              </button>

              {/* Update Action */}
              <button
                onClick={() => {
                  handleUpdateIntake(actionsModal.intake!);
                  setActionsModal({ isOpen: false, intake: null });
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6-6 3.536 3.536-6 6H9v-3.536z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Update Intake</p>
                  <p className="text-sm text-gray-500">Edit name or year level</p>
                </div>
              </button>

              {/* Promote Action */}
              {actionsModal.intake.current_year_level < 3 && actionsModal.intake.is_active && (
                <button
                  onClick={() => {
                    handlePromoteIntake(actionsModal.intake!);
                    setActionsModal({ isOpen: false, intake: null });
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Promote Intake</p>
                    <p className="text-sm text-gray-500">Move to next year level</p>
                  </div>
                </button>
              )}

              {/* Activate/Deactivate Action */}
              <button
                onClick={() => {
                  handleToggleActive(actionsModal.intake!);
                  setActionsModal({ isOpen: false, intake: null });
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${actionsModal.intake.is_active
                    ? 'hover:bg-red-50'
                    : 'hover:bg-green-50'
                  }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${actionsModal.intake.is_active
                    ? 'bg-red-100'
                    : 'bg-green-100'
                  }`}>
                  {actionsModal.intake.is_active ? (
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14L5 9m0 0l5-5m-5 5h14" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {actionsModal.intake.is_active ? 'Deactivate' : 'Activate'} Intake
                  </p>
                  <p className="text-sm text-gray-500">
                    {actionsModal.intake.is_active
                      ? 'Make this intake inactive'
                      : 'Make this intake active'
                    }
                  </p>
                </div>
              </button>

              {/* Delete Action */}
              <button
                onClick={() => {
                  handleDeleteIntake(actionsModal.intake!);
                  setActionsModal({ isOpen: false, intake: null });
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <FiTrash2 className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Delete Intake</p>
                  <p className="text-sm text-gray-500">Remove this intake</p>
                </div>
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}
    </div>
  );
}

export default IntakeView;
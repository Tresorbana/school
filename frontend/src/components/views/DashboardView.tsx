import AllowedRoles from "../shared/AllowedRoles";
import Role from "../../utils/constants";
import { AbsentSampleCards, HomeTeacherCards } from "../cards/Dashboard.cards";
import { HiUsers, HiClipboardCheck } from "react-icons/hi";
import { useAuth } from "../../utils/context/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { userService, type DashboardCard } from "../../services/userService";
import { useToast } from "../../utils/context/ToastContext";

import SharedHeader from "../shared/SharedHeader";
import ViewHeader from "../shared/ViewHeader";
import AttendanceRecordModal from "../modals/attendance/AttendanceRecord.modal";

import DashboardAdminWidget from "../widgets/dashboard/Admin.widget";
import DashboardTeacherWidget from "../widgets/dashboard/Teacher.widget";

export const homeTeacherPreviewIcons = [<HiUsers key="people1" />, <HiClipboardCheck key="present1" />, <HiUsers key="users" />, <HiClipboardCheck key="present2" />];

interface DashboardViewProps {
  // setActive?: (active: string) => void; // Unused
}

export interface IAabsentStudent {
  name: string;
  classroom: string;
  reason: string;
}

function DashboardView({ }: DashboardViewProps) {
  const { user } = useAuth();
  const userRole = user?.role;
  const userId = user?.id;
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{ title: string; students: IAabsentStudent[] }>({ title: '', students: [] });
  const [selectedClass, setSelectedClass] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<{ period: string; className: string }>({ period: '', className: '' });
  const [currentPage] = useState(1);
  const classOptions = Array.from(
    new Set(
      modalData.students
        .map((student) => student.classroom)
        .filter((classroom): classroom is string => Boolean(classroom))
    )
  );

  // Dashboard cards state
  const [teacherCards, setTeacherCards] = useState<DashboardCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  useEffect(() => {
    if (userRole === Role.TEACHER && userId) {
      loadTeacherCards();
    }
  }, [userRole, userId]);

  const loadTeacherCards = async () => {
    if (!user?.id) return;

    try {
      setCardsLoading(true);
      const response = await userService.getTeacherDashboardCards(user.id);

      if (response.success && response.data) {
        setTeacherCards(response.data);
      } else {
        addToast({
          message: response.message || 'Failed to load teacher dashboard cards',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Failed to load teacher cards:', error);
      addToast({
        message: 'Failed to load teacher dashboard cards',
        type: 'error'
      });
    } finally {
      setCardsLoading(false);
    }
  };


  const openModal = (title: string, students: IAabsentStudent[]) => {
    setModalData({ title, students });
    setSelectedClass('');
    setSearchQuery('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedClass('');
    setSearchQuery('');
  };

  const closeAttendanceModal = () => {
    setAttendanceModalOpen(false);
    setSelectedPeriod({ period: '', className: '' });
  };

  // Filter students based on selected class and search query
  const filteredStudents = modalData.students.filter(student => {
    const normalize = (value?: string) => (value ?? '').trim().toLowerCase();
    const matchesClass = selectedClass
      ? normalize(student.classroom) === normalize(selectedClass)
      : true;
    const matchesSearch = searchQuery
      ? normalize(student.name).includes(normalize(searchQuery))
      : true;
    return matchesClass && matchesSearch;
  });

  return (
    <div className="font-poppins">
      <SharedHeader placeholder="search users and roles" />

      {/* Body */}
      <div className="m-10 my-4">
        {/* Standardized Header for all roles */}
        <ViewHeader title="Dashboard" />

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
          <AllowedRoles roles={Role.TEACHER}>
            {cardsLoading ? (
              // Loading skeleton for teacher cards
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                      <div className="h-6 bg-gray-200 rounded w-12"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))
            ) : (
              teacherCards.map((card, idx) => (
                <HomeTeacherCards
                  key={idx}
                  title={card.title}
                  date={card.date}
                  comment={card.comment}
                  number={typeof card.number === 'string' ? parseInt(card.number) || 0 : card.number}
                  icon={homeTeacherPreviewIcons[idx]}
                />
              ))
            )}
          </AllowedRoles>

        </div>
      </div>

      {/* Role-specific widgets */}
      <AllowedRoles roles={Role.ADMIN}>
        <DashboardAdminWidget openModal={openModal} />
      </AllowedRoles>

      <AllowedRoles roles={Role.TEACHER}>
        <DashboardTeacherWidget />
      </AllowedRoles>


      {/* Modal for showing all students */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={closeModal}>
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-main">{modalData.title}</h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Search and Filter */}
            <div className="px-4 pt-4 space-y-3">
              {/* Search input */}
              <div>
                <label className="text-sm text-gray-600">Search student:</label>
                <input
                  type="text"
                  placeholder="Enter student name..."
                  className="ml-2 border border-gray-300 rounded-md px-3 py-1 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filter by class */}
              <div>
                <label className="text-sm text-gray-600">Filter by class:</label>
                <select
                  className="ml-2 border border-gray-300 rounded-md px-3 py-1 text-sm"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  <option value="">All classes</option>
                  {classOptions.map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-4 max-h-[500px] overflow-y-auto">
              <div className="grid grid-cols-1 gap-3">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student, idx) => (
                    <AbsentSampleCards key={idx} {...student} />
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    No students found matching your search criteria
                  </p>
                )}
              </div>

              {/* Pagination info */}
              {filteredStudents.length > 0 && (
                <div className="mt-4 text-center text-xs text-gray-500">
                  Showing {Math.min(currentPage * 10, filteredStudents.length)} of {filteredStudents.length} students
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Attendance Record Modal */}
      <AttendanceRecordModal
        isOpen={attendanceModalOpen}
        onClose={closeAttendanceModal}
        period={selectedPeriod.period}
        className={selectedPeriod.className}
      />
    </div>
  );
}

export default DashboardView;
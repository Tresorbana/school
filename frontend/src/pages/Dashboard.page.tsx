import { useState, useEffect, lazy, Suspense } from "react";
import Navbar from "../components/shared/Navbar";
import { BsMenuApp } from "react-icons/bs";
import { useAuth } from "../utils/context/AuthContext";
import { STORAGE_KEYS, MENU_ITEMS } from "../utils/constants";

// Lazy load view components for code splitting
const DashboardView = lazy(() => import("../components/views/DashboardView"));
const UserRoleView = lazy(() => import("../components/views/UserRoleView"));
const TimetableView = lazy(() => import("../components/views/TimetableView"));
const ReportView = lazy(() => import("../components/views/ReportView"));
const AnalyticsView = lazy(() => import("../components/views/AnalyticsView"));
const SettingsView = lazy(() => import("../components/views/SettingsView"));
const AttendanceView = lazy(() => import("../components/views/AttendanceView"));
const ClassesView = lazy(() => import("../components/views/management/ClassesView"));
const IntakeView = lazy(() => import("../components/views/management/IntakeView"));
const CoursesView = lazy(() => import("../components/views/management/CoursesView"));
const StudentsView = lazy(() => import("../components/views/management/StudentsView"));
const FeesView = lazy(() => import("../components/views/FeesView"));
const DeliberationView = lazy(() => import("../components/views/DeliberationView"));
const AccountingView = lazy(() => import("../components/views/AccountingView"));
const MarksEntryView = lazy(() => import("./MarksEntry.page"));
const ReportCardsView = lazy(() => import("./ReportCards.page"));
const NoApprovalView = lazy(() => import("../components/views/NoApprovalView"));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-main"></div>
  </div>
);

function Dashboard() {
  const { user } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);

  const [active, setActive] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);

    // If maintainer role and no saved tab, default to User & roles
    if (!saved && user?.role === 'maintainer') {
      return MENU_ITEMS.USER_ROLES;
    }

    return saved || MENU_ITEMS.DASHBOARD;
  });

  useEffect(() => {
    // Save active tab to localStorage
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, active);
  }, [active]);

  const getView = () => {
    switch (active) {
      case MENU_ITEMS.DASHBOARD:
        return <DashboardView />;
      case MENU_ITEMS.USER_ROLES:
        return <UserRoleView />;
      case MENU_ITEMS.TIMETABLE:
        return <TimetableView />;
      case MENU_ITEMS.REPORT:
        return <ReportView />;
      case MENU_ITEMS.ANALYTICS:
        return <AnalyticsView />;
      case MENU_ITEMS.FEES:
        return <FeesView />;
      case MENU_ITEMS.DELIBERATION:
        return <DeliberationView />;
      case MENU_ITEMS.ACCOUNTING:
        return <AccountingView />;
      case MENU_ITEMS.ATTENDANCE:
        return <AttendanceView />;
      case MENU_ITEMS.MARKS_ENTRY:
        return <MarksEntryView />;
      case MENU_ITEMS.CLASSES:
        return <ClassesView />;
      case MENU_ITEMS.INTAKE:
      case 'Intake':
        return <IntakeView />;
      case MENU_ITEMS.COURSES:
      case 'Courses':
        return <CoursesView />;
      case 'Classes': // Management subtab Classes (for the admin)
        return <ClassesView />;
      case 'Students': // Management subtab Students (for the admin)
        return <StudentsView />;
      case MENU_ITEMS.REPORT_CARDS:
        return <ReportCardsView />;
      case MENU_ITEMS.SETTINGS:
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex relative">
      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <button
          className="bg-main text-white p-3 rounded-lg shadow-lg hover:bg-main/90 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <BsMenuApp className="text-2xl" />
        </button>
      </div>

      {/* Desktop Navbar */}
      <div className="hidden md:block fixed top-0 left-0 h-screen z-40">
        <Navbar active={active} setActive={setActive} />
      </div>

      {/* Main content */}
      <div className="flex-1 ml-0 md:ml-56 relative z-10 overflow-hidden">
        <Suspense fallback={<LoadingSpinner />}>
          {user?.role !== 'inactive' || active === MENU_ITEMS.SETTINGS ? getView() : (user ? <NoApprovalView /> : null)}
        </Suspense>
      </div>

      {/* Mobile overlay sidebar */}
      <div className={`fixed inset-0 z-50 transition ${menuOpen ? "visible" : "invisible"} md:hidden`}>
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${menuOpen ? "opacity-100" : "opacity-0"
            }`}
          onClick={() => setMenuOpen(false)}
        />
        <div
          className={`absolute top-0 left-0 h-full w-56 bg-main text-white shadow-2xl transform transition-transform duration-300 ${menuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <Navbar active={active} setActive={setActive} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

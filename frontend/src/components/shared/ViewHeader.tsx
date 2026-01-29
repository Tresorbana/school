import { useAuth } from "../../utils/context/AuthContext";
import Role from "../../utils/constants";
import type { JSX } from "react";

interface ViewHeaderProps {
  title: string;
  description?: string; // Standard description prop
  customDescription?: string; // Legacy support
  rightElement?: React.ReactNode; // Optional right-side element (buttons, etc)
}

const ViewHeader: React.FC<ViewHeaderProps> = ({ title, description: propDescription, customDescription, rightElement }) => {
  const { user } = useAuth();

  // Role-specific descriptions for each view
  const getDescription = (viewTitle: string, userRole: string) => {
    if (propDescription) return propDescription;
    if (customDescription) return customDescription;

    const descriptions: Record<string, Record<string, string>> = {
      "Dashboard": {
        [Role.ADMIN]: "Monitor school attendance overview and system performance",
        [Role.TEACHER]: "View your classes and record student attendance",
        [Role.DISCIPLINE]: "Track attendance patterns and manage disciplinary actions",
        [Role.NURSE]: "Monitor student health and attendance-related medical issues"
      },
      "Attendance": {
        [Role.DISCIPLINE]: "Review and manage student attendance records",
        [Role.NURSE]: "Track health-related absences and medical records"
      },
      "Health": {
        [Role.NURSE]: "Monitor student health status and manage medical records"
      },
      "Classes": {
        [Role.ADMIN]: "Manage class schedules and student assignments",
        [Role.TEACHER]: "View your assigned classes and student lists"
      },
      "Report": {
        [Role.ADMIN]: "Generate attendance reports and analytics",
        [Role.TEACHER]: "View attendance reports for your classes",
        [Role.DISCIPLINE]: "Access disciplinary and attendance trend reports",
        [Role.NURSE]: "Generate health and medical incident reports"
      },
      "User & roles": {
        [Role.ADMIN]: "Manage user accounts and system access permissions",
        [Role.MAINTAINER]: "View user accounts and manage basic user information"
      },
      "Students": {
        [Role.ADMIN]: "Manage student records and enrollment information"
      },
      "Intake": {
        [Role.ADMIN]: "Handle new student admissions and enrollment"
      },
      "Courses": {
        [Role.ADMIN]: "Manage academic courses and teacher assignments"
      },
      "Timetable": {
        [Role.ADMIN]: "Create and manage class schedules and timetables",
        [Role.TEACHER]: "View your teaching schedule and class assignments"
      },
      "Analytics": {
        [Role.ADMIN]: "Analyze attendance data and school performance metrics"
      },
      "Settings": {
        [Role.ADMIN]: "Manage your profile information and account settings",
        [Role.TEACHER]: "Manage your profile information and account settings",
        [Role.DISCIPLINE]: "Manage your profile information and account settings",
        [Role.NURSE]: "Manage your profile information and account settings",
        [Role.MAINTAINER]: "Manage your profile information and account settings"
      },
      "Fees": {
        [Role.ADMIN]: "Manage school fees, payments, and defaulters",
        [Role.DISCIPLINE]: "View fee payment status for students"
      },
      "Deliberation": {
        [Role.ADMIN]: "Configure promotion rules and generate reports",
        [Role.DISCIPLINE]: "View deliberation results and reports"
      },
      "Accounting": {
        [Role.ADMIN]: "Monitor financial transactions and reports"
      }
    };

    return descriptions[viewTitle]?.[userRole] || "Manage school attendance and related activities";
  };

  const userName = user ? `${user.first_name} ${user.last_name}` : "User";
  const userRole = user?.role || "";
  const description = getDescription(title, userRole);

  return (
    <div className="">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600 text-sm mb-1">
            Welcome back, <span className="font-medium text-main">{userName}</span>
          </p>
          <p className="text-gray-500 text-sm leading-relaxed max-w-2xl">
            {description}
          </p>
        </div>
        {rightElement && (
          <div className="ml-4">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewHeader;
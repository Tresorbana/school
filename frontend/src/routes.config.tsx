import { BsFillPeopleFill } from "react-icons/bs";
import { FiUsers, FiCalendar, FiFileText, FiBarChart2, FiSettings } from "react-icons/fi";
import { MdDashboard, MdFlightClass, MdManageAccounts } from "react-icons/md";
import { HiAcademicCap, HiBookOpen } from "react-icons/hi";
import type { JSX } from "react";
import Role from "./utils/constants";

export interface RouteConfig {
  menu: string;
  allowedRoles: string[];
  icon: JSX.Element;
  hasDropdown?: boolean;
  subtabs?: SubtabConfig[];
}

export interface SubtabConfig {
  menu: string;
  icon: JSX.Element;
}

const routesConfig: RouteConfig[] = [
  { menu: "Dashboard", allowedRoles: [Role.ADMIN, Role.TEACHER], icon: <MdDashboard /> },
  { menu: "Attendance", allowedRoles: [Role.ADMIN], icon: <BsFillPeopleFill /> },
  { menu: "Classes", allowedRoles: [Role.TEACHER], icon: <MdFlightClass /> },
  { menu: "Report", allowedRoles: [Role.ADMIN, Role.TEACHER], icon: <FiFileText /> },
  { menu: "User & roles", allowedRoles: [Role.ADMIN, Role.MAINTAINER], icon: <FiUsers /> },
  {
    menu: "Management", allowedRoles: [Role.ADMIN], icon: <MdManageAccounts />,
    hasDropdown: true,
    subtabs: [
      { menu: "Students", icon: <FiUsers /> },
      { menu: "Intake", icon: <HiAcademicCap /> },
      { menu: "Classes", icon: <MdFlightClass /> },
      { menu: "Courses", icon: <HiBookOpen /> },
    ]
  },
  { menu: "Timetable", allowedRoles: [Role.ADMIN, Role.TEACHER], icon: <FiCalendar /> },
  { menu: "Marks Entry", allowedRoles: [Role.TEACHER], icon: <FiFileText /> },
  { menu: "Report Cards", allowedRoles: [Role.TEACHER], icon: <FiFileText /> },
  { menu: "Fees", allowedRoles: [Role.ADMIN], icon: <div className="text-lg font-bold">$</div> },
  { menu: "Deliberation", allowedRoles: [Role.ADMIN], icon: <HiAcademicCap /> },
  { menu: "Accounting", allowedRoles: [Role.ADMIN], icon: <FiBarChart2 /> },
  { menu: "Analytics", allowedRoles: [Role.ADMIN], icon: <FiBarChart2 /> },
  { menu: "Settings", allowedRoles: [Role.ALL], icon: <FiSettings /> },
];

export default routesConfig;
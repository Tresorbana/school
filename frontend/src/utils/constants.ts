// Local Storage Keys
export const STORAGE_KEYS = {
  ACTIVE_TAB: 'activeTab',
  MANAGEMENT_SUBTAB: 'managementSubtab',
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
} as const;

// Navigation Menu Items
export const MENU_ITEMS = {
  DASHBOARD: 'Dashboard',
  ATTENDANCE: 'Attendance',
  CLASSES: 'Classes',
  REPORT: 'Report',
  USER_ROLES: 'User & roles',
  MANAGEMENT: 'Management',
  INTAKE: 'Intake',
  COURSES: 'Courses',
  MANAGEMENT_CLASSES: 'Classes',
  ACTIVE: 'Active',
  FEES: 'Fees',
  DELIBERATION: 'Deliberation',
  ACCOUNTING: 'Accounting',
  TIMETABLE: 'Timetable',
  MARKS_ENTRY: 'Marks Entry',
  REPORT_CARDS: 'Report Cards',
  ANALYTICS: 'Analytics',
  SETTINGS: 'Settings',
} as const;

// Management Subtabs
export const MANAGEMENT_SUBTABS = {
  STUDENTS: 'Students',
  INTAKE: 'Intake',
  CLASSES: 'Classes',
  COURSES: 'Courses',
} as const;

const Role = {
  ALL: 'all',
  ADMIN: 'admin',
  TEACHER: 'teacher',
  PARENT: 'parent',
  STUDENT: 'student',
  MAINTAINER: 'maintainer'
} as const;

export type MenuItem = typeof MENU_ITEMS[keyof typeof MENU_ITEMS];
export default Role;

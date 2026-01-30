/**
 * Authentication utilities for API requests
 */

/**
 * Get authentication headers for API requests
 * @returns Object containing Authorization header with JWT token
 */
export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No authentication token found');
  }

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Check if user is authenticated
 * @returns boolean indicating if user has valid token
 */
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token');
  return !!token;
};

/**
 * Get current user from JWT token
 * @returns Parsed JWT payload or null
 */
export const getCurrentUser = (): any => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const base64Url = token.split('.')[1];
    // Replace URL-safe characters back to standard Base64
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT token:', error);
    return null;
  }
};

/**
 * Get current user ID from JWT token
 * @returns User ID or null
 */
export const getCurrentUserId = (): string | null => {
  const user = getCurrentUser();
  return user?.user_id || null;
};

/**
 * Get current user roles from JWT token
 * @returns Array of role codes or null
 */
export const getCurrentUserRoles = (): number[] | null => {
  const user = getCurrentUser();
  return user?.roles || null;
};

/**
 * Check if current user has a specific role
 * @param roleCode - The role code to check (6794=admin, 2938=teacher, etc.)
 * @returns boolean indicating if user has the role
 */
export const hasRole = (roleCode: number): boolean => {
  const roles = getCurrentUserRoles();
  return roles ? roles.includes(roleCode) : false;
};

/**
 * Check if current user is admin
 * @returns boolean indicating if user is admin
 */
export const isAdmin = (): boolean => {
  return hasRole(2001); // ADMIN role code
};

/**
 * Check if current user is teacher
 * @returns boolean indicating if user is teacher
 */
export const isTeacher = (): boolean => {
  return hasRole(4002); // TEACHER role code
}

/**
 * Check if current user is student
 * @returns boolean indicating if user is student
 */
export const isStudent = (): boolean => {
  return hasRole(8201); // STUDENT role code
}

/**
 * Get the string representation of the current user's role
 * @returns string role or empty string
 */
export const getUserRole = (): string => {
  if (isAdmin()) return 'admin';
  if (isTeacher()) return 'teacher';
  if (isStudent()) return 'student';
  return '';
};

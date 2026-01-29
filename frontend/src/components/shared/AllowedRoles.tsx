import React from 'react';
import { useAuth } from '../../utils/context/AuthContext';
import Role from '../../utils/constants';

interface AllowedRolesProps {
  roles: string[] | string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const AllowedRoles: React.FC<AllowedRolesProps> = ({ 
  roles, 
  children, 
  fallback = null 
}) => {
  const { user } = useAuth();
  const userRole = user?.role;

  // Convert roles to array if it's a string
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  // Check if user role is in allowed roles or if 'all' is included
  const hasAccess = userRole && (
    allowedRoles.includes(Role.ALL) || 
    allowedRoles.includes(userRole)
  );

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

export default AllowedRoles;
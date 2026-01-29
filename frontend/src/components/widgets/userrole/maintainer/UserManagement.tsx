import { useState, useEffect } from "react";
import { FiLoader } from "react-icons/fi";
import RoleAssignmentModal from "../../../modals/users/RoleAssignment.modal";
import UserDetailsModal from "../../../modals/users/UserDetails.modal";
import { useAuth } from "../../../../utils/context/AuthContext";
import { useToast } from "../../../../utils/context/ToastContext";
import { userService } from "../../../../services/userService";

interface User {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  roles: string[];
  role_name: string;
  role_id: string;
}

function MaintainerUserManagement() {

  const { user } = useAuth();
  const { addToast } = useToast();
  const [userList, setUserList] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [approvalFilter, setApprovalFilter] = useState("All users");

  // Modal states
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [userToView, setUserToView] = useState<User | null>(null);
  const [roleAssignmentModalOpen, setRoleAssignmentModalOpen] = useState(false);
  const [userForRoleAssignment, setUserForRoleAssignment] = useState<User | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Admin role options for maintainer (only admin role)
  const adminRoleOptions = [{ id: '7', name: 'admin', role_id: '7', role_name: 'admin' }]; // Using correct Role interface

  const itemsPerPage = 10;

  // Filter states for apply/reset functionality
  const [tempRoleFilter, setTempRoleFilter] = useState<string>("All roles");
  const [tempApprovalFilter, setTempApprovalFilter] = useState<string>("All users");

  // Initialize temp filters when component mounts
  useEffect(() => {
    setTempRoleFilter(roleFilter);
    setTempApprovalFilter(approvalFilter);
  }, [roleFilter, approvalFilter]);

  const applyFilters = () => {
    setRoleFilter(tempRoleFilter);
    setApprovalFilter(tempApprovalFilter);
    setCurrentPage(1); // Reset to first page when applying filters
  };

  const resetFilters = () => {
    setRoleFilter("All roles");
    setApprovalFilter("All users");
    setTempRoleFilter("All roles");
    setTempApprovalFilter("All users");
    setCurrentPage(1); // Reset to first page when resetting filters
  };

  const filtered = userList.filter((u) => {
    if (u.user_id === user?.id) return false;
    const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
    const matchesQuery =
      !query ||
      fullName.includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase());

    // Improved role filtering - handle case insensitivity and exact matching
    const matchesRole = roleFilter === "All roles" ||
      u.role_name?.toLowerCase() === roleFilter.toLowerCase();

    const matchesApproval =
      approvalFilter === "All users" ||
      (approvalFilter === "Approved only" && u.role_name !== 'inactive') ||
      (approvalFilter === "Disapproved only" && u.role_name === 'inactive');

    return matchesQuery && matchesRole && matchesApproval;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handleViewUser = (_e: React.MouseEvent<HTMLButtonElement>, user: User) => {
    setUserToView(user);
    setUserDetailsOpen(true);
  };

  const handleRoleAssignment = async (_e: React.MouseEvent<HTMLButtonElement>, u: User) => {
    _e.preventDefault();
    setUserForRoleAssignment(u);
    setRoleAssignmentModalOpen(true);
  };

  const handleRoleAssignmentConfirm = async (_roleId: string, action: 'assign' | 'remove') => {
    if (!userForRoleAssignment) return;

    setApprovingId(userForRoleAssignment.user_id);

    try {
      const requestData = {
        user_id: userForRoleAssignment.user_id,
        action,
        role_name: 'admin' // Maintainer can only assign admin role
      };

      await userService.manageUserRole(requestData);

      // Update the user list
      setUserList((prev) =>
        prev.map((user) => {
          if (user.user_id === userForRoleAssignment.user_id) {
            if (action === 'assign') {
              return {
                ...user,
                role_name: 'admin',
                role_id: '7'
              };
            } else {
              return {
                ...user,
                role_name: 'inactive',
                role_id: ''
              };
            }
          }
          return user;
        })
      );

      setRoleAssignmentModalOpen(false);
      setUserForRoleAssignment(null);

      addToast({
        title: action === 'assign' ? 'Role assigned' : 'Role removed',
        message: action === 'assign'
          ? 'Admin role assigned successfully.'
          : 'Admin role removed successfully.',
        type: 'success',
      });

    } catch (error) {
      console.error("Error managing user role:", error);
      addToast({
        title: 'Error',
        message: 'Failed to update user role. Please try again.',
        type: 'error',
      });
    } finally {
      setApprovingId(null);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const response = await userService.getAllUsersForMaintainer();
      // Map API response to local User interface with role_id
      const usersWithRoleId: User[] = response.data.map((apiUser: any) => ({
        ...apiUser,
        role_id: apiUser.role_id || ''
      }));
      setUserList(usersWithRoleId);
    } catch (e) {
      console.error("Error fetching users:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers() }, []);

  return (
    <div>
      <UserDetailsModal
        open={userDetailsOpen}
        onClose={() => {
          setUserDetailsOpen(false);
          setUserToView(null);
        }}
        user={userToView}
      />

      <RoleAssignmentModal
        open={roleAssignmentModalOpen}
        onClose={() => {
          setRoleAssignmentModalOpen(false);
          setUserForRoleAssignment(null);
        }}
        userName={userForRoleAssignment ? `${userForRoleAssignment.first_name} ${userForRoleAssignment.last_name}` : ""}
        currentRole={userForRoleAssignment?.role_name || ""}
        roles={adminRoleOptions}
        onConfirm={handleRoleAssignmentConfirm}
        isActivating={userForRoleAssignment?.role_name === 'inactive'}
      />

      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <input
            type="search"
            placeholder="Search users"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors min-w-[100px] relative ${showFilters
              ? 'bg-main text-white hover:bg-main/85'
              : 'bg-white text-main border border-gray-300 hover:bg-main/5'
            }`}
        >
          Filters
          {/* Show indicator when filters are applied */}
          {(roleFilter !== "All roles" || approvalFilter !== "All users") && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </button>
      </div>

      {/* Collapsible Filters */}
      {showFilters && (
        <div className="flex gap-3 items-center p-3 bg-main/5 border border-main/20 rounded-md mb-4">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            User Status:
          </label>
          <select
            value={tempApprovalFilter}
            onChange={(e) => setTempApprovalFilter(e.target.value)}
            className="px-2 py-1 text-[0.8rem] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent bg-white min-w-[150px]"
          >
            {["All users", "Approved only", "Disapproved only"].map((option) => (
              <option
                key={option}
                value={option}
                className="hover:bg-main-hover"
              >
                {option}
              </option>
            ))}
          </select>

          {/* Apply and Reset buttons on the far right */}
          <div className="ml-auto flex gap-2">
            <button
              onClick={resetFilters}
              className="px-3 py-1 text-xs border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={applyFilters}
              className="px-3 py-1 text-xs bg-main text-white rounded-md hover:bg-main/90 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main mx-auto mb-4"></div>
            <p className="text-sm text-gray-500">Loading users...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-lg border border-gray-200 flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">No users found</h3>
            <p className="text-xs text-gray-500">
              {userList.length === 0
                ? "There are no users in the system yet."
                : "No users match your current filters."}
            </p>
          </div>
        </div>
      ) : (
        /* Data Table */
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full text-xs">
            <thead className="bg-main text-white">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium text-xs">Name</th>
                <th className="px-2 py-1.5 text-left font-medium text-xs">Email</th>
                <th className="px-2 py-1.5 text-left font-medium text-xs">Role</th>
                <th className="px-2 py-1.5 text-left font-medium text-xs">Status</th>
                <th className="px-2 py-1.5 text-left font-medium text-xs">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedUsers.map((u) => (
                <tr key={u.user_id} className="hover:bg-gray-50">
                  <td className="px-2 py-1.5 text-gray-900 font-medium text-xs">{u.first_name} {u.last_name}</td>
                  <td className="px-2 py-1.5 text-gray-600 text-xs">{u.email}</td>
                  <td className="px-2 py-1.5 text-gray-600 text-xs">{u.role_name[0].toUpperCase() + u.role_name.slice(1)}</td>
                  <td className="px-2 py-1.5">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${u.role_name !== 'inactive'
                        ? 'bg-main text-white'
                        : 'bg-gray-100 text-gray-800'
                      }`}>
                      {u.role_name !== 'inactive' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-1">
                      <button
                        className="p-1 hover:bg-gray-100 rounded"
                        title="View Details"
                        onClick={(e) => handleViewUser(e, u)}
                      >
                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        className="p-1 hover:bg-gray-100 rounded"
                        disabled={approvingId === u.user_id}
                        onClick={(e) => handleRoleAssignment(e, u)}
                        title={u.role_name !== 'inactive' ? "Remove Admin Role" : "Assign Admin Role"}
                      >
                        {approvingId === u.user_id ? (
                          <div className="flex h-4 w-7 items-center justify-center">
                            <FiLoader className="w-4 h-4 text-main animate-spin " />
                          </div>
                        ) : (
                          <div className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${u.role_name === 'admin' ? "bg-main" : "bg-gray-200"
                            }`}>
                            <span className={`inline-block h-2 w-2 transform rounded-full bg-white transition-transform duration-300 ${u.role_name === 'admin' ? "translate-x-3" : "translate-x-0.5"
                              }`} />
                          </div>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination - Only show when there's data */}
      {!loading && filtered.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filtered.length)} of {filtered.length} users
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 text-xs border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-2 py-1 text-xs text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 text-xs border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MaintainerUserManagement;

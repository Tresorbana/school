import { useState, useEffect } from "react";
import { FiEdit, FiLoader } from "react-icons/fi";
import UpdateUserModal from "../../../modals/users/EditUser.modal";
import RoleAssignmentModal from "../../../modals/users/RoleAssignment.modal";
import UserDetailsModal from "../../../modals/users/UserDetails.modal";
import { useAuth } from "../../../../utils/context/AuthContext";
import { userService } from "../../../../services/userService";
import { useToast } from "../../../../utils/context/ToastContext";
import { exportToCSV, generateFilename } from "../../../../utils/fileExportManager";

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

function AdminUserManagement() {
  const { user } = useAuth();
  const [userList, setUserList] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [approvalFilter, setApprovalFilter] = useState("All users");

  const { addToast } = useToast();

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [roleAssignmentModalOpen, setRoleAssignmentModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToView, setUserToView] = useState<User | null>(null);
  const [userForRoleAssignment, setUserForRoleAssignment] = useState<User | null>(null);
  const [isActivatingUser, setIsActivatingUser] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rolesOptions, setRolesOptions] = useState<any[]>([]);

  const itemsPerPage = 10;

  // Filter states for apply/reset functionality
  const [tempRoleFilter, setTempRoleFilter] = useState<string>("All roles");
  const [tempApprovalFilter, setTempApprovalFilter] = useState<string>("All users");

  // Fetch roles from API on component mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await userService.getRoles();
        if (response.status === 'success') {
          setRolesOptions(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch roles:", error);
        addToast({
          title: "Error",
          message: "Failed to load roles from server",
          type: "error",
        });
      }
    };

    fetchRoles();
  }, []);

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

  const handleExportUsers = () => {
    if (filtered.length === 0) {
      addToast({ message: "No users to export", type: "warning" });
      return;
    }

    try {
      const exportData = filtered.map((u) => ({
        "First Name": u.first_name,
        "Last Name": u.last_name,
        Email: u.email,
        Role: u.role_name,
        "Created At": new Date(u.created_at).toLocaleDateString()
      }));
      const filename = generateFilename("users", new Date());
      exportToCSV(exportData, filename);
      addToast({ message: `Exported ${filtered.length} user(s) successfully`, type: "success" });
    } catch (error) {
      addToast({ message: "Failed to export users", type: "error" });
    }
  };

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handleApproveUser = async (_e: React.MouseEvent<HTMLButtonElement>, u: User) => {
    _e.preventDefault();

    // Set up role assignment modal
    setUserForRoleAssignment(u);
    setIsActivatingUser(u.role_name === 'inactive'); // true if activating, false if deactivating
    setRoleAssignmentModalOpen(true);
  };

  const handleRoleAssignmentConfirm = async (roleId: string, action: 'assign' | 'remove') => {
    if (!userForRoleAssignment) return;

    setApprovingId(userForRoleAssignment.user_id);

    try {
      let requestData: { user_id: string; action: 'assign' | 'remove'; role_name: string };

      if (action === 'assign') {
        // Find the role name from the role ID
        const selectedRole = (rolesOptions as any[]).find((r: any) => (r.role_id || r.id) === roleId);
        const roleName = selectedRole?.role_name || selectedRole?.name;

        if (!roleName) {
          throw new Error('Selected role not found');
        }

        requestData = {
          user_id: userForRoleAssignment.user_id,
          action,
          role_name: roleName
        };
      } else {
        // For removal, pass the current role name
        requestData = {
          user_id: userForRoleAssignment.user_id,
          action,
          role_name: userForRoleAssignment.role_name // Pass current role to remove
        };
      }

      // console.log('Sending role management request:', requestData);
      await userService.manageUserRole(requestData);

      // Update the user list
      setUserList((prev) =>
        prev.map((user) => {
          if (user.user_id === userForRoleAssignment.user_id) {
            if (action === 'assign') {
              const assignedRole = (rolesOptions as any[]).find((r: any) => (r.role_id || r.id) === roleId);
              return {
                ...user,
                role_name: assignedRole?.role_name || assignedRole?.name || 'teacher',
                role_id: roleId
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

      addToast({
        title: action === 'assign' ? "User Activated" : "User Deactivated",
        message: `${userForRoleAssignment.first_name} ${userForRoleAssignment.last_name} has been ${action === 'assign' ? 'activated' : 'deactivated'} successfully.`,
        type: "success",
      });

    } catch (error) {
      console.error("Error managing user role:", error);
      addToast({
        title: "Error",
        message: error instanceof Error ? error.message : "Something went wrong while managing the user role.",
        type: "error",
      });
    } finally {
      setApprovingId(null);
      setUserForRoleAssignment(null);
    }
  };

  const handleEditUser = async (_e: React.MouseEvent<HTMLButtonElement>, user: User) => {
    setUserToEdit(user);
    setEditModalOpen(true);
  };

  const handleViewUser = (_e: React.MouseEvent<HTMLButtonElement>, user: User) => {
    setUserToView(user);
    setUserDetailsOpen(true);
  };

  const handleEditSubmit = async (data: {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    role_id: string;
    password: string;
    confirmPassword: string;
  }) => {
    // Update the user list immediately for better UX
    setUserList((prev) =>
      prev.map((u) =>
        u.user_id === data.id
          ? {
            ...u,
            first_name: data.firstname,
            last_name: data.lastname,
            email: data.email,
            role_id: data.role_id,
            role_name: (rolesOptions as any[]).find((r: any) => (r.role_id || r.id) === data.role_id)?.role_name || (rolesOptions as any[]).find((r: any) => (r.role_id || r.id) === data.role_id)?.name || u.role_name,
          }
          : u
      )
    );

    addToast({
      title: "User Updated",
      message: `User ${data.firstname} ${data.lastname} has been updated successfully.`,
      type: "success",
    });

    setEditModalOpen(false);
    setUserToEdit(null);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const response = await userService.getAllUsers();
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

  // Fetch roles for admin (discipline, teacher, nurse only)
  const fetchRoles = async () => {
    try {
      const response = await userService.getRoles();
      if (response.status === 'success') {
        // Filter roles to only show discipline, teacher, nurse for admin
        const adminAllowedRoles = response.data.filter((role: any) => {
          const roleName = role.name || role.role_name;
          return roleName && ['discipline', 'teacher', 'nurse'].includes(roleName.toLowerCase());
        });
        setRolesOptions(adminAllowedRoles);
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error);
      addToast({
        title: "Error",
        message: "Failed to load roles from server",
        type: "error",
      });
    }
  };

  useEffect(() => { 
    fetchUsers(); 
    fetchRoles();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900"></h2>
        <div className="flex gap-2">
          <button
            onClick={handleExportUsers}
            className="flex items-center gap-1.5 border border-main px-3 py-1.5 text-sm rounded-md hover:bg-main/80 bg-main text-white"
          >
            Export
          </button>
        </div>
      </div>

      <RoleAssignmentModal
        open={roleAssignmentModalOpen}
        onClose={() => {
          setRoleAssignmentModalOpen(false);
          setUserForRoleAssignment(null);
        }}
        userName={userForRoleAssignment ? `${userForRoleAssignment.first_name} ${userForRoleAssignment.last_name}` : ""}
        currentRole={userForRoleAssignment?.role_name || ""}
        roles={rolesOptions as any[]}
        onConfirm={handleRoleAssignmentConfirm}
        isActivating={isActivatingUser}
      />

      <UpdateUserModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setUserToEdit(null);
        }}
        roles={rolesOptions}
        user={userToEdit}
        onSubmit={handleEditSubmit}
      />

      <UserDetailsModal
        open={userDetailsOpen}
        onClose={() => {
          setUserDetailsOpen(false);
          setUserToView(null);
        }}
        user={userToView}
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

          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            User Role:
          </label>
          <select
            value={tempRoleFilter}
            onChange={(e) => setTempRoleFilter(e.target.value)}
            className="px-2 py-1 text-[0.8rem] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent bg-white min-w-[150px]"
          >
            <option value="All roles">All roles</option>
            {(rolesOptions as any[]).map((r: any) => (
              <option key={r.role_id || r.id} value={r.role_name || r.name}>
                {(r.role_name || r.name).charAt(0).toUpperCase() + (r.role_name || r.name).slice(1)}
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
                <th className="px-2 py-1.5 text-left">
                  <input type="checkbox" className="rounded w-3 h-3" />
                </th>
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
                  <td className="px-2 py-1.5">
                    <input type="checkbox" className="rounded w-3 h-3" />
                  </td>
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
                        onClick={(e) => handleEditUser(e, u)}
                        title="Edit"
                      >
                        <FiEdit className="w-3 h-3 text-gray-500" />
                      </button>
                      <button
                        className="p-1 hover:bg-gray-100 rounded"
                        disabled={approvingId === u.user_id}
                        onClick={(e) => handleApproveUser(e, u)}
                        title={u.role_name !== 'inactive' ? "Deactivate" : "Activate"}
                      >
                        {approvingId === u.user_id ? (
                          <div className="flex h-4 w-7 items-center justify-center">
                            <FiLoader className="w-4 h-4 text-main animate-spin " />
                          </div>
                        ) : (
                          <div className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${['discipline', 'teacher', 'nurse'].includes(u.role_name) ? "bg-main" : "bg-gray-200"
                            }`}>
                            <span className={`inline-block h-2 w-2 transform rounded-full bg-white transition-transform duration-300 ${['discipline', 'teacher', 'nurse'].includes(u.role_name) ? "translate-x-3" : "translate-x-0.5"
                              }`} />
                          </div>
                        )}
                      </button>
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

export default AdminUserManagement;

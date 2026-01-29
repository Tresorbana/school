import React, { useState } from "react";
import { IoClose } from "react-icons/io5";
import { FiLoader } from "react-icons/fi";

export interface Role {
  id: string;
  name: string;
  role_id: string;
  role_name: string;
}

interface RoleAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  currentRole: string;
  roles: Role[];
  onConfirm: (roleId: string, action: 'assign' | 'remove') => Promise<void>;
  isActivating: boolean; // true for activation, false for deactivation
}

const RoleAssignmentModal: React.FC<RoleAssignmentModalProps> = ({
  open,
  onClose,
  userName,
  currentRole,
  roles,
  onConfirm,
  isActivating,
}) => {
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    if (isActivating && !selectedRoleId) {
      return; // Don't proceed if no role selected for activation
    }

    setIsLoading(true);
    try {
      const action = isActivating ? 'assign' : 'remove';
      await onConfirm(selectedRoleId, action);
      onClose();
    } catch (error) {
      console.error("Role assignment error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setSelectedRoleId("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[6px] z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {isActivating ? "Activate User" : "Deactivate User"}
          </h3>
          <button 
            onClick={handleClose} 
            disabled={isLoading}
            className="p-2 rounded-full hover:bg-gray-100 transition disabled:opacity-50"
          >
            <IoClose className="text-xl" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-4">
            {isActivating 
              ? `Select a role to assign to ${userName}:`
              : `Are you sure you want to deactivate ${userName}? This will remove their current role (${currentRole}) and set them as inactive.`
            }
          </p>

          {isActivating && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Role *
              </label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-[.8rem] focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent"
                disabled={isLoading}
              >
                <option key="choose-role" value="" className="text-[.8rem]">
                    Choose a role...
                </option>
                {roles
                  .filter(role => role.role_name !== 'inactive') // Don't show inactive as an option
                  .map((role) => (
                    <option 
                        key={role.role_id || role.id} 
                        value={role.role_id || role.id}
                        className="text-[.8rem]"
                    >
                      {(role.role_name || role.name).charAt(0).toUpperCase() + (role.role_name || role.name).slice(1)}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || (isActivating && !selectedRoleId)}
            className={`px-4 py-2 text-sm rounded-md text-white transition disabled:opacity-50 flex items-center gap-2 ${
              isActivating 
                ? 'bg-main hover:bg-main/90' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isLoading && <FiLoader className="w-4 h-4 animate-spin" />}
            {isActivating ? "Activate" : "Deactivate"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleAssignmentModal;
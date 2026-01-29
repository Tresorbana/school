import React from "react";
import { IoClose } from "react-icons/io5";
import AvatarLetter from "../../shared/AvatarLetter";
import { formatDistanceToNow, parseISO } from 'date-fns';

interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  roles: string[];
  role_name: string;
}

interface UserDetailsModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ open, onClose, user }) => {
  if (!open || !user) return null;

  // format the created_at
  const createdAt = parseISO(user.created_at);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[6px] z-50">
      <div className="bg-white rounded-xl shadow-2xl p-4 w-full max-w-md border border-gray-200">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-base font-semibold text-gray-800">User Details</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition">
            <IoClose className="text-base" />
          </button>
        </div>

        {/* User Profile Section */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0">
            <AvatarLetter 
              firstname={user.first_name} 
              lastname={user.last_name}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <h5 className="text-sm font-semibold text-gray-900 mb-1">
              {user.first_name} {user.last_name}
            </h5>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${user.role_name !== 'inactive' ? 'bg-main' : 'bg-gray-400'}`}></div>
              <span className="text-xs text-gray-600">
                {user.role_name !== 'inactive' ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* User Information Grid */}
        <div className="space-y-2">
          <div className="flex justify-between items-center py-1">
            <span className="text-xs font-medium text-gray-600">First Name</span>
            <span className="text-xs text-gray-900">{user.first_name}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-xs font-medium text-gray-600">Last Name</span>
            <span className="text-xs text-gray-900">{user.last_name}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-xs font-medium text-gray-600">Email</span>
            <span className="text-xs text-gray-900">{user.email}</span>
          </div>
          {user.role_name != "inactive" && (
            <div className="flex justify-between items-center py-1">
              <span className="text-xs font-medium text-gray-600">Role</span>
              <span className="text-xs text-gray-900">{user.role_name}</span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center py-1">
          <span className="text-xs font-medium text-gray-600">Created </span>
          <span className="text-xs text-gray-900">{ formatDistanceToNow(createdAt, { addSuffix: true }) }</span>
        </div>

        {/* Close Button */}
        <div className="flex justify-end mt-4 pt-3 border-t border-gray-200">
          <button 
            onClick={onClose} 
            className="px-4 py-1.5 text-sm rounded-md border border-gray-300 text-gray-800 hover:bg-gray-50 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
import React, { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { userService } from "../../../services/userService";
import { useToast } from "../../../utils/context/ToastContext";

export type UpdateUserForm = {
  firstname: string;
  lastname: string;
  email: string;
  role_id: string;
  password: string;
  confirmPassword: string;
};

export interface Role {
  id: string;
  name: string;
}

interface UpdateUserModalProps {
  open: boolean;
  onClose: () => void;
  roles: Role[];
  user?: {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
    roles: string[];
    role_name: string;
  } | null;
  onSubmit?: (data: UpdateUserForm & { id: string }) => void;
}

const UpdateUserModal: React.FC<UpdateUserModalProps> = ({ open, onClose, roles, user, onSubmit }) => {
  const { addToast } = useToast();
  const [form, setForm] = useState<UpdateUserForm>({
    firstname: "",
    lastname: "",
    email: "",
    role_id: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      if (user) {  
        const matchedRole = roles.find(r => r.name === user.role_name);
      
        setForm({
          firstname: user.first_name,
          lastname: user.last_name,
          email: user.email,
          role_id: matchedRole?.id || "",
          password: "",
          confirmPassword: "",
        });
      }
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [open, user, roles]);

  if (!open) return null;

  const handleChange =
    (key: keyof UpdateUserForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
    };

  const handleSubmit = async () => {
    if (form.password && form.password !== form.confirmPassword) {
      addToast({
        title: "Password Mismatch",
        message: "Passwords do not match!",
        type: "error",
      });
      return;
    }
    if (user) {
      try {
        const updateData = {
          user_id: user.user_id,
          firstname: form.firstname,
          lastname: form.lastname,
          email: form.email,
          role_id: form.role_id,
          password: form.password || null, // Only send password if it's not empty
        };

        console.log("Sending update data:", updateData);
        const result = await userService.updateUser(updateData);
        console.log("Update result:", result);
        onSubmit?.({ ...form, id: user.user_id });
        onClose();
      } catch (error) {
        addToast({
          title: "Update Failed",
          message: error instanceof Error ? error.message : 'Failed to update user',
          type: "error",
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[6px] z-50">
      <div className="bg-white rounded-xl shadow-2xl p-4 w-full max-w-3xl border border-gray-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-800">Update user</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition">
            <IoClose className="text-base" />
          </button>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">First name *</label>
            <input
              placeholder="Your first name"
              value={form.firstname}
              onChange={handleChange("firstname")}
              className="w-full text-xs border border-gray-300 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-main/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Last name *</label>
            <input
              placeholder="Your last name"
              value={form.lastname}
              onChange={handleChange("lastname")}
              className="w-full text-xs border border-gray-300 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-main/40"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Role *</label>
            <select
              value={form.role_id}
              onChange={handleChange("role_id")}
              className="w-full text-xs border border-gray-300 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-main/40"
            >
              <option value="">Select role</option>
              {(roles as any[]).map(r => (
                <option key={r.role_id} value={r.role_id}>
                  {r.role_name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
            <input
              placeholder="Enter your email"
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              className="w-full text-xs border border-gray-300 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-main/40"
            />
          </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">New Password (leave empty to keep current)</label>
            <div className="relative">
              <input
                placeholder="Enter new password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange("password")}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1 pr-7 outline-none focus:ring-2 focus:ring-main/40"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
              >
                {showPassword ? <FiEyeOff className="w-3 h-3" /> : <FiEye className="w-3 h-3" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Confirm new password</label>
            <div className="relative">
              <input
                placeholder="Confirm new password"
                type={showConfirmPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={handleChange("confirmPassword")}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1 pr-7 outline-none focus:ring-2 focus:ring-main/40"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
              >
                {showConfirmPassword ? <FiEyeOff className="w-3 h-3" /> : <FiEye className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <button 
            onClick={onClose} 
            className="px-4 py-1.5 text-sm rounded-md border border-gray-300 text-gray-800 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            className="px-4 py-1.5 text-sm rounded-md bg-main text-white hover:opacity-90 transition"
          >
            Update user
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateUserModal;
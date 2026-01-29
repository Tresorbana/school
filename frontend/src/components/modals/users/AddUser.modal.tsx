import { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import { FiX, FiEye, FiEyeOff } from "react-icons/fi";

export interface MockClass {
  id: string;
  name: string;
  level: string;
}

export type AddUserForm = {
  firstname: string;
  lastname: string;
  email: string;
  role_id: string;
  gender: string;
  phone: string;
  password: string;
  confirmPassword: string;
  assignedClasses: string[];
};

export interface Role {
  id: string;
  name: string;
  role_id?: string;
  role_name?: string;
}

/**
 * @deprecated Not used
 * This component will be removed in testing
 * The admin can't create other users
*/
const AddUserModal: React.FC<{
  open: boolean;
  onClose: () => void;
  roles: Role[];
  onSubmit?: (data: AddUserForm) => void;
}> = ({ open, onClose, roles, onSubmit }) => {
  const [form, setForm] = useState<AddUserForm>({
    firstname: "",
    lastname: "",
    email: "",
    role_id: "", // Default to teacher
    gender: "",
    phone: "",
    password: "",
    confirmPassword: "",
    assignedClasses: [],
  });

  const [classes, setClasses] = useState<MockClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setForm({
        firstname: "",
        lastname: "",
        email: "",
        role_id: "2", // Default to teacher
        gender: "",
        phone: "",
        password: "",
        confirmPassword: "",
        assignedClasses: [],
      });
      setClasses([]);
      setSelectedClass("");
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [open, roles]);

  if (!open) return null;

  const handleChange =
    (key: keyof AddUserForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      if (key === 'assignedClasses') return; // Handle separately
      
      // Clear assigned classes if role changes from teacher to something else
      if (key === 'role_id' && e.target.value !== "2") {
        setForm((f) => ({ ...f, [key]: e.target.value, assignedClasses: [] }));
      } else {
        setForm((f) => ({ ...f, [key]: e.target.value }));
      }
    };

  const handleAddClass = () => {
    if (selectedClass && !form.assignedClasses.includes(selectedClass)) {
      setForm(f => ({ ...f, assignedClasses: [...f.assignedClasses, selectedClass] }));
      setSelectedClass("");
    }
  };

  const handleRemoveClass = (classId: string) => {
    setForm(f => ({ ...f, assignedClasses: f.assignedClasses.filter(id => id !== classId) }));
  };

  const handleSubmit = () => {
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    onSubmit?.(form);
    onClose();
  };

  const getClassName = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? `${cls.name} - ${cls.level}` : classId;
  };

  const isTeacher = form.role_id === "2";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[6px] z-50">
      <div className="bg-white rounded-xl shadow-2xl p-4 w-full max-w-3xl border border-gray-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-800">Add user</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Role *</label>
            <select
              value={form.role_id}
              onChange={handleChange("role_id")}
              className="w-full text-xs border border-gray-300 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-main/40"
            >
              <option value="">Select role</option>
              {(roles as any[]).map((r) => (
                <option key={r.role_id} value={r.role_id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Gender *</label>
            <select
              value={form.gender}
              onChange={handleChange("gender")}
              className="w-full text-xs border border-gray-300 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-main/40"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Phone number *</label>
            <input
              placeholder="Enter your phone"
              type="tel"
              value={form.phone}
              onChange={handleChange("phone")}
              className="w-full text-xs border border-gray-300 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-main/40"
            />
          </div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Password *</label>
            <div className="relative">
              <input
                placeholder="Enter your password"
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
            <label className="block text-xs font-medium text-gray-700 mb-1">Confirm password *</label>
            <div className="relative">
              <input
                placeholder="Enter your password"
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

        {/* Class Assignment - Only for Teachers */}
        {isTeacher && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">Assign a class *</label>
            <div className="flex gap-2 mb-2">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="flex-1 text-xs border border-gray-300 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-main/40"
              >
                <option value="">Select a class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} - {cls.level}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddClass}
                disabled={!selectedClass}
                className="px-2 py-1 text-xs bg-main text-white rounded-md hover:bg-main/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Add
              </button>
            </div>

            {/* Class Tags */}
            {form.assignedClasses.length > 0 && (
              <div className="border border-gray-200 rounded-md p-2 bg-gray-50">
                <p className="text-xs text-gray-600 mb-1">Assigned classes:</p>
                <div className="flex flex-wrap gap-1">
                  {form.assignedClasses.map((classId) => (
                    <div
                      key={classId}
                      className="inline-flex items-center gap-1 bg-main text-white px-2 py-0.5 rounded-full text-xs"
                    >
                      <span>{getClassName(classId)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveClass(classId)}
                        className="hover:bg-white/20 rounded-full p-0.5 transition"
                      >
                        <FiX className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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
            Add user
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;
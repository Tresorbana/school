import { useState } from "react";
import { HiX } from "react-icons/hi";

interface RecordAttendanceNurseModalProps {
  open: boolean;
  onClose: () => void;
}

function RecordAttendanceNurseModal({ open, onClose }: RecordAttendanceNurseModalProps) {
  const [formData, setFormData] = useState({
    class: "",
    date: "",
    totalStudents: "",
    sickStudents: ""
  });

  if (!open) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    // Handle form submission logic here
    console.log("Form data:", formData);
    onClose();
  };

  const handleCancel = () => {
    setFormData({
      class: "",
      date: "",
      totalStudents: "",
      sickStudents: ""
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4 p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-md font-semibold text-gray-900">Record attendance</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <HiX className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <hr className="mb-4 border-gray-200" />

        {/* Form */}
        <div className="space-y-4">
          {/* First Row - Class and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[.8rem] font-medium text-gray-700 mb-1">
                Class
              </label>
              <select
                name="class"
                value={formData.class}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-[.8rem] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-main focus:border-transparent"
              >
                <option value="">select class</option>
                <option value="Y1A">Y1A</option>
                <option value="Y1B">Y1B</option>
                <option value="Y1C">Y1C</option>
                <option value="Y2A">Y2A</option>
                <option value="Y2B">Y2B</option>
                <option value="Y2C">Y2C</option>
              </select>
            </div>

            <div>
              <label className="block text-[.8rem] font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                placeholder="dd-mm-yy"
                className="w-full px-3 py-2 text-[.8rem] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-main focus:border-transparent"
              />
            </div>
          </div>

          {/* Second Row - Total Students and Sick Students */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[.8rem] font-medium text-gray-700 mb-1">
                Total students
              </label>
              <input
                type="number"
                name="totalStudents"
                value={formData.totalStudents}
                onChange={handleInputChange}
                placeholder="Enter total students"
                className="w-full px-3 py-2 text-[.8rem] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-main focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-[.8rem] font-medium text-gray-700 mb-1">
                Sick students
              </label>
              <input
                type="number"
                name="sickStudents"
                value={formData.sickStudents}
                onChange={handleInputChange}
                placeholder="Enter sick students"
                className="w-full px-3 py-2 text-[.8rem] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-main focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-3 mt-6">
          <button
            onClick={handleCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 text-[.8rem] rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:ring-offset-1"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-main text-white text-[.8rem] rounded-md hover:bg-main/90 focus:outline-none focus:ring-1 focus:ring-main focus:ring-offset-1"
          >
            Add user
          </button>
        </div>
      </div>
    </div>
  );
}

export default RecordAttendanceNurseModal;
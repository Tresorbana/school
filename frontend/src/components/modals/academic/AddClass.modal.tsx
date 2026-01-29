import { useState } from "react";
import { IoClose } from "react-icons/io5";
import { classService } from "../../../services/academicService";
import { useToast } from "../../../utils/context/ToastContext";

interface AddClassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function AddClassModal({ isOpen, onClose }: AddClassModalProps) {
  const [formData, setFormData] = useState({
    className: "",
    yearLevel: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.className.trim() || !formData.yearLevel) {
      addToast({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    try {
      setIsLoading(true);
      const response = await classService.createClass({
        class_name: formData.className.trim(),
        year_level: parseInt(formData.yearLevel)
      });

      if (response.success) {
        addToast({ message: response.message, type: 'success' });
        setFormData({ className: "", yearLevel: "" });
        onClose();
      }
    } catch (error: any) {
      addToast({ message: 'Failed to create class: ' + error.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Add New Class</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <IoClose size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Class Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="className"
                value={formData.className}
                onChange={handleInputChange}
                placeholder="Enter class name (e.g., Y1A, Y2B)"
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-main/20 focus:border-main"
              />
            </div>
            
            {/* Year Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year Level <span className="text-red-500">*</span>
              </label>
              <select
                name="yearLevel"
                value={formData.yearLevel}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-main/20 focus:border-main"
              >
                <option value="">Select year level</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-main text-white rounded-lg text-sm hover:bg-main/90 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              Add Class
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddClassModal;
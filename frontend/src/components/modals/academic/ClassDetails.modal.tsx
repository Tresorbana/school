import React from "react";
import { IoClose } from "react-icons/io5";

interface ClassDetailsModalProps {
  open: boolean;
  onClose: () => void;
  classInfo?: {
    className: string;
    subject: string;
    period: string;
    day: string;
  };
}

const ClassDetailsModal: React.FC<ClassDetailsModalProps> = ({
  open,
  onClose,
  classInfo = {
    className: "3A",
    subject: "Mathematics", 
    period: "8:00 - 10:10 am",
    day: "Monday"
  }
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-md font-semibold text-gray-800">
              Class Details
            </h3>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1 rounded hover:bg-gray-100"
            >
              <IoClose className="text-lg" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Class Info */}
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-[0.8rem] text-gray-600">Class:</span>
                <span className="text-md font-semibold text-gray-800">{classInfo.className}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-[0.8rem] text-gray-600">Subject:</span>
                <span className="text-md font-semibold text-gray-800">{classInfo.subject}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-[0.8rem] text-gray-600">Period:</span>
                <span className="text-md font-semibold text-gray-800">{classInfo.period}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-[0.8rem] text-gray-600">Day:</span>
                <span className="text-md font-semibold text-gray-800">{classInfo.day}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-[0.8rem] text-gray-600">Students:</span>
                <span className="text-md font-semibold text-gray-800">45</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-[0.8rem] text-gray-600">Status:</span>
                <span className="text-md font-semibold text-main">Active</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-[0.8rem] text-gray-600">Last Updated:</span>
                <span className="text-md font-semibold text-gray-800">15-10-2025</span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end mt-6 pt-3 border-t">
              <button 
                onClick={onClose}
                className="px-4 py-1.5 text-[0.8rem] text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassDetailsModal;
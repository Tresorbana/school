import React from "react"; 
import { IoClose } from "react-icons/io5";

interface DisapproveUserModalProps {
  open: boolean;
  onClose: () => void;
  userName?: string;
  onConfirm?: () => void;
}

const DisapproveUserModal: React.FC<DisapproveUserModalProps> = ({
  open,
  onClose,
  userName,
  onConfirm
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl bg-white shadow-2xl p-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6"/>
              </div>

              {/* Title */}
              <h3 className="text-[0.95rem] font-semibold text-gray-800">Disapprove User</h3>
            </div>

            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1 rounded hover:bg-gray-100"
            >
              <IoClose className="text-[0.8rem]" />
            </button>
          </div>

          <div className="h-px bg-gray-200 my-4" />

          {/* Description */}
          <p className="text-[0.8rem] text-gray-700">
            Are you sure you want to deactivate this <strong>{userName || 'this user'}</strong>? 
            They will no longer have access to the system until reactivated.
          </p>

          {/* Buttons */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={onConfirm}
              className="px-6 py-2 text-[0.75rem] rounded-md bg-main text-white hover:bg-main-hover"
            >
              Disapprove
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 text-[0.75rem] rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisapproveUserModal;

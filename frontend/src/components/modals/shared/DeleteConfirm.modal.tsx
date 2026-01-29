import React from "react";
import { IoClose } from "react-icons/io5";
import { FiTrash2 } from "react-icons/fi";

interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  message?: string;
  onConfirm?: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ open, onClose, message, onConfirm }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl bg-white shadow-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-red-50 text-red-600">
                <FiTrash2 />
              </span>
              <h3 className="text-lg font-semibold text-gray-800">Delete Confirmation</h3>
            </div>
            <button onClick={onClose} aria-label="Close" className="p-1 rounded hover:bg-gray-100">
              <IoClose className="text-xl" />
            </button>
          </div>
          <div className="h-px bg-gray-200 my-4" />

          <p className="text-sm text-gray-700">
            {message || "Are you certain you wish to proceed with the deletion of the selected entry?"}
          </p>

          <div className="mt-6 flex items-center justify-center">
            <button
              onClick={onConfirm}
              className="px-6 py-2 rounded-md bg-main text-white hover:opacity-90"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;

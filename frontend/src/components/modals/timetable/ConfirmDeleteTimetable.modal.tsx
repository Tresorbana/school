import React from "react";
import { IoClose } from "react-icons/io5";
import { FiAlertTriangle } from "react-icons/fi";
import ModalWrapper from "../../shared/ModalWrapper";

interface ConfirmDeleteTimetableModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  timetableLabel?: string;
}

const ConfirmDeleteTimetableModal: React.FC<ConfirmDeleteTimetableModalProps> = ({
  open,
  onClose,
  onConfirm,
  timetableLabel
}) => {
  if (!open) return null;

  return (
    <ModalWrapper isOpen={open} onClose={onClose} className="w-full max-w-lg">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-red-50 text-red-600">
              <FiAlertTriangle />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Delete Timetable</h3>
              {timetableLabel && (
                <p className="text-xs text-gray-500 mt-1">{timetableLabel}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded hover:bg-gray-100">
            <IoClose className="text-xl" />
          </button>
        </div>

        <div className="h-px bg-gray-200 my-4" />

        <div className="space-y-3 text-sm text-gray-700">
          <p>
            You are about to permanently delete this timetable. This will remove all linked
            teacher schedules and timetable records associated with it.
          </p>
          <p className="text-red-600 font-medium">
            This action cannot be undone.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
          >
            Delete timetable
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default ConfirmDeleteTimetableModal;

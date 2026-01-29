import { IoClose, IoWarning } from "react-icons/io5";
import ModalWrapper from "../../shared/ModalWrapper";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName: string;
  itemType: string;
  isLoading?: boolean;
  warningText?: string;
}

function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  itemType,
  isLoading = false,
  warningText
}: DeleteConfirmationModalProps) {
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} className="w-full max-w-md" preventClose={isLoading}>
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <IoWarning className="text-red-600 text-lg" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500">This action cannot be undone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors disabled:opacity-50"
          >
            <IoClose size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="mb-4">
            <p className="text-gray-700 mb-2">{message}</p>
            <div className="bg-gray-200 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900">
                {itemType}: <span className="text-gray-600">{itemName}</span>
              </p>
            </div>
          </div>

          {warningText && (
            <div className="bg-gray-200 border border-gray-200 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <IoWarning className="text-gray-500 text-[.8rem] mt-0.5 flex-shrink-0" />
                <p className="text-[.8rem] text-gray-700">{warningText}</p>
              </div>
            </div>
          )}

          <div className="border border-gray-200 rounded-lg p-3">
            <p className="text-[.8rem] text-gray-700">
              <strong>Warning:</strong> This will permanently delete the {itemType.toLowerCase()} and all associated data. This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-[.8rem] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-[.8rem] font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Deleting...
              </>
            ) : (
              `Delete ${itemType}`
            )}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

export default DeleteConfirmationModal;
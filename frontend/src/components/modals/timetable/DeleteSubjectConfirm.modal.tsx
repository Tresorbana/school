import ModalWrapper from "../../shared/ModalWrapper";

interface DeleteSubjectConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteSubjectConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm 
}: DeleteSubjectConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <ModalWrapper 
      isOpen={isOpen} 
      onClose={onClose}
      className="w-[320px]"
    >
      <div className="p-4">
        <h2 className="font-semibold text-base mb-3 text-gray-800">Confirm Deletion</h2>

        <p className="text-gray-600 mb-4 text-sm">
          Are you sure you want to delete this subject? This action cannot be undone.
        </p>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="border border-gray-400 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-500 text-white px-3 py-1.5 rounded-lg shadow-md hover:bg-red-600 transition text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

export default DeleteSubjectConfirmModal;
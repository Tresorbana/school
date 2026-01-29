import React from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import ModalWrapper from '../../shared/ModalWrapper';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning'
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'text-red-500',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white'
        };
      case 'info':
        return {
          icon: 'text-main',
          confirmButton: 'bg-main hover:bg-main/80 text-white'
        };
      default:
        return {
          icon: 'text-orange-500',
          confirmButton: 'bg-main hover:bg-main/80 text-white'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <ModalWrapper 
      isOpen={isOpen} 
      onClose={onClose}
      className="w-full max-w-md"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FiAlertTriangle className={`w-6 h-6 ${styles.icon}`} />
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        <div className="mb-6">
          <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-lg transition-colors text-sm ${styles.confirmButton}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default ConfirmationModal;
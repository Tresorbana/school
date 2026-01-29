import React, { useEffect } from 'react';

interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  containerClassName?: string;
  preventClose?: boolean;
}

const ModalWrapper: React.FC<ModalWrapperProps> = ({
  isOpen,
  onClose,
  children,
  className = '',
  overlayClassName = '',
  containerClassName = '',
  preventClose = false
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store original overflow style
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      
      // Get scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // Apply styles to prevent scroll
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      
      // Cleanup function
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || preventClose) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, preventClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !preventClose) {
      onClose();
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm ${overlayClassName}`}
      onClick={handleOverlayClick}
    >
      <div 
        className={`absolute top-1/2 left-1/2 md:left-[calc(50%+7rem)] transform -translate-x-1/2 -translate-y-1/2 p-4 ${containerClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className={`bg-white  rounded-lg shadow-xl overflow-hidden transition-colors duration-200 ${className}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default ModalWrapper;
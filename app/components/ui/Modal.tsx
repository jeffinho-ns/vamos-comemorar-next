import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  className?: string;
  overlayClassName?: string;
  contentLabel?: string;
  ariaHideApp?: boolean;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onRequestClose,
  className = "bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto",
  overlayClassName = "fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50",
  contentLabel,
  ariaHideApp = false,
  children,
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onRequestClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onRequestClose();
    }
  };

  return (
    <div
      className={overlayClassName}
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label={contentLabel}
      tabIndex={-1}
    >
      <div className={className}>
        {children}
      </div>
    </div>
  );
};

export default Modal;

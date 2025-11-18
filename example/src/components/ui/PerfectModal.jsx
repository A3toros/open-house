import React from 'react';
import Button from './Button';

// PERFECT MODAL - Based on the working example pattern
// Uses direct Tailwind styling instead of CSS classes for reliability

const PerfectModal = ({
  isOpen = false,
  onClose,
  title = '',
  children,
  size = 'medium', // 'small', 'medium', 'large'
  showCloseButton = true,
  closeOnBackdropClick = true,
  className = '',
  ...props
}) => {
  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key and safe body scroll locking
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Simple ref counter to handle multiple modals
    const win = window;
    if (!win.__modalOpenCount) win.__modalOpenCount = 0;

    let previousOverflow;
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      previousOverflow = document.body.style.overflow;
      if (win.__modalOpenCount === 0) {
        document.body.style.overflow = 'hidden';
      }
      win.__modalOpenCount += 1;
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      if (win.__modalOpenCount && win.__modalOpenCount > 0) {
        win.__modalOpenCount -= 1;
      }
      if (win.__modalOpenCount === 0) {
        // Restore to previous value if defined, else remove inline style
        if (previousOverflow !== undefined) {
          document.body.style.overflow = previousOverflow || '';
        } else {
          document.body.style.overflow = '';
        }
      }
    };
  }, [isOpen, onClose]);

  // Size classes - made bigger
  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-lg',
    large: 'max-w-4xl'
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      {...props}
    >
      <div
        className={`
          bg-white rounded-xl shadow-md border border-gray-200 p-8
          hover:shadow-lg hover:-translate-y-1 transition-all duration-200
          w-full ${sizeClasses[size]} mx-auto
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between mb-6">
            {title && (
              <h3 className="text-2xl font-bold text-gray-800">
                {title}
              </h3>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-all duration-200 rounded-full p-2 text-2xl font-bold leading-none"
                aria-label="Close modal"
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PerfectModal;

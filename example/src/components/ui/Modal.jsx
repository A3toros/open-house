import React, { useState, useEffect, useCallback, useRef } from 'react';
import Button from './Button';

// SIMPLIFIED MODAL COMPONENT - Essential modal functionality only
// Removed: Complex variants, positions, loading states, error handling
// Kept: Basic modal, backdrop, close functionality, keyboard support

export const Modal = ({
  isOpen = false,
  onClose,
  title = '',
  children,
  size = 'medium', // 'small', 'medium', 'large'
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = '',
  ...props
}) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle modal open/close animations
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsAnimating(true);
      previousActiveElement.current = document.activeElement;
      
      setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus();
        }
      }, 100);
    } else {
      setIsAnimating(false);
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
      setTimeout(() => {
        setIsVisible(false);
      }, 300);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (closeOnEscape && e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeOnEscape]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      handleClose();
    }
  }, [closeOnBackdropClick]);

  // Handle close
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  // Generate CSS classes
  const modalClasses = [
    'modal',
    `modal-${size}`,
    isVisible ? 'modal-visible' : '',
    isAnimating ? 'modal-animating' : '',
    className
  ].filter(Boolean).join(' ');

  const contentClasses = [
    'modal-content',
    `modal-content-${size}`
  ].filter(Boolean).join(' ');

  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <div
      ref={modalRef}
      className={modalClasses}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabIndex={-1}
      {...props}
    >
      <div className={contentClasses}>
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="modal-header">
            {title && (
              <h3 className="modal-title">
                {title}
              </h3>
            )}
            {showCloseButton && (
              <Button
                variant="secondary"
                size="small"
                onClick={handleClose}
                className="modal-close"
                aria-label="Close modal"
              >
                ×
              </Button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;

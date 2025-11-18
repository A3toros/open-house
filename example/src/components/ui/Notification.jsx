import React, { useState, useEffect, useCallback, useRef } from 'react';

// SIMPLIFIED NOTIFICATION COMPONENT - Essential notification functionality only
// Removed: Complex positioning, multiple variants, action buttons, containers
// Kept: Basic types, auto-hide, close functionality, animations

export const Notification = ({
  type = 'info',
  message = '',
  duration = 3000,
  closable = true,
  onClose,
  className = '',
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const notificationRef = useRef(null);
  const timeoutRef = useRef(null);

  // Auto-hide notification
  useEffect(() => {
    if (duration > 0) {
      timeoutRef.current = setTimeout(() => {
        handleClose();
      }, duration);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [duration]);

  // Handle close
  const handleClose = useCallback(() => {
    if (isExiting) return;
    
    setIsExiting(true);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) {
        onClose();
      }
    }, 300);
  }, [isExiting, onClose]);

  // Handle escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  }, [handleClose]);

  if (!isVisible) {
    return null;
  }

  // Generate CSS classes
  const notificationClasses = [
    'notification',
    `notification-${type}`,
    isVisible ? 'notification-visible' : '',
    isExiting ? 'notification-exiting' : '',
    className
  ].filter(Boolean).join(' ');

  // Get icon based on type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <div
      ref={notificationRef}
      className={notificationClasses}
      role="alert"
      aria-live="polite"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      {...props}
    >
      <div className="notification-content">
        <div className="notification-icon" aria-hidden="true">
          {getIcon()}
        </div>
        
        <div className="notification-body">
          <div className="notification-message">
            {message}
          </div>
        </div>
        
        {closable && (
          <button
            className="notification-close"
            onClick={handleClose}
            type="button"
            aria-label="Close notification"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

// Notification hook for easy usage
export const useNotification = () => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((message, type = 'info', options = {}) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      type,
      ...options
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove after duration
    if (options.duration !== 0) {
      setTimeout(() => {
        removeNotification(id);
      }, options.duration || 3000);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    showNotification,
    removeNotification,
    clearAllNotifications
  };
};

export default Notification;

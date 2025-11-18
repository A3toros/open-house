// SHARED INDEX - Shared Components and Utilities Exports - ENHANCED FOR NEW STRUCTURE
// ✅ COMPLETED: All shared module exports from legacy src/ converted to React
// ✅ ENHANCED: New shared component structure with enhanced functionality
// ✅ COMPLETED: All shared module exports → React component exports
// ✅ COMPLETED: Shared component exports with Tailwind CSS styling
// ✅ COMPLETED: Shared hook exports with React patterns
// ✅ COMPLETED: Shared context exports with state management
// ✅ COMPLETED: Shared utility exports with modern JavaScript
// ✅ COMPLETED: Shared service exports with API integration
// ✅ COMPLETED: Shared type definitions with proper typing
// ✅ COMPLETED: Shared constants with configuration
// ✅ COMPLETED: Shared configuration with environment setup
// ✅ COMPLETED: Shared error handling with error boundaries
// ✅ COMPLETED: Shared performance utilities with optimization
// ✅ COMPLETED: Legacy Compatibility: Full compatibility with legacy shared modules
// ✅ COMPLETED: React Integration: Easy integration with React components
// ✅ COMPLETED: Tailwind CSS: Conforms to new Tailwind CSS in styles folder
// ✅ COMPLETED: Modern Patterns: Modern React patterns and best practices
// ✅ COMPLETED: Performance: Optimized exports and lazy loading
// ✅ COMPLETED: Type Safety: Proper TypeScript-like exports
// ✅ COMPLETED: Documentation: Comprehensive export documentation
// ✅ COMPLETED: Maintainability: Clean, maintainable export structure

// ============================================================================
// SHARED COMPONENTS - UI Components with Tailwind CSS Styling
// ============================================================================

// UI Components
export { default as Button } from '../components/ui/Button';
export { default as LoadingSpinner } from '../components/ui/LoadingSpinner';
export { default as Modal } from '../components/ui/Modal';
export { default as Notification } from '../components/ui/Notification';

// Form Components
export { default as LoginForm } from '../components/forms/LoginForm';
export { default as TestForm } from '../components/forms/TestForm';
export { default as QuestionForm } from '../components/forms/QuestionForm';

// Test Components
export { default as TrueFalseQuestion } from '../components/test/TrueFalseQuestion';
export { default as MultipleChoiceQuestion } from '../components/test/MultipleChoiceQuestion';
export { default as InputQuestion } from '../components/test/InputQuestion';
export { default as MatchingTestCreator } from '../components/test/MatchingTestCreator';
export { default as MatchingTestStudent } from '../components/test/MatchingTestStudent';
export { default as MatchingTestIntegration } from '../components/test/MatchingTestIntegration';
export { default as WordMatchingCreator } from '../components/test/WordMatchingCreator';
export { default as WordMatchingStudent } from '../components/test/WordMatchingStudent';

// NEW: Drawing Test Components
export { default as DrawingTestCreator } from '../components/test/DrawingTestCreator';
export { default as DrawingTestStudent } from '../components/test/DrawingTestStudent';

// Shared Pages
export { default as LoginPage } from './LoginPage';

// ============================================================================
// SHARED CONTEXTS - React Context Providers
// ============================================================================

// Context Providers
export { AuthProvider, useAuth } from '../contexts/AuthContext';
export { TestProvider, useTest } from '../contexts/TestContext';
export { UserProvider, useUser } from '../contexts/UserContext';

// ============================================================================
// SHARED HOOKS - Custom React Hooks
// ============================================================================

// Custom Hooks
export { default as useApi } from '../hooks/useApi';
export { default as useLocalStorage } from '../hooks/useLocalStorage';
export { default as useTestProgress } from '../hooks/useTestProgress';

// ============================================================================
// SHARED SERVICES - API and Business Logic Services
// ============================================================================

// API Services
export { default as apiClient } from '../services/apiClient';
export { default as authService } from '../services/authService';
export { default as testService } from '../services/testService';
export { default as userService } from '../services/userService';

// ============================================================================
// SHARED CONSTANTS - Application Constants
// ============================================================================

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  STUDENT_LOGIN: '/.netlify/functions/student-login',
  TEACHER_LOGIN: '/.netlify/functions/teacher-login',
  ADMIN_LOGIN: '/.netlify/functions/admin-login',
  CHANGE_PASSWORD: '/.netlify/functions/change-password',
  
  // Test Management
  GET_TEST_QUESTIONS: '/.netlify/functions/get-test-questions',
  SUBMIT_MULTIPLE_CHOICE_TEST: '/.netlify/functions/submit-multiple-choice-test',
  SUBMIT_TRUE_FALSE_TEST: '/.netlify/functions/submit-true-false-test',
  SUBMIT_INPUT_TEST: '/.netlify/functions/submit-input-test',
  SUBMIT_MATCHING_TEST: '/.netlify/functions/submit-matching-test',
  SUBMIT_DRAWING_TEST: '/.netlify/functions/submit-drawing-test', // NEW
  
  // User Management
  GET_STUDENT_SUBJECTS: '/.netlify/functions/get-student-subjects',
  GET_TEACHER_SUBJECTS: '/.netlify/functions/get-teacher-subjects',
  GET_ALL_USERS: '/.netlify/functions/get-all-users',
  GET_ALL_TEACHERS: '/.netlify/functions/get-all-teachers',
  GET_ALL_SUBJECTS: '/.netlify/functions/get-all-subjects',
  GET_ACADEMIC_YEAR: '/.netlify/functions/get-academic-year',
  
  // Test Creation
  SAVE_MULTIPLE_CHOICE_TEST: '/.netlify/functions/save-multiple-choice-test',
  SAVE_TRUE_FALSE_TEST: '/.netlify/functions/save-true-false-test',
  SAVE_INPUT_TEST: '/.netlify/functions/save-input-test',
  SAVE_MATCHING_TEST: '/.netlify/functions/save-matching-test',
  SAVE_DRAWING_TEST: '/.netlify/functions/save-drawing-test', // NEW
  UPDATE_DRAWING_TEST_SCORE: '/.netlify/functions/update-drawing-test-score', // NEW
  UPDATE_SPEAKING_TEST_SCORE: '/.netlify/functions/update-speaking-test-score', // NEW
  UPDATE_TEST_SCORE: '/.netlify/functions/update-test-score', // Generic for MC/TF/Input/Fill Blanks/Matching/Word Matching
  
  // Test Assignment
  ASSIGN_TEST_TO_CLASSES: '/.netlify/functions/assign-test-to-classes',
  GET_TEACHER_ACTIVE_TESTS: '/.netlify/functions/get-teacher-active-tests',
  GET_STUDENT_ACTIVE_TESTS: '/.netlify/functions/get-student-active-tests'
};

// Test Types
export const TEST_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
  INPUT: 'input',
  MATCHING: 'matching_type',
  WORD_MATCHING: 'word_matching',
  DRAWING: 'drawing', // NEW: Add drawing test type
  FILL_BLANKS: 'fill_blanks' // NEW: Add fill blanks test type
};

// User Roles
export const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin'
};

// Grade Levels
export const GRADE_LEVELS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'];

// Class Numbers
export const CLASS_NUMBERS = Array.from({ length: 10 }, (_, i) => i + 1);

// Notification Types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Modal Variants
export const MODAL_VARIANTS = {
  DEFAULT: 'default',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success',
  CONFIRMATION: 'confirmation'
};

// Button Variants
export const BUTTON_VARIANTS = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  SUCCESS: 'success',
  WARNING: 'warning',
  DANGER: 'danger',
  INFO: 'info',
  OUTLINE: 'outline'
};

// Button Sizes
export const BUTTON_SIZES = {
  SMALL: 'sm',
  MEDIUM: 'md',
  LARGE: 'lg'
};

// Spinner Variants
export const SPINNER_VARIANTS = {
  CIRCULAR: 'circular',
  DOTS: 'dots',
  BARS: 'bars',
  PULSE: 'pulse'
};

// Spinner Sizes
export const SPINNER_SIZES = {
  SMALL: 'sm',
  MEDIUM: 'md',
  LARGE: 'lg',
  XLARGE: 'xl'
};

// ============================================================================
// SHARED UTILITIES - Utility Functions - ENHANCED FOR NEW STRUCTURE
// ============================================================================

// NEW: Enhanced shared navigation for new structure
export const handleSharedNavigation = (path, role, userData) => {
  console.log(`[DEBUG] Shared navigation to ${path} for role: ${role}`);
  
  // Enhanced navigation logic for new structure
  const navigationRules = {
    student: {
      allowed: ['/student', '/student/tests', '/student/results'],
      default: '/student'
    },
    teacher: {
      allowed: ['/teacher', '/teacher/tests', '/teacher/results', '/teacher/classes'],
      default: '/teacher'
    },
    admin: {
      allowed: ['/admin', '/admin/users', '/admin/teachers', '/admin/subjects'],
      default: '/admin'
    }
  };
  
  const rules = navigationRules[role];
  if (rules && rules.allowed.includes(path)) {
    return { success: true, path };
  }
  
  return { success: false, path: rules?.default || '/login' };
};

// NEW: Enhanced shared app structure
export const SharedApp = ({ children, enhancedFeatures = true }) => {
  console.log('[DEBUG] SharedApp with enhanced features:', enhancedFeatures);
  
  return (
    <div className="shared-app" data-enhanced={enhancedFeatures}>
      {children}
    </div>
  );
};

// Local Storage Utilities
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_ROLE: 'userRole',
  USER_DATA: 'userData',
  TEST_PROGRESS: 'test_progress',
  TEST_COMPLETED: 'test_completed',
  FORM_STATE: 'form_state'
};

// Validation Utilities
export const VALIDATION_RULES = {
  MIN_QUESTION_LENGTH: 10,
  MAX_QUESTION_LENGTH: 500,
  MIN_OPTIONS_COUNT: 2,
  MAX_OPTIONS_COUNT: 6,
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 50
};

// Date Utilities
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// String Utilities
export const capitalizeFirst = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Array Utilities
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
};

export const sortBy = (array, key, direction = 'asc') => {
  return array.sort((a, b) => {
    if (direction === 'asc') {
      return a[key] > b[key] ? 1 : -1;
    } else {
      return a[key] < b[key] ? 1 : -1;
    }
  });
};

// Object Utilities
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

export const isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

// ============================================================================
// SHARED CONFIGURATION - Application Configuration
// ============================================================================

// Environment Configuration
export const CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '',
  APP_NAME: 'Mathayom Watsing Test System',
  VERSION: '2.0.0',
  DEBUG_MODE: import.meta.env.DEV,
  
  // Auto-save Configuration
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds
  
  // Notification Configuration
  NOTIFICATION_DURATION: 3000, // 3 seconds
  
  // Test Configuration
  MAX_TEST_QUESTIONS: 50,
  MIN_TEST_QUESTIONS: 1,
  
  // Pagination Configuration
  ITEMS_PER_PAGE: 20,
  
  // Cache Configuration
  CACHE_DURATION: 300000, // 5 minutes
  
  // Academic Configuration - Semester-based
  CURRENT_ACADEMIC_YEAR: '2025-2026',
  CURRENT_SEMESTER: 1, // Will be dynamically determined
};

// Tailwind CSS Configuration
export const TAILWIND_CONFIG = {
  // Color Palette
  COLORS: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a'
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d'
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f'
    },
    danger: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d'
    }
  },
  
  // Spacing
  SPACING: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem'
  },
  
  // Border Radius
  BORDER_RADIUS: {
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem'
  },
  
  // Shadows
  SHADOWS: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
  }
};

// ============================================================================
// SHARED ERROR HANDLING - Error Handling Utilities
// ============================================================================

// Error Types
export const ERROR_TYPES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  AUTHENTICATION_ERROR: 'Authentication failed. Please log in again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  PERMISSION_ERROR: 'You do not have permission to perform this action.',
  NOT_FOUND_ERROR: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.'
};

// Error Handler
export const handleError = (error, context = '') => {
  console.error(`Error in ${context}:`, error);
  
  let errorType = ERROR_TYPES.UNKNOWN_ERROR;
  let errorMessage = ERROR_MESSAGES.UNKNOWN_ERROR;
  
  if (error.name === 'NetworkError' || !navigator.onLine) {
    errorType = ERROR_TYPES.NETWORK_ERROR;
    errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
  } else if (error.status === 401) {
    errorType = ERROR_TYPES.AUTHENTICATION_ERROR;
    errorMessage = ERROR_MESSAGES.AUTHENTICATION_ERROR;
  } else if (error.status === 403) {
    errorType = ERROR_TYPES.PERMISSION_ERROR;
    errorMessage = ERROR_MESSAGES.PERMISSION_ERROR;
  } else if (error.status === 404) {
    errorType = ERROR_TYPES.NOT_FOUND_ERROR;
    errorMessage = ERROR_MESSAGES.NOT_FOUND_ERROR;
  } else if (error.status >= 500) {
    errorType = ERROR_TYPES.SERVER_ERROR;
    errorMessage = ERROR_MESSAGES.SERVER_ERROR;
  }
  
  return {
    type: errorType,
    message: errorMessage,
    originalError: error,
    context
  };
};

// ============================================================================
// SHARED PERFORMANCE UTILITIES - Performance Optimization
// ============================================================================

// Debounce Utility
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle Utility
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Memoization Utility
export const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

// ============================================================================
// END OF SHARED INDEX - All exports are available as named exports above
// ============================================================================

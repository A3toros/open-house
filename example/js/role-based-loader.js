/**
 * Role-Based Function Loader
 * Prevents teacher functionality from loading for students
 * Improves load times by loading only role-specific functions
 */
class RoleBasedLoader {
  constructor() {
    this.currentRole = null;
    this.loadedFunctions = new Set();
    this.blockedFunctions = new Set();
    this.initialized = false; // Prevent multiple initializations
    this.retryCount = 0; // Track retry attempts
    this.maxRetries = 20; // Maximum retries (10 seconds with 500ms intervals)
    
    // Don't auto-initialize - wait for login
    // The role-based loader will be initialized via setupAccessAfterLogin() after successful login
  }

  /**
   * Initialize the role-based loader
   */
  initialize() {
    // Prevent multiple initializations
    if (this.initialized) {
      console.log('[DEBUG] Role-based loader already initialized, skipping...');
      return;
    }
    
    // Check retry limit
    if (this.retryCount >= this.maxRetries) {
      console.warn('[DEBUG] Max retries reached, stopping role-based loader initialization');
      return;
    }
    
    this.retryCount++;
    // Only log every 5th attempt to reduce console spam
    if (this.retryCount % 5 === 1 || this.retryCount === this.maxRetries) {
      console.log(`[DEBUG] Role-based loader initializing... (attempt ${this.retryCount}/${this.maxRetries})`);
    }
    console.log('[DEBUG] Token manager available:', !!window.tokenManager);
    
    // Get role from token manager
    if (window.tokenManager && window.tokenManager.isAuthenticated()) {
      const role = window.tokenManager.getUserRole();
      console.log('[DEBUG] Role from token manager:', role);
      console.log('[DEBUG] Access token exists:', !!window.tokenManager.getAccessToken());
      
      if (role) {
        this.currentRole = role;
        this.initialized = true;
        this.retryCount = 0; // Reset retry counter on success
        this.setupRoleBasedAccess();
      } else {
        console.log('[DEBUG] No role found, waiting for role to be set...');
        setTimeout(() => this.initialize(), 500);
      }
    } else {
      console.log('[DEBUG] Token manager not available or not authenticated, waiting...');
      // Wait for token manager to be available and authenticated
      setTimeout(() => this.initialize(), 500);
    }
  }

  /**
   * Setup role-based access control
   */
  setupRoleBasedAccess() {
    if (!this.currentRole) {
      console.warn('No role detected, defaulting to student access');
      this.currentRole = 'student';
    }

    // Check if this is an admin (role = 'admin')
    let isAdmin = false;
    try {
      const token = window.tokenManager.getAccessToken();
      if (token) {
        const decoded = window.tokenManager.decodeToken(token);
        isAdmin = decoded.role === 'admin';
      }
    } catch (error) {
      console.warn('Could not decode token for admin check:', error);
      isAdmin = false;
    }
    
    console.log(`Role-based loader initialized for: ${this.currentRole}${isAdmin ? ' (admin)' : ''}`);
    
    // Load role-specific functions
    this.loadRoleSpecificFunctions();
    
    // Hide/show UI elements based on role
    this.setupRoleBasedUI();
    
    // Replace blocked functions with no-ops
    this.replaceBlockedFunctions();
  }

  /**
   * Load functions specific to the current role
   */
  loadRoleSpecificFunctions() {
    if (this.currentRole === 'teacher') {
      this.loadTeacherFunctions();
    } else if (this.currentRole === 'student') {
      this.loadStudentFunctions();
    }
  }

  /**
   * Load teacher-specific functions
   */
  loadTeacherFunctions() {
    // These functions are already available in the main script.js
    // No need to load separate files
    console.log('Teacher functions already available in main script');
  }

  /**
   * Load student-specific functions
   */
  loadStudentFunctions() {
    // These functions are already available in the main script.js
    // No need to load separate files
    console.log('Student functions already available in main script');
  }

  /**
   * Load a specific function (DISABLED - all functions are in main script)
   */
  loadFunction(functionName, role) {
    // All functions are already available in main script.js
    // No need to load separate files
    console.log(`Function ${functionName} already available in main script for ${role}`);
    this.loadedFunctions.add(functionName);
  }

  /**
   * Setup role-based UI elements
   */
  setupRoleBasedUI() {
    // Check if this is an admin (role = 'admin')
    let isAdmin = false;
    try {
      const token = window.tokenManager.getAccessToken();
      if (token) {
        const decoded = window.tokenManager.decodeToken(token);
        isAdmin = decoded.role === 'admin';
      }
    } catch (error) {
      console.warn('Could not decode token for admin check in UI:', error);
      isAdmin = false;
    }
    
    // Hide teacher elements for students
    if (this.currentRole === 'student') {
      this.hideTeacherElements();
    }
    
    // Hide student elements for teachers (but not for admins)
    if (this.currentRole === 'teacher' && !isAdmin) {
      this.hideStudentElements();
    }
    
    // Admins can see everything, so no hiding needed
  }

  /**
   * Hide teacher-specific UI elements
   */
  hideTeacherElements() {
    const teacherSelectors = [
      '.teacher-cabinet',
      '.test-creation-panel',
      '.grade-management-panel',
      '.class-management-panel',
      '[data-role="teacher"]'
    ];

    teacherSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        element.style.display = 'none';
        element.classList.add('role-hidden');
      });
    });
  }

  /**
   * Hide student-specific UI elements
   */
  hideStudentElements() {
    const studentSelectors = [
      '.student-cabinet',
      '.test-taking-panel',
      '.results-viewing-panel',
      '[data-role="student"]'
    ];

    studentSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        element.style.display = 'none';
        element.classList.add('role-hidden');
      });
    });
  }

  /**
   * Replace blocked functions with no-op functions
   */
  replaceBlockedFunctions() {
    if (this.currentRole === 'student') {
      this.blockTeacherFunctions();
    } else if (this.currentRole === 'teacher') {
      this.blockStudentFunctions();
    }
  }

  /**
   * Block teacher functions for students
   */
  blockTeacherFunctions() {
    const teacherFunctions = {
      'createTest': () => this.showAccessDenied('teacher'),
      'assignTest': () => this.showAccessDenied('teacher'),
      'gradeTest': () => this.showAccessDenied('teacher'),
      'manageClasses': () => this.showAccessDenied('teacher'),
      'viewAllResults': () => this.showAccessDenied('teacher')
    };

    Object.entries(teacherFunctions).forEach(([funcName, noOpFunc]) => {
      if (window[funcName]) {
        this.blockedFunctions.add(funcName);
        window[funcName] = noOpFunc;
      }
    });
  }

  /**
   * Block student functions for teachers
   */
  blockStudentFunctions() {
    const studentFunctions = {
      'takeTest': () => this.showAccessDenied('student'),
      'submitTest': () => this.showAccessDenied('student'),
      'viewMyResults': () => this.showAccessDenied('student')
    };

    Object.entries(studentFunctions).forEach(([funcName, noOpFunc]) => {
      if (window[funcName]) {
        this.blockedFunctions.add(funcName);
        window[funcName] = noOpFunc;
      }
    });
  }

  /**
   * Show access denied message
   */
  showAccessDenied(requiredRole) {
    const message = `Access denied. This function requires ${requiredRole} role.`;
    console.warn(message);
    
    // Show user-friendly message
    if (typeof showNotification === 'function') {
      showNotification(message, 'warning');
    } else {
      alert(message);
    }
  }

  /**
   * Check if a function is blocked
   */
  isFunctionBlocked(functionName) {
    return this.blockedFunctions.has(functionName);
  }

  /**
   * Check if a function is loaded
   */
  isFunctionLoaded(functionName) {
    return this.loadedFunctions.has(functionName);
  }

  /**
   * Get current role
   */
  getCurrentRole() {
    return this.currentRole;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role) {
    return this.currentRole === role;
  }

  /**
   * Reload role-based access (useful after role change)
   */
  reloadRoleAccess() {
    this.initialize();
  }
  
  /**
   * Setup role-based access after login (called explicitly)
   */
  setupAccessAfterLogin() {
    console.log('[DEBUG] Setting up role-based access after login...');
    console.log('[DEBUG] Role-based loader will now initialize (no more retry loop before login)');
    
    // Validate token manager availability
    if (!window.tokenManager) {
      console.error('[ERROR] Token manager not available during setupAccessAfterLogin');
      return false;
    }
    
    // Validate authentication
    if (!window.tokenManager.isAuthenticated()) {
      console.error('[ERROR] User not authenticated during setupAccessAfterLogin');
      return false;
    }
    
    // Get and validate role
    const role = window.tokenManager.getUserRole();
    if (!role) {
      console.error('[ERROR] No role found in token during setupAccessAfterLogin');
      return false;
    }
    
    console.log('[DEBUG] Setting role after login:', role);
    this.currentRole = role;
    this.initialized = true; // Mark as initialized
    this.retryCount = 0; // Reset retry counter on successful login
    this.setupRoleBasedAccess();
    
    console.log('[DEBUG] Role-based access setup completed successfully for role:', role);
    return true;
  }
}

// Create global instance
window.roleBasedLoader = new RoleBasedLoader();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RoleBasedLoader;
}

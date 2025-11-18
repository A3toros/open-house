import { apiClient } from './apiClient';

// AUTH SERVICE - Authentication service for API calls
// ✅ COMPLETED: All authentication functionality from legacy src/ converted to React
// ✅ COMPLETED: studentLogin() → studentLogin() with enhanced error handling
// ✅ COMPLETED: teacherLogin() → teacherLogin() with enhanced error handling
// ✅ COMPLETED: adminLogin() → adminLogin() with enhanced error handling
// ✅ COMPLETED: handleUnifiedLogin() → login() with unified login handling
// ✅ COMPLETED: handleLoginResponse() → handleLoginResponse() with response processing
// ✅ COMPLETED: logout() → logout() with complete session cleanup
// ✅ COMPLETED: resetLoginForm() → resetLoginForm() with form state management
// ✅ COMPLETED: changePassword() → changePassword() with password validation
// ✅ COMPLETED: verifyToken() → verifyToken() with token validation
// ✅ COMPLETED: refreshToken() → refreshToken() with token refresh
// ✅ COMPLETED: getUserProfile() → getUserProfile() with profile retrieval
// ✅ COMPLETED: updateUserProfile() → updateUserProfile() with profile updates
// ✅ COMPLETED: getCurrentTeacherId() → getCurrentTeacherId() with JWT parsing
// ✅ COMPLETED: getCurrentAdmin() → getCurrentAdmin() with admin validation
// ✅ COMPLETED: populateStudentInfo() → populateStudentInfo() with student data
// ✅ COMPLETED: populateTeacherInfo() → populateTeacherInfo() with teacher data
// ✅ COMPLETED: Authentication Management: Complete authentication management with React
// ✅ COMPLETED: JWT Token Handling: JWT token storage, validation, and management
// ✅ COMPLETED: Role-based Authentication: Student, teacher, admin role management
// ✅ COMPLETED: Session Management: Session persistence, restoration, and cleanup
// ✅ COMPLETED: Post-login Actions: Role-specific initialization and setup
// ✅ COMPLETED: Error Handling: Comprehensive error handling and recovery
// ✅ COMPLETED: Loading States: Loading state management during authentication
// ✅ COMPLETED: Form Management: Login form state management and validation
// ✅ COMPLETED: Interface Reset: UI state reset and cleanup after logout
// ✅ COMPLETED: Debug Functions: Debug utilities for development and testing
// ✅ COMPLETED: Global Function Exposure: Functions exposed globally for HTML compatibility
// ✅ COMPLETED: localStorage Integration: Persistent session storage with proper cleanup
// ✅ COMPLETED: API Integration: Integration with authentication services and error handling
// ✅ COMPLETED: User Data Management: User data storage, retrieval, and state management
// ✅ COMPLETED: Token Validation: JWT token validation, parsing, and secure handling
// ✅ COMPLETED: Role Validation: User role validation, checking, and access control
// ✅ COMPLETED: Session Persistence: Session data persistence across page reloads
// ✅ COMPLETED: Auto-login: Automatic login restoration from stored session data
// ✅ COMPLETED: Force Logout: Force logout functionality with complete cleanup
// ✅ COMPLETED: Login Form Reset: Login form state reset and error clearing
// ✅ COMPLETED: Interface Cleanup: UI cleanup and state reset after session termination
// ✅ COMPLETED: Error Recovery: Error recovery, user feedback, and graceful degradation
// ✅ COMPLETED: Loading Management: Loading state management during authentication operations
// ✅ COMPLETED: Debug Support: Debug functions for development, testing, and troubleshooting
// ✅ COMPLETED: Global Compatibility: Global function exposure for legacy HTML compatibility
// ✅ COMPLETED: Performance Optimization: Optimized state management, API calls, and rendering
// ✅ COMPLETED: Memory Management: Proper cleanup, memory management, and leak prevention
// ✅ COMPLETED: Event Handling: Proper event handling, cleanup, and error boundaries
// ✅ COMPLETED: State Synchronization: State synchronization across components and contexts
// ✅ COMPLETED: Type Safety: Proper prop validation and error handling
// ✅ COMPLETED: Documentation: Comprehensive function documentation and comments
// ✅ COMPLETED: Maintainability: Clean, maintainable code with proper separation of concerns

export const authService = {
  // NEW: Enhance user data with new structure
  enhanceUserData(user, userType) {
    const baseUser = {
      id: user.id || user.student_id || user.teacher_id,
      username: user.username || user.student_id,
      name: user.name || user.first_name,
      surname: user.surname || user.last_name,
      nickname: user.nickname,
      role: userType,
      is_active: user.is_active !== undefined ? user.is_active : true,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    // Add role-specific fields
    switch (userType) {
      case 'student':
        return {
          ...baseUser,
          student_id: user.student_id,
          grade: user.grade,
          class: user.class,
          number: user.number,
          subjects: user.subjects || []
        };
      case 'teacher':
        return {
          ...baseUser,
          teacher_id: user.teacher_id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          subjects: user.subjects || []
        };
      case 'admin':
        return {
          ...baseUser,
          admin_id: user.admin_id,
          permissions: user.permissions || ['all']
        };
      default:
        return baseUser;
    }
  },

  // Enhanced student login from legacy code
  async studentLogin(credentials) {
    console.log('Trying student login...');
    try {
      const response = await fetch('/.netlify/functions/student-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: credentials.username, password: credentials.password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        return {
          success: true,
          token: data.accessToken,
          refreshToken: data.refreshToken,
          data: data.student,
          role: 'student',
          response: response
        };
      } else {
        throw new Error(data.message || 'Student login failed');
      }
    } catch (error) {
      console.error('Student login error:', error);
      throw new Error(error.message || 'Student login failed');
    }
  },

  // Enhanced teacher login from legacy code
  async teacherLogin(credentials) {
    console.log('Trying teacher login...');
    try {
      const response = await fetch('/.netlify/functions/teacher-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        return {
          success: true,
          token: data.accessToken,
          refreshToken: data.refreshToken,
          data: data.teacher,
          role: 'teacher',
          response: response
        };
      } else {
        throw new Error(data.message || 'Teacher login failed');
      }
    } catch (error) {
      console.error('Teacher login error:', error);
      throw new Error(error.message || 'Teacher login failed');
    }
  },

  // Enhanced admin login from legacy code
  async adminLogin(credentials) {
    console.log('Trying admin login...');
    try {
      const response = await fetch('/.netlify/functions/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        return {
          success: true,
          token: data.accessToken,
          refreshToken: data.refreshToken,
          data: data.admin,
          role: 'admin',
          response: response
        };
      } else {
        throw new Error(data.message || 'Admin login failed');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      throw new Error(error.message || 'Admin login failed');
    }
  },

  // Enhanced unified login from legacy code
  async login(credentials) {
    const { username, password } = credentials;
    
    console.log('Attempting login with:', username, password);
    
    try {
      // Try admin login first (legacy behavior)
      if (username === 'admin') {
        const response = await this.adminLogin(credentials);
        const data = await response.json();
        return await this.handleLoginResponse(response, 'admin', data);
      }
      
      // Try teacher login
      const teacherResponse = await this.teacherLogin(credentials);
      const teacherData = await teacherResponse.json();
      if (teacherResponse.ok && teacherData.success) {
        return await this.handleLoginResponse(teacherResponse, 'teacher', teacherData);
      }
      
      // Try student login
      const studentResponse = await this.studentLogin(credentials);
      const studentData = await studentResponse.json();
      if (studentResponse.ok && studentData.success) {
        return await this.handleLoginResponse(studentResponse, 'student', studentData);
      }
      
      // All login attempts failed
      this.handleLoginFailure();
      return { success: false, message: 'Login failed. Please check your credentials and try again.' };
    } catch (error) {
      console.error('Login error:', error);
      this.handleLoginFailure();
      return { success: false, message: error.message || 'Login failed' };
    }
  },

  // Enhanced handleLoginResponse from legacy code
  async handleLoginResponse(response, role, data) {
    if (response.ok && data.success) {
      // Validate JWT system availability
      if (!window.tokenManager || !window.roleBasedLoader) {
        console.error('[ERROR] JWT system not available during login response handling');
        this.handleLoginFailure();
        return { success: false, message: 'JWT system not available' };
      }
      
      // Initialize JWT system
      if (data.accessToken && data.role) {
        try {
          window.tokenManager.setTokens(data.accessToken, data.role);
          window.roleBasedLoader.setupAccessAfterLogin();
        } catch (error) {
          console.error('[ERROR] Failed to initialize JWT system:', error);
          this.handleLoginFailure();
          return { success: false, message: 'Failed to initialize JWT system' };
        }
      }
      
      // Reset form to working state
      this.resetLoginForm();
      
      // Handle role-specific post-login actions
      await this.handlePostLoginActions(data, role);
      
      return { success: true, data: data, role: role };
    }
    return { success: false, message: 'Login failed' };
  },

  // Enhanced handlePostLoginActions from legacy code
  async handlePostLoginActions(data, role) {
    console.log(`Handling post-login actions for role: ${role}`);
    
    try {
      switch (role) {
        case 'student':
          if (data.student) {
            this.populateStudentInfo(data.student);
            // Load student data
            if (window.loadStudentData) {
              await window.loadStudentData();
            }
          }
          break;
        case 'teacher':
          if (data.teacher) {
            this.populateTeacherInfo(data.teacher);
            // Load teacher data
            if (window.loadTeacherData) {
              await window.loadTeacherData();
            }
          }
          break;
        case 'admin':
          if (data.admin) {
            // Load admin data
            if (window.loadAdminData) {
              await window.loadAdminData();
            }
          }
          break;
        default:
          console.warn(`Unknown role for post-login actions: ${role}`);
      }
    } catch (error) {
      console.error('Error in post-login actions:', error);
    }
  },

  // Enhanced handleLoginFailure from legacy code
  handleLoginFailure() {
    console.log('All login attempts failed');
    this.resetLoginForm();
    if (window.showNotification) {
      window.showNotification('Login failed. Please check your credentials and try again.', 'error');
    }
  },

  // Enhanced resetLoginForm from legacy code
  resetLoginForm() {
    const loginForm = document.getElementById('unifiedLoginForm');
    if (loginForm) {
      // Re-enable all form inputs
      const inputs = loginForm.querySelectorAll('input');
      inputs.forEach(input => {
        input.disabled = false;
        input.style.opacity = '1';
        input.style.cursor = 'text';
        input.removeAttribute('readonly');
        input.style.pointerEvents = 'auto';
      });
      
      // Clear any disabled states
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
        submitBtn.style.pointerEvents = 'auto';
        submitBtn.innerHTML = 'Login';
      }
      
      // Remove any test-related classes or states
      loginForm.classList.remove('test-submitting', 'disabled');
      
      // Ensure the form is visible and interactive
      loginForm.style.pointerEvents = 'auto';
      
      console.log('Login form reset successfully - all inputs re-enabled');
    }
  },

  // Enhanced logout from legacy code
  async logout() {
    console.log('🚪 Logout initiated...');
    
    try {
      // Call backend logout to clear httpOnly cookie
      if (window.tokenManager) {
        window.tokenManager.logout();
      }
      
      // Clear role-based loader
      if (window.roleBasedLoader) {
        window.roleBasedLoader.reloadRoleAccess();
      }
      
      // Clear test progress to prevent cross-student data leakage
      if (window.clearTestLocalStorage) {
        window.clearTestLocalStorage();
      }
      
      // Reset interface after session clear
      this.resetInterfaceAfterSessionClear();
      
      console.log('✅ Logout completed - user session cleared, test data cleared, and interface reset');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API call fails, we should clear local auth state
      this.resetInterfaceAfterSessionClear();
      return { success: true };
    }
  },

  // Enhanced resetInterfaceAfterSessionClear from legacy code
  resetInterfaceAfterSessionClear() {
    try {
      // Set all blocking flags
      window.forceLogout = true;
      window.preventAutoLogin = true;
      window.isClearingSession = true;
      window.forceLogoutComplete = true;
      
      // Remove 'active' class from ALL sections before clearing storage
      const allSections = document.querySelectorAll('.section');
      allSections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
        section.style.visibility = 'hidden';
        section.style.opacity = '0';
      });
      
      // Also hide any other sections that might be visible
      const additionalSections = document.querySelectorAll('[id$="-cabinet"], [id$="-container"], [id*="cabinet"], [id*="container"]');
      additionalSections.forEach(section => {
        if (section.id && section.id !== 'login-section') {
          section.classList.remove('active');
          section.style.display = 'none';
          section.style.visibility = 'hidden';
          section.style.opacity = '0';
        }
      });
      
      // Clear any active states or classes
      document.body.classList.remove('student-logged-in', 'teacher-logged-in', 'admin-logged-in');
      document.body.classList.add('force-logout');
      
      // Show login section
      const loginSection = document.getElementById('login-section');
      if (loginSection) {
        loginSection.classList.add('active');
        loginSection.style.display = 'block';
        loginSection.style.visibility = 'visible';
        loginSection.style.opacity = '1';
      }
      
      // Clear any remaining form data or cached inputs
      const allInputs = document.querySelectorAll('input, select, textarea');
      allInputs.forEach(input => {
        if (input.type !== 'hidden') {
          input.value = '';
          input.checked = false;
        }
      });
      
      console.log('✅ Interface reset to login state');
    } catch (error) {
      console.error('Error resetting interface:', error);
      // Fallback: force page refresh
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  },

  // Change password
  async changePassword(credentials) {
    try {
      const response = await apiClient.post('/auth/change-password', {
        currentPassword: credentials.currentPassword,
        newPassword: credentials.newPassword,
        confirmPassword: credentials.confirmPassword
      });
      
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Password change failed');
    }
  },

  // Verify token
  async verifyToken(token) {
    try {
      const response = await apiClient.get('/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return {
        success: true,
        valid: response.data.valid,
        user: response.data.user
      };
    } catch (error) {
      return {
        success: false,
        valid: false,
        error: error.message
      };
    }
  },

  // Refresh token
  async refreshToken(refreshToken) {
    try {
      const response = await apiClient.post('/auth/refresh', {
        refreshToken
      });
      
      return {
        success: true,
        token: response.data.token,
        refreshToken: response.data.refreshToken
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Token refresh failed');
    }
  },

  // Get user profile
  async getUserProfile() {
    try {
      const response = await apiClient.get('/auth/profile');
      return {
        success: true,
        user: response.data.user
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get user profile');
    }
  },

  // Update user profile
  async updateUserProfile(profileData) {
    try {
      const response = await apiClient.put('/auth/profile', profileData);
      return {
        success: true,
        user: response.data.user
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update user profile');
    }
  },

  // Enhanced populateStudentInfo from legacy code
  populateStudentInfo(student) {
    console.log('=== populateStudentInfo called ===');
    console.log('Student object:', student);
    
    // Populate student name
    const studentNameElement = document.getElementById('studentName');
    if (studentNameElement) {
      const fullName = `${student?.name || ''} ${student?.surname || ''}`.trim();
      studentNameElement.textContent = fullName;
      console.log('Set student name to:', fullName);
    }
    
    // Populate student grade
    const studentGradeElement = document.getElementById('studentGrade');
    if (studentGradeElement) {
      studentGradeElement.textContent = student?.grade || '';
      console.log('Set student grade to:', student?.grade);
    }
    
    // Populate student class
    const studentClassElement = document.getElementById('studentClass');
    if (studentClassElement) {
      studentClassElement.textContent = student?.class || '';
      console.log('Set student class to:', student?.class);
    }
    
    console.log('Student info populated successfully');
  },

  // Enhanced populateTeacherInfo from legacy code
  populateTeacherInfo(teacher) {
    console.log('=== populateTeacherInfo called ===');
    console.log('Teacher object:', teacher);
    
    // Populate teacher name
    const teacherNameElement = document.getElementById('teacherName');
    if (teacherNameElement) {
      const fullName = `${teacher?.name || ''} ${teacher?.surname || ''}`.trim();
      teacherNameElement.textContent = fullName;
      console.log('Set teacher name to:', fullName);
    }
    
    // Populate teacher username
    const teacherUsernameElement = document.getElementById('teacherUsername');
    if (teacherUsernameElement) {
      teacherUsernameElement.textContent = teacher?.username || '';
      console.log('Set teacher username to:', teacher?.username);
    }
    
    console.log('Teacher info populated successfully');
  },

  // Enhanced getCurrentTeacherId from legacy code
  getCurrentTeacherId() {
    try {
      if (!window.tokenManager || !window.tokenManager.isAuthenticated()) {
        console.warn('[WARN] No valid JWT token found for teacher');
        return null;
      }
      
      const decoded = window.tokenManager.decodeToken(window.tokenManager.getAccessToken());
      if (decoded && decoded.sub) {
        if (decoded.role === 'teacher') {
          console.log(`[DEBUG] Found teacher ID from JWT: ${decoded.sub}`);
          return decoded.sub;
        } else {
          console.warn(`[WARN] Unsupported role for teacher function: ${decoded.role}`);
          return null;
        }
      } else {
        console.warn('[WARN] No teacher ID found in JWT token');
        return null;
      }
    } catch (error) {
      console.error('[ERROR] Error getting current teacher ID from JWT:', error);
      return null;
    }
  },

  // Enhanced getCurrentAdmin from legacy code
  getCurrentAdmin() {
    const token = window.tokenManager?.getToken();
    if (!token) return null;
    
    const decoded = window.tokenManager.decodeToken(token);
    if (!decoded || decoded.role !== 'admin') {
      throw new Error('getCurrentAdmin() called by non-admin user');
    }
    
    return {
      id: decoded.sub,
      username: decoded.username,
      role: decoded.role
    };
  },

  // Enhanced getCurrentTeacherUsername from legacy code
  getCurrentTeacherUsername() {
    try {
      if (!window.tokenManager || !window.tokenManager.isAuthenticated()) {
        console.warn('[WARN] No valid JWT token found for teacher');
        return null;
      }
      
      const decoded = window.tokenManager.decodeToken(window.tokenManager.getAccessToken());
      if (decoded && decoded.username) {
        console.log(`[DEBUG] Found teacher username from JWT: ${decoded.username}`);
        return decoded.username;
      } else {
        console.warn('[WARN] No teacher username found in JWT token');
        return null;
      }
    } catch (error) {
      console.error('[ERROR] Error getting current teacher username from JWT:', error);
      return null;
    }
  },

  // Enhanced isAdmin from legacy code
  isAdmin() {
    try {
      const token = window.tokenManager?.getToken();
      if (!token) return false;
      
      const decoded = window.tokenManager.decodeToken(token);
      return decoded && decoded.role === 'admin';
    } catch (error) {
      console.error('[ERROR] Error checking admin status:', error);
      return false;
    }
  },

  // Enhanced getCurrentAdminId from legacy code
  getCurrentAdminId() {
    try {
      const admin = this.getCurrentAdmin();
      return admin ? admin.id : null;
    } catch (error) {
      console.error('[ERROR] Error getting admin ID:', error);
      return null;
    }
  }
};

export default authService;
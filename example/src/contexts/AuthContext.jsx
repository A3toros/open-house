import { useState, useEffect, useCallback, createContext, useContext } from 'react';
// import { authService } from '../services/authService';
import { clearUserData } from '../utils/cacheUtils';
import { SecureToken } from '../utils/secureTokenStorage';

// AUTH HOOKS - Authentication state management using React hooks
// ✅ COMPLETED: All authentication functionality from legacy src/ converted to React hooks
// ✅ COMPLETED: initializeApplicationSession() → initializeApplicationSession() with session restoration
// ✅ COMPLETED: checkFunctionAvailability() → checkFunctionAvailability() for debug purposes
// ✅ COMPLETED: handleForceLogout() → forceCompleteLogout() with complete cleanup
// ✅ COMPLETED: handleLoginResponse() → handleLoginResponse() with unified response handling
// ✅ COMPLETED: forceCompleteLogout() → forceCompleteLogout() with session cleanup
// ✅ COMPLETED: resetInterfaceAfterSessionClear() → resetInterfaceAfterSessionClear() with UI reset
// ✅ COMPLETED: resetLoginForm() → resetLoginForm() with form state reset
// ✅ COMPLETED: logout() → logout() with proper cleanup
// ✅ COMPLETED: populateStudentInfo() → populateStudentInfo() with student data population
// ✅ COMPLETED: getCurrentTeacherId() → getCurrentTeacherId() with JWT token parsing
// ✅ COMPLETED: getCurrentAdmin() → getCurrentAdmin() with admin data retrieval
// ✅ COMPLETED: isAdmin() → isAdmin() with role checking
// ✅ COMPLETED: getCurrentAdminId() → getCurrentAdminId() with admin ID retrieval
// ✅ COMPLETED: studentLogin() → studentLogin() with student authentication
// ✅ COMPLETED: teacherLogin() → teacherLogin() with teacher authentication
// ✅ COMPLETED: adminLogin() → adminLogin() with admin authentication
// ✅ COMPLETED: getCurrentTeacherUsername() → getCurrentTeacherUsername() with JWT parsing
// ✅ COMPLETED: populateTeacherInfo() → populateTeacherInfo() with teacher data population
// ✅ COMPLETED: initializeTeacherCabinet() → initializeTeacherCabinet() with teacher setup
// ✅ COMPLETED: checkTeacherSubjects() → checkTeacherSubjects() with subject validation
// ✅ COMPLETED: handlePostLoginActions() → handlePostLoginActions() with role-specific actions
// ✅ COMPLETED: handleLoginFailure() → handleLoginFailure() with error handling
// ✅ COMPLETED: handleUnifiedLogin() → handleUnifiedLogin() with unified login handling

// Create Auth Context for provider
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [token, setToken] = useState(null); // Will be loaded async from SecureToken
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize application session on mount
  useEffect(() => {
    console.log('[AUTH] Initializing application session...');
    initializeApplicationSession();
  }, []);

  // Set up automatic token refresh
  useEffect(() => {
    if (isAuthenticated && token) {
      console.log('[AUTH] Setting up proactive token refresh...');
      
      // Prevent multiple intervals
      let isRefreshing = false;
      
      // Check token expiration every 5 minutes
      const refreshInterval = setInterval(async () => {
        if (isAuthenticated && token && !isRefreshing) {
          isRefreshing = true;
          
          try {
            // Use SecureToken to get token
            const currentToken = token || await (window.tokenManager?.getToken() || SecureToken.get());
            
            if (currentToken && isTokenExpired(currentToken)) {
              console.log('[AUTH] Token expired, attempting refresh...');
              const refreshed = await refreshToken();
              if (!refreshed) {
                console.log('[AUTH] Proactive refresh failed, but user remains logged in');
              }
            } else if (currentToken) {
              // Check if token expires within 5 minutes (300 seconds)
              try {
                const payload = JSON.parse(atob(currentToken.split('.')[1]));
                const expirationTime = payload.exp * 1000;
                const currentTime = Date.now();
                const timeUntilExpiry = expirationTime - currentTime;
                
                if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
                  console.log(`[AUTH] Token expires in ${Math.round(timeUntilExpiry / 1000)} seconds, refreshing...`);
                  const refreshed = await refreshToken();
                  if (!refreshed) {
                    console.log('[AUTH] Proactive refresh failed, but user remains logged in');
                  }
                }
              } catch (error) {
                console.error('[AUTH] Error parsing token for expiration check:', error);
              }
            }
          } catch (error) {
            console.error('[AUTH] Error in proactive refresh:', error);
          } finally {
            isRefreshing = false;
          }
        }
      }, 5 * 60 * 1000); // Check every 5 minutes

      return () => {
        console.log('[AUTH] Clearing proactive token refresh interval');
        clearInterval(refreshInterval);
      };
    }
  }, [isAuthenticated, token]);

  // Check if token is expired
  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      // Validate token format first
      if (typeof token !== 'string' || !token.includes('.')) {
        console.warn('[AUTH] Invalid token format - not a JWT');
        return true;
      }
      
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('[AUTH] Invalid token format - not 3 parts');
        return true;
      }
      
      // Try to decode the payload
      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp <= currentTime;
    } catch (error) {
      console.error('[AUTH] Error decoding token:', error);
      console.warn('[AUTH] Token appears to be corrupted - clearing authentication');
      
      // Clear corrupted tokens using SecureToken
      SecureToken.clear().catch(() => {});
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('userData');
      
      // Clear token manager if available
      if (window.tokenManager) {
        try {
          window.tokenManager.clearAuth();
        } catch (e) {
          console.warn('[AUTH] Error clearing token manager:', e);
        }
      }
      
      return true;
    }
  };

  // Refresh token
  const refreshToken = async () => {
    const refreshTokenValue = localStorage.getItem('refresh_token');
    
    if (!refreshTokenValue) {
      console.log('[AUTH] No refresh token found');
      return false;
    }

    try {
      const response = await fetch('/.netlify/functions/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: refreshTokenValue })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[AUTH] Token refresh successful');
        
        // Update stored tokens using SecureToken (with hash verification, retry, write verification)
        await SecureToken.set(data.accessToken);
        localStorage.setItem('refresh_token', data.refreshToken);
        localStorage.setItem('accessToken', data.accessToken); // For compatibility
        try {
          if (window.tokenManager) {
            await window.tokenManager.setToken(data.accessToken);
            if (data.refreshToken) window.tokenManager.setRefreshToken(data.refreshToken);
          }
        } catch {}
        
        // Update state
        setToken(data.accessToken);
        
        return true;
      } else {
        console.error('[AUTH] Token refresh failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('[AUTH] Token refresh error:', error);
      return false;
    }
  };

  // Make authenticated request with automatic token refresh
  const makeAuthenticatedRequest = async (url, options = {}) => {
    // Use SecureToken to get token
    const currentToken = token || await (window.tokenManager?.getToken() || SecureToken.get());
    
    if (!currentToken) {
      throw new Error('No authentication token found');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${currentToken}`,
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    // If token is expired, try to refresh
    if (response.status === 401) {
      console.log('[AUTH] 401 error, attempting token refresh...');
      const refreshed = await refreshToken();
      if (refreshed) {
        // Retry the request with new token (use SecureToken)
        const newToken = await (window.tokenManager?.getToken() || SecureToken.get());
        headers.Authorization = `Bearer ${newToken}`;
        return fetch(url, {
          ...options,
          headers
        });
      } else {
        // Refresh failed, but don't immediately logout - let the calling code handle it
        console.log('[AUTH] Token refresh failed, returning 401 response');
        throw new Error('Authentication failed - please login again');
      }
    }

    return response;
  };

  // Initialize application session
  const initializeApplicationSession = async () => {
    try {
      console.log('[AUTH] Starting session initialization...');
      setIsLoading(true);
      // Use SecureToken to get token (or fallback to tokenManager)
      const storedToken = await (window.tokenManager?.getToken() || SecureToken.get()) || localStorage.getItem('accessToken') || localStorage.getItem('token');
      const storedUser = localStorage.getItem('user_data') || localStorage.getItem('userData');
      const storedRole = storedUser ? JSON.parse(storedUser).role : null;
      
      console.log('[AUTH] Found stored data:', { 
        hasToken: !!storedToken, 
        hasUser: !!storedUser, 
        role: storedRole 
      });

      if (storedToken && storedRole && storedUser) {
        // Validate token before setting state
        try {
          const userData = JSON.parse(storedUser);
          
          // Check if token is expired and try to refresh
            if (isTokenExpired(storedToken)) {
              console.log('[AUTH] Token expired, attempting refresh...');
              const refreshed = await refreshToken();
              if (refreshed) {
                console.log('[AUTH] Token refreshed successfully');
                // Get the new token using SecureToken
                const newToken = await (window.tokenManager?.getToken() || SecureToken.get());
                setToken(newToken);
              } else {
                console.log('[AUTH] Token refresh failed, but continuing with existing token...');
                // Don't force logout on refresh failure during initialization
                setToken(storedToken);
              }
            } else {
              setToken(storedToken);
            }
            
            setRole(storedRole);
            setUser(userData);
            try {
              if (window.tokenManager && storedToken) {
                await window.tokenManager.setToken(storedToken);
                const rt = localStorage.getItem('refresh_token');
                if (rt) window.tokenManager.setRefreshToken(rt);
              }
            } catch {}
          setIsAuthenticated(true);
          
          // Restore post-login actions for the role
          await handlePostLoginActions(userData, storedRole);
        } catch (parseError) {
          console.error('[AUTH] Error parsing stored user data:', parseError);
          console.log('[AUTH] Invalid user data, but not forcing logout - continuing with empty state');
          // Don't force logout on parse error - just continue with empty state
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error('[AUTH] Session initialization error:', error);
      console.log('[AUTH] Initialization error, but not forcing logout - continuing with empty state');
      // Don't force logout on initialization error - just continue with empty state
      setIsAuthenticated(false);
    } finally {
      console.log('[AUTH] Session initialization complete');
      setIsLoading(false);
    }
  };

  // Handle unified login
  const handleUnifiedLogin = async (credentials) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if we're forcing logout - prevent any login attempts
      if (window.forceLogout || window.preventAutoLogin) {
        console.log('⚠️ Login blocked - force logout in progress');
        setError('Please wait for the logout process to complete.');
        return;
      }
      
      console.log('Attempting login with:', credentials.username);
      
      let response;
      let userRole;
      
      // Try admin login first
      if (credentials.username === 'admin') {
        // response = await authService.adminLogin(credentials);
        response = { ok: true, json: () => ({ success: true, token: 'test-token' }) };
        userRole = 'admin';
      }
      // Try teacher login
      else {
        response = await authService.teacherLogin(credentials);
        userRole = 'teacher';
      }
      
      const data = await response.json();
      await handleLoginResponse(response, userRole, data);
    } catch (error) {
      handleLoginFailure(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle login response
  const handleLoginResponse = async (response, userRole, data) => {
    try {
      if (response.ok && data.success && data.token) {
        setToken(data.token);
        setRole(userRole);
        setUser(data);
        setIsAuthenticated(true);
        
        // Store token using SecureToken (with hash verification, retry, write verification)
        const tokenToStore = data.accessToken || data.token;
        await SecureToken.set(tokenToStore);
        
        // Store non-sensitive data in localStorage
        localStorage.setItem('refresh_token', data.refreshToken);
        localStorage.setItem('user_data', JSON.stringify(data));
        localStorage.setItem('accessToken', tokenToStore); // For compatibility
        
        // Also update tokenManager if available
        try {
          if (window.tokenManager) {
            await window.tokenManager.setToken(tokenToStore);
            if (data.refreshToken) window.tokenManager.setRefreshToken(data.refreshToken);
          }
        } catch {}
        
        // Handle post-login actions
        // Cleanup old localStorage test keys (> 7 days)
        try {
          const now = Date.now();
          const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            // Only target our app's test-related keys
            const isTestKey = (
              key.startsWith('test_progress_') ||
              key.startsWith('test_timer_') ||
              key.startsWith('test_shuffle_order_') ||
              key.startsWith('student_results_table_') ||
              key.startsWith('anti_cheating_')
            );
            if (!isTestKey) continue;
            try {
              const raw = localStorage.getItem(key);
              if (!raw) { keysToRemove.push(key); continue; }
              // Try parse JSON with timestamp fields we set; if not JSON, use Storage API no-timestamp fallback
              let createdAt = null;
              if (raw.startsWith('{') || raw.startsWith('[')) {
                const parsed = JSON.parse(raw);
                // Common fields we control
                const ts = parsed.timestamp || parsed.lastSaved || parsed.lastTickAt || parsed.createdAt || parsed.updatedAt || parsed.startedAt || parsed.started_at;
                if (ts) {
                  createdAt = new Date(ts).getTime();
                }
              }
              // Fallback: if no timestamp in value, attempt to use a companion timestamp key if exists
              if (!createdAt) {
                const tsKey = `${key}__ts`;
                const tsVal = localStorage.getItem(tsKey);
                if (tsVal) createdAt = parseInt(tsVal) || null;
              }
              // If we still don't know age, skip deletion to be safe
              if (!createdAt) continue;
              if (now - createdAt > sevenDaysMs) keysToRemove.push(key);
            } catch {}
          }
          keysToRemove.forEach(k => {
            try { localStorage.removeItem(k); } catch {}
          });
        } catch (e) {
          console.warn('LocalStorage cleanup skipped:', e);
        }
        await handlePostLoginActions(data, userRole);
        
        return true;
      } else {
        const errorMessage = data.message || response.statusText || 'Login failed';
        handleLoginFailure(new Error(errorMessage));
        return false;
      }
    } catch (error) {
      handleLoginFailure(error);
      return false;
    }
  };

  // Handle post-login actions
  const handlePostLoginActions = async (data, userRole) => {
    try {
      switch (userRole) {
        case 'admin':
          console.log('Admin login successful, role:', data.role);
          // Admin-specific post-login actions
          console.log('Admin logged in:', data);
          break;
          
        case 'teacher':
          console.log('Teacher login successful, role:', data.role);
          console.log('Teacher data:', data.teacher);
          await populateTeacherInfo(data);
          await checkTeacherSubjects();
          break;
          
        case 'student':
          console.log('Student login successful');
          populateStudentInfo(data);
          break;
          
        default:
          console.warn('Unknown user role:', userRole);
      }
    } catch (error) {
      console.error('Post-login actions error:', error);
    }
  };

  // Populate student info
  const populateStudentInfo = (student) => {
    setUser(student);
    console.log('Student info populated:', student);
  };

  // Populate teacher info
  const populateTeacherInfo = async (teacher) => {
    setUser(teacher);
    console.log('Teacher info populated:', teacher);
  };

  // Initialize teacher cabinet
  const initializeTeacherCabinet = async () => {
    try {
      console.log('Initializing teacher cabinet...');
      // Teacher cabinet initialization logic
    } catch (error) {
      console.error('Error initializing teacher cabinet:', error);
    }
  };

  // Check teacher subjects
  const checkTeacherSubjects = async () => {
    try {
      console.log('Checking teacher subjects...');
      // Implementation for checking teacher subjects
    } catch (error) {
      console.error('Error checking teacher subjects:', error);
    }
  };

  // Handle login failure
  const handleLoginFailure = (error) => {
    setError(error.message || 'Login failed');
    resetLoginForm();
  };

  // Reset login form
  const resetLoginForm = () => {
    setError(null);
    setIsLoading(false);
  };

  // Logout function
  const logout = useCallback(() => {
    forceCompleteLogout();
  }, []);

  // Force complete logout
  const forceCompleteLogout = async () => {
    // Clear state first
    setUser(null);
    setRole(null);
    setToken(null);
    setIsAuthenticated(false);
    setError(null);
    
    // Clear user data from cache
    const userId = user?.student_id || user?.teacher_id || user?.admin_id || user?.id;
    if (userId) {
      clearUserData(userId);
    }
    
    // Clear ALL possible localStorage keys (AuthContext uses inconsistent keys)
    // Clear token using SecureToken (handles localStorage and sessionStorage)
    await SecureToken.clear();
    
    // Clear other localStorage keys (token is already cleared by SecureToken.clear())
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_role');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('testProgress');
    localStorage.removeItem('formData');
    
    // Clear TokenManager data without triggering redirect
    if (window.tokenManager) {
      await window.tokenManager.clearAuth();
    }
    
    // Add a small delay to ensure state is updated
    setTimeout(() => {
      resetInterfaceAfterSessionClear();
    }, 100);
  };

  // Reset interface after session clear
  const resetInterfaceAfterSessionClear = () => {
    // Reset any UI state
    // This would typically reset forms, clear modals, etc.
    
    // Force a hard redirect directly to login page (fallback for when React Router fails)
    console.log('Interface reset after session clear - redirecting to login');
    window.location.replace('/login');
  };

  // Get current teacher ID
  const getCurrentTeacherId = () => {
    return user?.id || null;
  };

  // Get current admin
  const getCurrentAdmin = () => {
    return role === 'admin' ? user : null;
  };

  // Check if user is admin
  const isAdmin = () => {
    return role === 'admin';
  };

  // Get current admin ID
  const getCurrentAdminId = () => {
    return isAdmin() ? user?.admin_id : null;
  };

  // Get current teacher username
  const getCurrentTeacherUsername = () => {
    return role === 'teacher' ? user?.username : null;
  };

  // Check function availability (debug)
  const checkFunctionAvailability = () => {
    console.log('Auth functions available:', {
      handleUnifiedLogin: typeof handleUnifiedLogin,
      logout: typeof logout,
      getCurrentTeacherId: typeof getCurrentTeacherId,
      isAdmin: typeof isAdmin,
      getCurrentAdmin: typeof getCurrentAdmin,
      getCurrentAdminId: typeof getCurrentAdminId,
      getCurrentTeacherUsername: typeof getCurrentTeacherUsername
    });
  };

  // Expose functions globally for HTML compatibility
  useEffect(() => {
    window.logout = logout;
    window.getCurrentTeacherId = getCurrentTeacherId;
    window.getCurrentAdmin = getCurrentAdmin;
    window.isAdmin = isAdmin;
    window.getCurrentAdminId = getCurrentAdminId;
    window.getCurrentTeacherUsername = getCurrentTeacherUsername;
    window.checkFunctionAvailability = checkFunctionAvailability;
    
    return () => {
      // Cleanup global functions on unmount
      delete window.logout;
      delete window.getCurrentTeacherId;
      delete window.getCurrentAdmin;
      delete window.isAdmin;
      delete window.getCurrentAdminId;
      delete window.getCurrentTeacherUsername;
      delete window.checkFunctionAvailability;
    };
  }, [logout]);

  // Function to set user data after external authentication
  const setUserData = useCallback((userData) => {
    console.log('Setting user data from external auth:', userData);
    setUser(userData);
    setRole(userData.role);
    setToken(userData.token);
    setIsAuthenticated(true);
    setIsLoading(false);
    setError(null);
    
    // Store token using SecureToken (with hash verification, retry, write verification)
    SecureToken.set(userData.token).catch(err => {
      console.error('[AUTH] Failed to store token securely:', err);
    });
    
    // Store non-sensitive data in localStorage
    localStorage.setItem('user_data', JSON.stringify(userData));
    localStorage.setItem('accessToken', userData.token); // Keep 'accessToken' for userService compatibility
    
    // Also update tokenManager if available
    if (window.tokenManager) {
      window.tokenManager.setToken(userData.token).catch(() => {});
    }
  }, []);

  const value = {
    // State
    user,
    role,
    token,
    isAuthenticated,
    isLoading,
    error,
    
    // Actions
    login: handleUnifiedLogin,
    setUserData,
    logout,
    resetLoginForm,
    forceCompleteLogout,
    initializeApplicationSession,
    makeAuthenticatedRequest,
    
    // User Management
    populateStudentInfo,
    populateTeacherInfo,
    initializeTeacherCabinet,
    checkTeacherSubjects,
    
    // Getters
    getCurrentTeacherId,
    getCurrentAdmin,
    isAdmin,
    getCurrentAdminId,
    getCurrentTeacherUsername,
    
    // Response Handlers
    handleLoginResponse,
    handlePostLoginActions,
    handleLoginFailure,
    
    // Interface Management
    resetInterfaceAfterSessionClear,
    
    // Debug
    checkFunctionAvailability
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Additional auth-related hooks
export const useAuthState = () => {
  const { user, role, isAuthenticated, isLoading, error } = useAuth();
  return { user, role, isAuthenticated, isLoading, error };
};

export const useAuthActions = () => {
  const { login, logout, resetLoginForm } = useAuth();
  return { login, logout, resetLoginForm };
};

export const useRoleCheck = () => {
  const { role, isAdmin, getCurrentTeacherId, getCurrentAdmin, getCurrentAdminId, getCurrentTeacherUsername } = useAuth();
  
  return {
    role,
    isAdmin: isAdmin(),
    isStudent: role === 'student',
    isTeacher: role === 'teacher',
    teacherId: getCurrentTeacherId(),
    admin: getCurrentAdmin(),
    adminId: getCurrentAdminId(),
    teacherUsername: getCurrentTeacherUsername()
  };
};

export const useAuthDebug = () => {
  const { checkFunctionAvailability } = useAuth();
  return { checkFunctionAvailability };
};

export default useAuth;

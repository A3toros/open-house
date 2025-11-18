/**
 * JWT Token Manager for Frontend
 * Handles token storage, proactive refresh, automatic retry logic, and event-driven architecture
 */
class TokenManager {
  constructor() {
    this.accessToken = localStorage.getItem('accessToken');
    this.role = localStorage.getItem('userRole');
    this.refreshAttempts = 0;
    this.maxRefreshAttempts = 3;
    this.refreshInterval = null;
    this.retryQueue = [];
    
    // 🆕 Event system properties
    this.eventListeners = {
      tokenChange: [],
      roleChange: [],
      refresh: [],
      logout: [],
      error: []
    };
    
    // 🆕 Refresh state management (prevents race conditions)
    this.isRefreshing = false;
    this.refreshPromise = null;
    
    // Start token monitoring
    this.startTokenMonitoring();
    
    // Add user activity detection for more frequent refreshes
    this.setupUserActivityDetection();
  }

  /**
   * 🆕 Event registration methods
   */
  on(eventType, callback) {
    if (this.eventListeners[eventType]) {
      this.eventListeners[eventType].push(callback);
    } else {
      console.warn(`Unknown event type: ${eventType}`);
    }
  }

  /**
   * 🆕 Remove specific event listener
   */
  off(eventType, callback) {
    if (this.eventListeners[eventType]) {
      const index = this.eventListeners[eventType].indexOf(callback);
      if (index > -1) {
        this.eventListeners[eventType].splice(index, 1);
        console.log(`[DEBUG] Removed listener for event: ${eventType}`);
      }
    }
  }

  /**
   * 🆕 Event emission methods
   */
  emit(eventType, data) {
    if (this.eventListeners[eventType]) {
      this.eventListeners[eventType].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${eventType} listener:`, error);
        }
      });
    }
  }

  /**
   * Store tokens after successful login (Enhanced with events)
   */
  setTokens(accessToken, role) {
    const oldRole = this.role;
    
    this.accessToken = accessToken;
    this.role = role;
    
    // 🆕 Safe storage with error handling
    try {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('userRole', role);
    } catch (error) {
      console.error('Failed to store tokens:', error);
      this.emit('error', { type: 'storage', error });
      return false;
    }
    
    // 🆕 Emit events
    this.emit('tokenChange', { accessToken, role });
    
    if (oldRole !== role) {
      this.emit('roleChange', { oldRole, newRole: role });
    }
    
    // Reset refresh attempts
    this.refreshAttempts = 0;
    
    // Start monitoring for this token
    this.startTokenMonitoring();
    
    return true;
  }

  /**
   * Get current access token
   */
  getAccessToken() {
    return this.accessToken;
  }

  /**
   * Get current user role
   */
  getUserRole() {
    console.log('[DEBUG] getUserRole called, current role:', this.role);
    console.log('[DEBUG] Role from localStorage:', localStorage.getItem('userRole'));
    return this.role;
  }

  /**
   * Check if token is expired or will expire soon
   */
  isTokenExpired() {
    if (!this.accessToken) return true;
    
    try {
      const decoded = this.decodeToken(this.accessToken);
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = decoded.exp - now;
      
      // Return true if token expires in less than 5 minutes (more reasonable)
      return timeUntilExpiry < 300;
    } catch (error) {
      console.error('Error decoding token:', error);
      return true;
    }
  }

  /**
   * Decode JWT token (frontend only - no signature verification)
   */
  decodeToken(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Invalid token format');
    }
  }

  /**
   * Start monitoring token expiry (Enhanced with adaptive timing)
   */
  startTokenMonitoring() {
    if (this.refreshInterval) {
      clearTimeout(this.refreshInterval);
    }
    
    // 🆕 Use recursive setTimeout instead of setInterval for better control
    this.scheduleNextCheck();
  }

  /**
   * 🆕 Setup user activity detection for proactive token refresh
   */
  setupUserActivityDetection() {
    let lastActivity = Date.now();
    
    // Track user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const updateActivity = () => {
      lastActivity = Date.now();
    };
    
    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });
    
    // Check activity every 2 minutes
    setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivity;
      
      // If user was active in last 5 minutes, check token more frequently
      if (timeSinceActivity < 300000) { // 5 minutes
        console.log('[DEBUG] User is active, checking token status...');
        this.checkTokenExpiry();
      }
    }, 120000); // Check every 2 minutes
  }

  /**
   * 🆕 Schedule the next token check with adaptive timing
   */
  scheduleNextCheck() {
    if (!this.accessToken) return;
    
    try {
      const payload = this.decodeToken(this.accessToken);
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - now;
      
      // 🆕 Calculate next check time based on expiry proximity
      let nextCheckDelay;
      
      if (timeUntilExpiry <= 0) {
        // Token already expired, check immediately
        nextCheckDelay = 0;
        console.log('[DEBUG] Token already expired, checking immediately');
      } else if (timeUntilExpiry <= 300) {
        // Token expires in less than 5 minutes, check every 30 seconds
        nextCheckDelay = 30000;
        console.log(`[DEBUG] Token expires in ${timeUntilExpiry} seconds, checking every 30 seconds`);
      } else if (timeUntilExpiry <= 600) {
        // Token expires in less than 10 minutes, check every minute
        nextCheckDelay = 60000;
        console.log(`[DEBUG] Token expires in ${timeUntilExpiry} seconds, checking every minute`);
      } else {
        // Token has plenty of time, check every 5 minutes
        nextCheckDelay = 300000;
        console.log(`[DEBUG] Token expires in ${timeUntilExpiry} seconds, checking every 5 minutes`);
      }
      
      this.refreshInterval = setTimeout(() => {
        this.checkTokenExpiry();
        this.scheduleNextCheck(); // 🆕 Schedule next check recursively
      }, nextCheckDelay);
      
    } catch (error) {
      console.error('Error scheduling token check:', error);
      this.emit('error', { type: 'monitoringError', error });
      
      // 🆕 Fallback to checking every minute
      console.log('[DEBUG] Using fallback monitoring interval (1 minute)');
      this.refreshInterval = setTimeout(() => {
        this.checkTokenExpiry();
        this.scheduleNextCheck();
      }, 60000);
    }
  }

  /**
   * 🆕 Check if token has expired and initiate refresh if needed
   */
  checkTokenExpiry() {
    if (this.isTokenExpired()) {
      console.log('[DEBUG] Token expired, initiating refresh...');
      this.refreshToken();
    } else {
      // Check if token needs proactive refresh (expires in less than 10 minutes)
      try {
        const decoded = this.decodeToken(this.accessToken);
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = decoded.exp - now;
        
        if (timeUntilExpiry <= 600) { // 10 minutes
          console.log(`[DEBUG] Token expires in ${timeUntilExpiry} seconds, proactively refreshing...`);
          this.refreshToken();
        } else {
          console.log('[DEBUG] Token still valid, continuing monitoring');
        }
      } catch (error) {
        console.error('Error checking token expiry:', error);
        this.refreshToken(); // Refresh on error
      }
    }
  }

  /**
   * Refresh access token using refresh token (Enhanced with locking)
   */
  async refreshToken() {
    // 🆕 Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing) {
      console.log('[DEBUG] Refresh already in progress, returning existing promise');
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performRefresh();
    
    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * 🆕 Perform the actual token refresh
   */
  async performRefresh() {
    if (this.refreshAttempts >= this.maxRefreshAttempts) {
      console.error('Max refresh attempts reached');
      this.emit('error', { type: 'maxRefreshAttempts' });
      this.logout();
      return false;
    }

    try {
      this.refreshAttempts++;
      console.log(`[DEBUG] Attempting token refresh (attempt ${this.refreshAttempts}/${this.maxRefreshAttempts})`);
      
      // 🆕 Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch('/.netlify/functions/refresh-token', {
        method: 'POST',
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[DEBUG] Token refresh successful');
        
        // Set tokens (this will trigger events)
        this.setTokens(data.accessToken, data.role);
        
        // 🆕 Emit refresh success event
        this.emit('refresh', { success: true, role: data.role });
        
        // Process retry queue
        this.processRetryQueue();
        return true;
      } else {
        throw new Error(`Token refresh failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      
      if (error.name === 'AbortError') {
        console.error('[ERROR] Token refresh timed out');
        this.emit('error', { type: 'refreshTimeout' });
      } else {
        this.emit('error', { type: 'refreshFailed', error });
      }
      
      if (this.refreshAttempts >= this.maxRefreshAttempts) {
        console.error('[ERROR] Max refresh attempts reached, logging out');
        this.logout();
      }
      return false;
    }
  }

  /**
   * Add request to retry queue
   */
  addToRetryQueue(requestFn) {
    this.retryQueue.push(requestFn);
  }

  /**
   * Process retry queue after successful token refresh
   */
  processRetryQueue() {
    while (this.retryQueue.length > 0) {
      const requestFn = this.retryQueue.shift();
      try {
        requestFn();
      } catch (error) {
        console.error('Error retrying request:', error);
      }
    }
  }

  /**
   * Make authenticated request with automatic token refresh
   */
  async makeAuthenticatedRequest(url, options = {}) {
    // Add authorization header
    const authOptions = {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.getAccessToken()}`
      },
      credentials: 'include' // Include cookies for refresh token
    };

    try {
      const response = await fetch(url, authOptions);
      
      if (response.status === 401) {
        // Token expired, try to refresh
        const refreshSuccess = await this.refreshToken();
        
        if (refreshSuccess) {
          // Retry the original request
          authOptions.headers.Authorization = `Bearer ${this.getAccessToken()}`;
          return await fetch(url, authOptions);
        } else {
          throw new Error('Authentication failed');
        }
      }
      
      return response;
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  /**
   * Clear tokens and logout (Enhanced with events and cleanup)
   */
  logout() {
    console.log('[DEBUG] Logging out user...');
    
    // 🆕 Emit logout event before clearing state
    this.emit('logout', { reason: 'user_logout' });
    
    // Clear tokens
    this.accessToken = null;
    this.role = null;
    
    // Clear storage
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userRole');
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
    
    // 🆕 Clear refresh interval (now using setTimeout)
    if (this.refreshInterval) {
      clearTimeout(this.refreshInterval);
      this.refreshInterval = null;
    }
    
    // Clear retry queue
    this.retryQueue = [];
    
    // 🆕 Clear event listeners to prevent memory leaks
    this.clearEventListeners();
    
    // Call logout API
    fetch('/.netlify/functions/logout', {
      method: 'POST',
      credentials: 'include'
    }).catch(error => {
      console.error('Logout API call failed:', error);
    });
    
    console.log('[DEBUG] Logout complete, redirecting to login page');
    
    // Redirect to login page
    window.location.href = '/';
  }

  /**
   * 🆕 Clear all event listeners to prevent memory leaks
   */
  clearEventListeners() {
    Object.keys(this.eventListeners).forEach(eventType => {
      this.eventListeners[eventType] = [];
    });
    console.log('[DEBUG] Event listeners cleared');
  }

  /**
   * 🆕 Get event listener counts for debugging
   */
  getEventListenerCounts() {
    const counts = {};
    Object.keys(this.eventListeners).forEach(eventType => {
      counts[eventType] = this.eventListeners[eventType].length;
    });
    return counts;
  }

  /**
   * 🆕 Debug method to log current state
   */
  debug() {
    console.log('[DEBUG] TokenManager State:', {
      hasAccessToken: !!this.accessToken,
      role: this.role,
      isRefreshing: this.isRefreshing,
      refreshAttempts: this.refreshAttempts,
      hasRefreshInterval: !!this.refreshInterval,
      retryQueueLength: this.retryQueue.length,
      eventListenerCounts: this.getEventListenerCounts()
    });
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.accessToken && !this.isTokenExpired();
  }

  /**
   * Check if user has specific role
   */
  hasRole(role) {
    return this.role === role;
  }
}

// Create global instance
window.tokenManager = new TokenManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TokenManager;
}

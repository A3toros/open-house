// TOKEN MANAGER - Simple authentication token management for standalone HTML pages
// ✅ COMPLETED: JWT token management for authentication
// ✅ COMPLETED: Token storage and retrieval
// ✅ COMPLETED: Token validation and refresh
// ✅ COMPLETED: Logout functionality
//
const PUBLIC_ROUTES = ['/login', '/privacy', '/privacy-policy'];
const PUBLIC_ROUTE_KEYWORDS = ['privacy', 'terms', 'legal'];

const isPublicPath = (path) => {
  if (!path) return false;
  const normalizedPath = path.toLowerCase();
  if (PUBLIC_ROUTES.some((route) => normalizedPath === route || normalizedPath.startsWith(`${route}/`))) {
    return true;
  }
  return PUBLIC_ROUTE_KEYWORDS.some((keyword) => normalizedPath.includes(keyword));
};
class TokenManager {
  constructor() {
    this.tokenKey = 'auth_token';
    this.refreshTokenKey = 'refresh_token';
    this.userKey = 'user_data';
  }

  // Get stored token
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  // Get stored refresh token
  getRefreshToken() {
    return localStorage.getItem(this.refreshTokenKey);
  }

  // Get stored user data
  getUserData() {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  // Set token
  setToken(token) {
    localStorage.setItem(this.tokenKey, token);
  }

  // Set refresh token
  setRefreshToken(refreshToken) {
    localStorage.setItem(this.refreshTokenKey, refreshToken);
  }

  // Set user data
  setUserData(userData) {
    localStorage.setItem(this.userKey, JSON.stringify(userData));
  }

  // Set tokens and role (convenience method)
  setTokens(accessToken, role) {
    this.setToken(accessToken);
    this.setUserData({ role: role });
    // Also store in 'accessToken' key for userService compatibility
    localStorage.setItem('accessToken', accessToken);
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Decode JWT token to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Error decoding token:', error);
      return false;
    }
  }

  // Get user role
  getUserRole() {
    const userData = this.getUserData();
    return userData ? userData.role : null;
  }

  // Check if user is admin
  isAdmin() {
    return this.getUserRole() === 'admin';
  }

  // Check if user is teacher
  isTeacher() {
    return this.getUserRole() === 'teacher';
  }

  // Check if user is student
  isStudent() {
    return this.getUserRole() === 'student';
  }

  // Clear all stored data
  clearAuth() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
  }

  // Logout user
  logout() {
    this.clearAuth();
    // Redirect to login page (React route)
    window.location.href = '/login';
  }

  // Get authorization header for API requests
  getAuthHeader() {
    const token = this.getToken();
    return token ? `Bearer ${token}` : null;
  }

  // Make authenticated API request
  async makeAuthenticatedRequest(url, options = {}) {
    const token = this.getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    // If token is expired, try to refresh
    if (response.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Retry the request with new token
        headers.Authorization = `Bearer ${this.getToken()}`;
        return fetch(url, {
          ...options,
          headers
        });
      } else {
        // Refresh failed, logout user
        this.logout();
        throw new Error('Authentication failed');
      }
    }

    return response;
  }

  // Refresh token
  async refreshToken() {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch('/.netlify/functions/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        this.setToken(data.accessToken);
        if (data.refreshToken) {
          this.setRefreshToken(data.refreshToken);
        }
        return true;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    }

    return false;
  }

  // Get access token (alias for getToken)
  getAccessToken() {
    return this.getToken();
  }

  // Decode JWT token
  decodeToken(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  // Initialize authentication check
  init() {
    // Check if user is authenticated
    if (!this.isAuthenticated()) {
      // Redirect to login if not authenticated
      const currentPath = window.location.pathname || '/';
      const pathIsPublic = isPublicPath(currentPath);
      console.info('[TokenManager:template] Unauthenticated visitor on path:', currentPath, 'public?', pathIsPublic);
      if (!pathIsPublic) {
        window.location.href = '/login';
      }
      return false;
    }

    // Set up automatic token refresh
    this.setupTokenRefresh();
    return true;
  }

  // Set up automatic token refresh
  setupTokenRefresh() {
    // Refresh token every 50 minutes (tokens expire in 1 hour)
    setInterval(async () => {
      if (this.isAuthenticated()) {
        await this.refreshToken();
      }
    }, 50 * 60 * 1000);
  }
}

// Create global instance
const tokenManager = new TokenManager();

// Make available globally
window.tokenManager = tokenManager;

// Initialize on page load
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      tokenManager.init();
    });
  } else {
    // DOM is already loaded (React environment)
    tokenManager.init();
  }
}

// Export for module usage
export default tokenManager;

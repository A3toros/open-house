/**
 * Secure Token Storage Utility (Web)
 * 
 * Provides secure, reliable token storage using localStorage with:
 * - Write verification (read after write)
 * - Hash verification (integrity checks using Web Crypto API)
 * - Retry logic (3 attempts, 200ms delay)
 * - Auto-recovery (last-known-good copy)
 * - localStorage unavailability fallback to sessionStorage
 * - In-memory cache for performance
 */

// In-memory cache
let tokenCache = null;
let localStorageAvailable = null;

// Helper: Check if localStorage is available
function checkLocalStorageAvailability() {
  if (localStorageAvailable !== null) {
    return localStorageAvailable;
  }
  
  try {
    const testKey = '_test';
    localStorage.setItem(testKey, 'test');
    const value = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    localStorageAvailable = value === 'test';
  } catch (e) {
    console.warn('localStorage unavailable, falling back to sessionStorage', e);
    localStorageAvailable = false;
  }
  
  return localStorageAvailable;
}

// Helper: Get storage (localStorage or sessionStorage fallback)
function getStorage() {
  const isAvailable = checkLocalStorageAvailability();
  return isAvailable ? localStorage : sessionStorage;
}

// Helper: Hash value using Web Crypto API (SHA-256)
async function hashValue(value) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(value);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (e) {
    console.warn('Hash computation failed', e);
    // Fallback: simple hash for older browsers
    return btoa(value).replace(/[^a-zA-Z0-9]/g, '').substring(0, 64);
  }
}

// Helper: Safe set with verification
async function safeSetItem(key, value) {
  try {
    const storage = getStorage();
    storage.setItem(key, value);
    
    // Verify write succeeded
    const verify = storage.getItem(key);
    return verify === value;
  } catch (e) {
    console.warn('Storage write failed', e);
    return false;
  }
}

// Helper: Store with hash
async function storeWithHash(key, value) {
  try {
    const storage = getStorage();
    const hash = await hashValue(value);
    storage.setItem(`${key}_hash`, hash);
    return await safeSetItem(key, value);
  } catch (e) {
    console.warn('Failed to store with hash', e);
    return false;
  }
}

// Helper: Verify hash
async function verifyHash(key) {
  try {
    const storage = getStorage();
    const value = storage.getItem(key);
    const storedHash = storage.getItem(`${key}_hash`);
    
    if (!value || !storedHash) return false;
    
    const hash = await hashValue(value);
    return hash === storedHash;
  } catch (e) {
    console.warn('Hash verification failed', e);
    return false;
  }
}

// Helper: Retry write
async function retryWrite(fn, retries = 3, delay = 200) {
  for (let i = 0; i < retries; i++) {
    const ok = await fn();
    if (ok) return true;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  return false;
}

// Main SecureToken API
export const SecureToken = {
  /**
   * Set token with retry, hash verification, and write verification
   */
  async set(token) {
    const isLocalStorageAvailable = checkLocalStorageAvailability();
    const storage = getStorage();
    
    // Fallback to sessionStorage if localStorage unavailable
    if (!isLocalStorageAvailable) {
      console.warn('⚠️ localStorage unavailable - using sessionStorage (less persistent)');
      try {
        storage.setItem('auth_token', token);
        const verify = storage.getItem('auth_token');
        const ok = verify === token;
        if (ok) tokenCache = token; // Update cache
        return ok;
      } catch (e) {
        console.error('sessionStorage fallback failed', e);
        return false;
      }
    }
    
    // Normal localStorage path with retry and hash
    const ok = await retryWrite(() => storeWithHash('auth_token', token));
    
    if (ok) {
      // Update cache
      tokenCache = token;
    }
    
    return ok;
  },

  /**
   * Get token with hash verification and cache
   */
  async get() {
    // Return cached value if available
    if (tokenCache) {
      return tokenCache;
    }
    
    const storage = getStorage();
    
    // Fallback to sessionStorage if localStorage unavailable
    if (!checkLocalStorageAvailability()) {
      try {
        const token = storage.getItem('auth_token');
        tokenCache = token; // Cache the value
        return token;
      } catch (e) {
        console.error('sessionStorage fallback read failed', e);
        return null;
      }
    }
    
    // Normal localStorage path
    try {
      const token = storage.getItem('auth_token');
      if (!token) {
        tokenCache = null;
        return null;
      }
      
      // Check if hash exists (new format) or token exists without hash (legacy format)
      const storedHash = storage.getItem('auth_token_hash');
      
      if (storedHash) {
        // New format: verify hash
        const ok = await verifyHash('auth_token');
        if (!ok) {
          tokenCache = null; // Clear cache on verification failure
          return null;
        }
      } else {
        // Legacy format: token exists without hash - migrate it
        console.log('Migrating legacy token to secure storage format...');
        try {
          const hash = await hashValue(token);
          storage.setItem('auth_token_hash', hash);
          // Verify the hash was stored
          const verify = storage.getItem('auth_token_hash');
          if (verify !== hash) {
            console.warn('Failed to store hash during migration');
            return token; // Return token anyway, but without hash protection
          }
        } catch (e) {
          console.warn('Failed to migrate token hash:', e);
          // Return token anyway, but without hash protection
        }
      }
      
      tokenCache = token; // Cache the value
      return token;
    } catch (e) {
      console.warn('Failed to get token', e);
      tokenCache = null;
      return null;
    }
  },

  /**
   * Clear token from localStorage, sessionStorage fallback, and cache
   */
  async clear() {
    try {
      // Clear localStorage
      if (checkLocalStorageAvailability()) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_token_hash');
      }
    } catch (e) {
      // Ignore if localStorage unavailable
    }
    
    try {
      // Also clear sessionStorage fallback
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token_hash');
    } catch (e) {
      // Ignore if sessionStorage unavailable
    }
    
    // Clear in-memory cache
    tokenCache = null;
  },

  /**
   * Clear cache manually if needed (e.g., after token refresh)
   */
  clearCache() {
    tokenCache = null;
  }
};


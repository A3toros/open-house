// Storage Cache System for Teacher Cabinet Optimization
// Provides permanent localStorage caching with smart updates

const CACHE_PREFIX = 'teacher_cabinet_';

export const StorageCache = {
  // Save data to localStorage (permanently)
  set: (key, data) => {
    try {
      localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(data));
      console.log(`💾 Cached data for ${key}`);
    } catch (error) {
      console.warn(`Failed to cache ${key}:`, error);
    }
  },

  // Get data from localStorage
  get: (key) => {
    try {
      const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn(`Failed to get cached ${key}:`, error);
      return null;
    }
  },

  // Check if data exists
  exists: (key) => {
    return localStorage.getItem(`${CACHE_PREFIX}${key}`) !== null;
  },

  // Update data only if it changed
  update: (key, newData) => {
    const existing = this.get(key);
    if (JSON.stringify(existing) !== JSON.stringify(newData)) {
      console.log(`🔄 Data changed for ${key}, updating cache`);
      this.set(key, newData);
      return true;
    }
    console.log(`✅ Data unchanged for ${key}, keeping cache`);
    return false;
  },

  // Clear specific cache entry
  clear: (key) => {
    if (key) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      console.log(`🗑️ Cleared cache for ${key}`);
    } else {
      // Clear all cache entries
      Object.keys(localStorage)
        .filter(key => key.startsWith(CACHE_PREFIX))
        .forEach(key => localStorage.removeItem(key));
      console.log('🗑️ Cleared all cache');
    }
  },

  // Get cache size
  getSize: () => {
    const cacheKeys = Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_PREFIX));
    return cacheKeys.length;
  },

  // Get cache info for debugging
  getInfo: () => {
    const info = {
      totalItems: this.getSize(),
      items: []
    };
    
    Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_PREFIX))
      .forEach(key => {
        const cached = this.get(key);
        if (cached) {
          info.items.push({
            key: key.replace(CACHE_PREFIX, ''),
            size: JSON.stringify(cached).length,
            type: typeof cached
          });
        }
      });
    
    return info;
  }
};

export default StorageCache;

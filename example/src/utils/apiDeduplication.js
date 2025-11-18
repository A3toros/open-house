// API Call Deduplication Utility
// Prevents multiple identical API calls from being made simultaneously

class ApiDeduplication {
  constructor() {
    this.activeRequests = new Map();
    this.completedRequests = new Map();
    this.maxCacheSize = 100;
    this.cacheTimeout = 30000; // 30 seconds
  }

  // Generate a unique key for the API call
  generateKey(method, url, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    
    return `${method}_${url}_${JSON.stringify(sortedParams)}`;
  }

  // Check if request is already in progress
  isRequestInProgress(key) {
    return this.activeRequests.has(key);
  }

  // Check if request was recently completed
  getCachedResult(key) {
    const cached = this.completedRequests.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result;
    }
    return null;
  }

  // Start tracking a request
  startRequest(key, promise) {
    this.activeRequests.set(key, promise);
    
    // Clean up when request completes
    promise.finally(() => {
      this.activeRequests.delete(key);
    });
    
    return promise;
  }

  // Cache completed request result
  cacheResult(key, result) {
    // Clean up old cache if it's getting too large
    if (this.completedRequests.size >= this.maxCacheSize) {
      const oldestKey = this.completedRequests.keys().next().value;
      this.completedRequests.delete(oldestKey);
    }
    
    this.completedRequests.set(key, {
      result,
      timestamp: Date.now()
    });
  }

  // Main deduplication method
  async deduplicateApiCall(method, url, params, apiCall) {
    const key = this.generateKey(method, url, params);
    
    // Check if request is already in progress
    if (this.isRequestInProgress(key)) {
      console.log('🔄 API deduplication: Request already in progress, waiting...', key);
      return this.activeRequests.get(key);
    }
    
    // Check if we have a recent cached result
    const cachedResult = this.getCachedResult(key);
    if (cachedResult) {
      console.log('🔄 API deduplication: Using cached result', key);
      return cachedResult;
    }
    
    // Make the API call
    console.log('🔄 API deduplication: Making new request', key);
    const promise = this.startRequest(key, apiCall());
    
    try {
      const result = await promise;
      this.cacheResult(key, result);
      return result;
    } catch (error) {
      // Don't cache errors
      throw error;
    }
  }

  // Clear all caches
  clearCache() {
    this.activeRequests.clear();
    this.completedRequests.clear();
    console.log('🧹 API deduplication: Cache cleared');
  }
}

// Create singleton instance
const apiDeduplication = new ApiDeduplication();

export default apiDeduplication;

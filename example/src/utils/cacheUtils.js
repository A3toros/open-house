const CACHE_TTL = {
  // Student Data
  student_subjects: 30 * 60 * 1000,     // 30 minutes
  student_active_tests: 3 * 60 * 1000,   // 3 minutes
  student_results_table: 5 * 60 * 1000,  // 5 minutes TTL
  
  // Teacher Data
  teacher_subjects: 15 * 60 * 1000,     // 15 minutes
  teacher_classes: 15 * 60 * 1000,      // 15 minutes
  teacher_tests: 10 * 60 * 1000,        // 10 minutes
  teacher_results_table: 10 * 60 * 1000, // 10 minutes TTL
  
  // Admin Data
  admin_users: 20 * 60 * 1000,          // 20 minutes
  admin_teachers: 20 * 60 * 1000,       // 20 minutes
  admin_subjects: 30 * 60 * 1000,       // 30 minutes
  admin_academic_years: 60 * 60 * 1000, // 60 minutes
  admin_tests: 15 * 60 * 1000,          // 15 minutes
  admin_results_table: null,             // No TTL (event-driven)
  admin_teacher_id: 60 * 60 * 1000,     // 60 minutes
  all_tests: 20 * 60 * 1000,            // 20 minutes
  
  // Shared Data
  subjects_dropdown: 30 * 60 * 1000,    // 30 minutes
  grades_classes: 60 * 60 * 1000,       // 60 minutes
  
  // Temporary Data (immediate delete)
  test_progress: 2 * 60 * 1000,         // 2 minutes (deleted after submission)
  anti_cheating: 2 * 60 * 1000,         // 2 minutes (deleted after submission)
  
  // Word Matching Test Data
  word_matching_test: 10 * 60 * 1000,   // 10 minutes TTL
  
  // Speaking Test Data (survives page reloads)
  speaking_test_data: 60 * 60 * 1000,   // 60 minutes TTL (longer for test data)
};

const getCacheKey = (type, userId = '') => {
  return `${type}_${userId}`;
};

const getCachedEntry = (key, options = {}) => {
  const { includeExpired = false } = options;
  try {
    const cached = localStorage.getItem(key);
    if (!cached) {
      console.log('💾 Cache: No data found for key:', key);
      return null;
    }
    
    const parsed = JSON.parse(cached);
    const { data, timestamp, ttl } = parsed;
    const age = Date.now() - timestamp;
    const hasTtl = typeof ttl === 'number' && Number.isFinite(ttl);
    const isExpired = hasTtl ? age > ttl : false;

    if (isExpired && !includeExpired) {
      console.log('💾 Cache: Data expired for key:', key, 'age:', age, 'ttl:', ttl);
      localStorage.removeItem(key);
      return null;
    }

    console.log('💾 Cache: Entry found for key:', key, 'age:', age, 'ttl:', ttl, 'expired:', isExpired);
    return {
      data,
      timestamp,
      ttl,
      age,
      isExpired
    };
  } catch (error) {
    console.log('💾 Cache: Corrupted data for key:', key, error);
    localStorage.removeItem(key);
    return null;
  }
};

const getCachedData = (key) => {
  const entry = getCachedEntry(key);
  return entry ? entry.data : null;
};

const setCachedData = (key, data, ttl) => {
  try {
    console.log('💾 Cache: Setting data for key:', key, 'ttl:', ttl);
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now(),
      ttl: typeof ttl === 'number' && Number.isFinite(ttl) ? ttl : ttl === null ? null : undefined
    }));
    console.log('💾 Cache: Data cached successfully for key:', key);
  } catch (error) {
    console.log('💾 Cache: Storage full, cleaning old data for key:', key);
    // Storage full - clean old data
    cleanupOldData();
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now(),
        ttl: typeof ttl === 'number' && Number.isFinite(ttl) ? ttl : ttl === null ? null : undefined
      }));
      console.log('💾 Cache: Data cached after cleanup for key:', key);
    } catch (e) {
      console.warn('Storage full, cannot cache data');
    }
  }
};

const loadDataWithRetry = async (key, apiCall, retryCount = 0) => {
  try {
    // 1. Try cache first
    const cached = getCachedData(key);
    if (cached) {
      return cached;
    }
    
    // 2. Cache miss/expired - single API call
    const result = await apiCall();
    
    // 3. Store in cache - FIX: Use full type for TTL lookup
    const type = key.split('_').slice(0, -1).join('_'); // student_subjects_123 -> student_subjects
    setCachedData(key, result, CACHE_TTL[type] || 5 * 60 * 1000);
    
    return result;
  } catch (error) {
    console.error(`API call failed for ${key}:`, error);
    
    // 4. Retry once after timeout
    if (retryCount === 0) {
      console.log(`Retrying ${key} after 2 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return loadDataWithRetry(key, apiCall, 1);
    }
    
    // 5. Final fallback - use stale cached data
    const cached = localStorage.getItem(key);
    if (cached) {
      try {
        const { data } = JSON.parse(cached);
        console.log(`Using stale cached data for ${key}`);
        return data;
      } catch (e) {
        console.warn(`Stale data corrupted for ${key}`);
      }
    }
    
    throw error;
  }
};

const cleanupOldData = () => {
  const now = Date.now();
  const keys = Object.keys(localStorage);
  
  // Remove expired data first
  keys.forEach(key => {
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const { timestamp, ttl } = JSON.parse(cached);
        if (now - timestamp > ttl) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      localStorage.removeItem(key);
    }
  });
  
  // Remove data older than 7 days
  const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
  keys.forEach(key => {
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const { timestamp } = JSON.parse(cached);
        if (timestamp < sevenDaysAgo) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      localStorage.removeItem(key);
    }
  });
  
  // If still full, remove oldest data (not by count, but by age)
  const remainingKeys = Object.keys(localStorage);
  if (remainingKeys.length > 0) {
    const dataWithTimestamps = remainingKeys.map(key => {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const { timestamp } = JSON.parse(cached);
          return { key, timestamp };
        }
      } catch (error) {
        return { key, timestamp: 0 };
      }
      return { key, timestamp: 0 };
    });
    
    // Remove oldest 25% of data
    const toRemove = Math.ceil(dataWithTimestamps.length * 0.25);
    dataWithTimestamps
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, toRemove)
      .forEach(({ key }) => localStorage.removeItem(key));
  }
};

const clearUserData = (userId) => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.includes(userId)) {
      localStorage.removeItem(key);
    }
  });
};

const clearTestData = (userId, testType, testId) => {
  // Clear test progress and anti-cheating data after submission
  const testProgressKey = `test_progress_${userId}_${testType}_${testId}`;
  const antiCheatingKey = `anti_cheating_${userId}_${testType}_${testId}`;
  
  localStorage.removeItem(testProgressKey);
  localStorage.removeItem(antiCheatingKey);
  
  // Clear speaking test data cache if it's a speaking test
  if (testType === 'speaking_test_data') {
    const speakingTestDataKey = `speaking_test_data_${userId}_${testId}`;
    localStorage.removeItem(speakingTestDataKey);
    console.log(`Cleared speaking test data cache for ${testId}`);
  }
  
  console.log(`Cleared test data for ${testType}_${testId}`);
};

export {
  CACHE_TTL,
  getCacheKey,
  getCachedData,
  getCachedEntry,
  setCachedData,
  loadDataWithRetry,
  cleanupOldData,
  clearUserData,
  clearTestData
};

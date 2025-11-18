// Data Cache Hook for Teacher Cabinet Optimization
// Provides React hook for data caching with automatic cache management

import { useState, useCallback } from 'react';
import { StorageCache } from '../utils/StorageCache';

export const useDataCache = (key, loader, classKey = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async (forceRefresh = false) => {
    const cacheKey = classKey ? `${key}_${classKey}` : key;
    
    if (forceRefresh) {
      // Manual refresh - force update check
      setLoading(true);
      setError(null);
      try {
        console.log(`🔄 Manual refresh for ${key}${classKey ? ` (${classKey})` : ''}`);
        const freshData = await loader();
        const wasUpdated = StorageCache.update(cacheKey, freshData);
        setData(freshData);
        if (wasUpdated) {
          console.log(`✅ Updated cache for ${key}${classKey ? ` (${classKey})` : ''}`);
        } else {
          console.log(`✅ No changes for ${key}${classKey ? ` (${classKey})` : ''}`);
        }
      } catch (err) {
        console.error(`Error refreshing ${key}:`, err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      // Normal load - use cache if available
      const cachedData = StorageCache.get(cacheKey);
      if (cachedData) {
        console.log(`📦 Using cached data for ${key}${classKey ? ` (${classKey})` : ''}`);
        setData(cachedData);
      } else {
        setLoading(true);
        setError(null);
        try {
          console.log(`🔄 Loading fresh data for ${key}${classKey ? ` (${classKey})` : ''}`);
          const freshData = await loader();
          StorageCache.set(cacheKey, freshData);
          setData(freshData);
        } catch (err) {
          console.error(`Error loading ${key}:`, err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    }
  }, [key, loader, classKey]);

  // Clear cache for this specific key
  const clearCache = useCallback(() => {
    const cacheKey = classKey ? `${key}_${classKey}` : key;
    StorageCache.clear(cacheKey);
    setData(null);
    console.log(`🗑️ Cleared cache for ${cacheKey}`);
  }, [key, classKey]);

  // Check if data is cached
  const isCached = useCallback(() => {
    const cacheKey = classKey ? `${key}_${classKey}` : key;
    return StorageCache.exists(cacheKey);
  }, [key, classKey]);

  return { 
    data, 
    loading, 
    error, 
    loadData, 
    clearCache, 
    isCached 
  };
};

export default useDataCache;

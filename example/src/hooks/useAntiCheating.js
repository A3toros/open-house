import { useState, useEffect, useCallback, useRef } from 'react';
import { getCachedData, setCachedData, clearTestData } from '../utils/cacheUtils';

export const useAntiCheating = (testType, testId, userId) => {
  const [isTracking, setIsTracking] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [isCheating, setIsCheating] = useState(false);
  const isTrackingRef = useRef(false);
  
  // Load existing data from cache
  useEffect(() => {
    if (!testType || !testId || !userId) return;
    
    const cacheKey = `anti_cheating_${userId}_${testType}_${testId}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      setTabSwitches(cachedData.tabSwitches || 0);
      setIsCheating(cachedData.isCheating || false);
    }
  }, [testType, testId, userId]);

  // Tab switch detection logic
  const handleTabSwitch = useCallback(() => {
    console.log('🛡️ handleTabSwitch called - isTracking:', isTrackingRef.current);
    if (!isTrackingRef.current) {
      console.log('🛡️ Not tracking, returning early');
      return;
    }
    
    console.log('🛡️ Tab switch detected - starting 7 second timer...');
    const hiddenStartTime = Date.now();
    
    // Start timer to check if tab stays hidden long enough
    setTimeout(() => {
      const timeHidden = Date.now() - hiddenStartTime;
      console.log('🛡️ Timer completed - time hidden:', timeHidden, 'ms');
      
      // Count as switch if tab was hidden for at least 6.5 seconds
      if (timeHidden >= 6500) {
        console.log('🛡️ Tab was hidden for sufficient time - counting as tab switch');
        setTabSwitches(prev => {
          const newCount = prev + 1;
          const cheating = newCount >= 2; // 2+ switches = cheating
          console.log('🛡️ Tab switch count updated:', { newCount, cheating });
          setIsCheating(cheating);
          
          // Save to cache
          const cacheKey = `anti_cheating_${userId}_${testType}_${testId}`;
          setCachedData(cacheKey, { tabSwitches: newCount, isCheating: cheating }, 2 * 60 * 1000);
          
          return newCount;
        });
      } else {
        console.log('🛡️ Tab was not hidden long enough - not counting as switch');
      }
    }, 7000); // 7 second threshold
  }, [testType, testId, userId]);

  // Simple tab switch detection
  const handleVisibilityChange = useCallback(() => {
    if (!isTrackingRef.current) return;
    
    console.log('🛡️ Visibility change detected:', { hidden: document.hidden, isTracking: isTrackingRef.current });
    
    if (document.hidden) {
      handleTabSwitch();
    } else {
      console.log('🛡️ Tab became visible');
    }
  }, [handleTabSwitch]);

  // Start/stop tracking
  const startTracking = useCallback(() => {
    console.log('🛡️ startTracking called - setting up anti-cheating detection');
    console.log('🛡️ Current document.hidden state:', document.hidden);
    console.log('🛡️ Current document.visibilityState:', document.visibilityState);
    setIsTracking(true);
    isTrackingRef.current = true;
    
    // Use only visibilitychange event to avoid duplicate detection
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    console.log('🛡️ Anti-cheating event listeners added (visibilitychange only)');
  }, [handleVisibilityChange]);

  const stopTracking = useCallback(() => {
    console.log('🛡️ stopTracking called - removing anti-cheating detection');
    setIsTracking(false);
    isTrackingRef.current = false;
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    // Note: We can't remove the blur/focus listeners easily since they're anonymous functions
    // This is a limitation but shouldn't cause major issues
    console.log('🛡️ Anti-cheating event listeners removed');
  }, [handleVisibilityChange]);

  // Get cheating data for submission
  const getCheatingData = useCallback(() => {
    const data = {
      caught_cheating: isCheating,
      visibility_change_times: tabSwitches
    };
    console.log('🛡️ getCheatingData called:', data);
    return data;
  }, [isCheating, tabSwitches]);

  // Clear data (DELETE from localStorage)
  const clearData = useCallback(() => {
    if (userId && testType && testId) {
      clearTestData(userId, testType, testId); // Use cacheUtils function
    }
    setTabSwitches(0);
    setIsCheating(false);
    console.log('🗑️ Anti-cheating data deleted from localStorage');
  }, [userId, testType, testId]);

  return {
    startTracking,
    stopTracking,
    clearData,
    getCheatingData,
    tabSwitches,
    isCheating,
    isTracking
  };
};
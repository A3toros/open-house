/**
 * Anti-Cheating Tracker Utility
 * 
 * Tracks tab visibility changes during tests to detect suspicious behavior.
 * Rules: 10+ seconds hidden = 1 count, 2 counts = is_cheating = true
 * 
 * @author Mathayomwatsing System
 * @version 1.0.0
 */

class AntiCheatingTracker {
  constructor(testType, testId) {
    this.testType = testType;
    this.testId = testId;
    this.storageKey = `anti_cheating_${testType}_${testId}`;
    this.visibilityChangeCount = 0;
    this.isCheating = false;
    this.isTestActive = false;
    this.hiddenStartTime = null;
    this.hiddenDurationThreshold = 10000; // 10 seconds
    this.cheatingThreshold = 2; // 2 counts = cheating
    
    // Bind methods to preserve context
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
  }

  /**
   * Start tracking when test begins
   */
  startTracking() {
    console.log('🛡️ Starting anti-cheating tracking for', this.testType, this.testId);
    this.isTestActive = true;
    this.loadFromStorage();
    this.setupEventListeners();
  }

  /**
   * Stop tracking when test ends
   */
  stopTracking() {
    console.log('🛡️ Stopping anti-cheating tracking for', this.testType, this.testId);
    this.isTestActive = false;
    this.removeEventListeners();
  }

  /**
   * Setup event listeners for tab visibility changes
   */
  setupEventListeners() {
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    console.log('🛡️ Event listeners attached');
  }

  /**
   * Remove event listeners
   */
  removeEventListeners() {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    console.log('🛡️ Event listeners removed');
  }

  /**
   * Handle tab visibility changes
   */
  handleVisibilityChange() {
    if (!this.isTestActive) return;

    if (document.hidden) {
      // Tab became hidden - start timer
      this.hiddenStartTime = Date.now();
      console.log('🛡️ Tab hidden at:', new Date(this.hiddenStartTime).toISOString());
    } else {
      // Tab became visible - check duration
      if (this.hiddenStartTime) {
        const hiddenDuration = Date.now() - this.hiddenStartTime;
        console.log('🛡️ Tab visible after', hiddenDuration, 'ms hidden');
        
        if (hiddenDuration >= this.hiddenDurationThreshold) {
          this.visibilityChangeCount++;
          console.log('🛡️ Tab hidden for 10+ seconds, count:', this.visibilityChangeCount);
          
          if (this.visibilityChangeCount >= this.cheatingThreshold) {
            this.isCheating = true;
            console.log('🛡️ CHEATING DETECTED! Count reached threshold:', this.cheatingThreshold);
          }
          
          this.saveToStorage();
        }
        this.hiddenStartTime = null;
      }
    }
  }

  /**
   * Save data to localStorage
   */
  saveToStorage() {
    const data = {
      visibility_change_times: this.visibilityChangeCount,
      caught_cheating: this.isCheating,
      is_test_active: this.isTestActive,
      last_updated: new Date().toISOString()
    };
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      console.log('🛡️ Anti-cheating data saved:', data);
    } catch (error) {
      console.error('🛡️ Error saving anti-cheating data:', error);
    }
  }

  /**
   * Load data from localStorage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.visibilityChangeCount = data.visibility_change_times || 0;
        this.isCheating = data.caught_cheating || false;
        console.log('🛡️ Anti-cheating data loaded:', data);
      }
    } catch (error) {
      console.error('🛡️ Error loading anti-cheating data:', error);
    }
  }

  /**
   * Get current cheating data
   */
  getCheatingData() {
    return {
      visibility_change_times: this.visibilityChangeCount,
      caught_cheating: this.isCheating,
      is_test_active: this.isTestActive
    };
  }

  /**
   * Clear data from localStorage
   */
  clearData() {
    try {
      localStorage.removeItem(this.storageKey);
      this.visibilityChangeCount = 0;
      this.isCheating = false;
      this.isTestActive = false;
      console.log('🛡️ Anti-cheating data cleared for', this.testType, this.testId);
    } catch (error) {
      console.error('🛡️ Error clearing anti-cheating data:', error);
    }
  }

  /**
   * Get current status for debugging
   */
  getStatus() {
    return {
      testType: this.testType,
      testId: this.testId,
      storageKey: this.storageKey,
      visibilityChangeCount: this.visibilityChangeCount,
      isCheating: this.isCheating,
      isTestActive: this.isTestActive,
      hiddenStartTime: this.hiddenStartTime,
      hiddenDurationThreshold: this.hiddenDurationThreshold,
      cheatingThreshold: this.cheatingThreshold
    };
  }
}

export default AntiCheatingTracker;

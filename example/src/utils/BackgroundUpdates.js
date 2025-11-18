// Background Updates System for Teacher Cabinet Optimization
// Provides smart background updates based on data change frequency

import { StorageCache } from './StorageCache';

export const BackgroundUpdates = {
  // Check for updates and update cache if data changed
  checkForUpdates: async (key, loader, classKey = null) => {
    const cacheKey = classKey ? `${key}_${classKey}` : key;
    
    if (!StorageCache.exists(cacheKey)) {
      console.log(`📦 No cached data for ${key}${classKey ? ` (${classKey})` : ''}, skipping background update`);
      return;
    }
    
    console.log(`🔄 Checking for updates for ${key}${classKey ? ` (${classKey})` : ''}`);
    
    try {
      const freshData = await loader();
      const wasUpdated = StorageCache.update(cacheKey, freshData);
      
      if (wasUpdated) {
        console.log(`✅ Updated cache for ${key}${classKey ? ` (${classKey})` : ''}`);
        // Trigger UI update event
        window.dispatchEvent(new CustomEvent('dataUpdated', { 
          detail: { key, classKey, data: freshData } 
        }));
      } else {
        console.log(`✅ No changes for ${key}${classKey ? ` (${classKey})` : ''}`);
      }
    } catch (error) {
      console.error(`❌ Error checking updates for ${key}:`, error);
    }
  },

  // Start background updates with different frequencies
  startBackgroundUpdates: (updateConfigs) => {
    console.log('🔄 Starting background updates...');
    
    Object.entries(updateConfigs).forEach(([key, config]) => {
      const { loader, frequency, classKey = null } = config;
      
      if (frequency > 0) {
        setInterval(() => {
          if (document.visibilityState === 'visible') {
            console.log(`🔄 Running background update for ${key}...`);
            this.checkForUpdates(key, loader, classKey);
          }
        }, frequency);
        
        console.log(`✅ Background update scheduled for ${key} (every ${frequency / 1000 / 60} minutes)`);
      }
    });
  },

  // Stop all background updates
  stopBackgroundUpdates: () => {
    console.log('🛑 Stopping background updates...');
    // Note: In a real implementation, you'd store interval IDs and clear them
    // For now, this is handled by the component lifecycle
  }
};

// Class-specific cache management for student changes
export const ClassCacheManager = {
  // Invalidate all class-related caches when new students are detected
  invalidateClassCaches: (grade, className) => {
    const classKey = `${grade}/${className}`;
    const cacheKeys = [
      `classResults_${classKey}_1`, // Semester 1 (includes student list)
      `classResults_${classKey}_2`, // Semester 2 (includes student list)
      `performance_${classKey}`
    ];
    
    cacheKeys.forEach(key => {
      StorageCache.clear(key);
      console.log(`🗑️ Cleared cache for ${key}`);
    });
  },
  
  // Check for student count changes
  checkStudentCountChanges: async (grade, className, resultService, user, academicPeriodId) => {
    const classKey = `${grade}/${className}`;
    const cacheKey = `classResults_${classKey}_1`; // Student list is included in class results
    
    // Get current student count from cached class results
    const cachedData = StorageCache.get(cacheKey);
    if (!cachedData) return false;
    
    try {
      // Get fresh student count from API
      const freshData = await resultService.getTeacherStudentResults(
        user.teacher_id, grade, className, 1, academicPeriodId
      );
      
      const oldCount = cachedData.student_count || 0;
      const newCount = freshData.student_count || 0;
      
      if (oldCount !== newCount) {
        console.log(`👥 Student count changed for ${classKey}: ${oldCount} → ${newCount}`);
        this.invalidateClassCaches(grade, className);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error checking student count for ${classKey}:`, error);
      return false;
    }
  },
  
  // Periodic check for all classes
  checkAllClasses: async (teacherData, resultService, user, academicPeriodId) => {
    if (!teacherData || !teacherData.subjects) return [];
    
    const classes = [];
    teacherData.subjects.forEach(subject => {
      if (subject.classes) {
        subject.classes.forEach(cls => {
          classes.push({
            grade: cls.grade,
            className: cls.class
          });
        });
      }
    });
    
    const changes = [];
    
    for (const classInfo of classes) {
      const hasChanges = await this.checkStudentCountChanges(
        classInfo.grade, 
        classInfo.className,
        resultService,
        user,
        academicPeriodId
      );
      if (hasChanges) {
        changes.push(`${classInfo.grade}/${classInfo.className}`);
      }
    }
    
    if (changes.length > 0) {
      console.log(`🔄 Detected changes in classes: ${changes.join(', ')}`);
      // Notify user of changes
      window.dispatchEvent(new CustomEvent('classDataChanged', { 
        detail: { changedClasses: changes } 
      }));
    }
    
    return changes;
  }
};

export default BackgroundUpdates;

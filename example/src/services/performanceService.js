import { academicCalendarService } from './AcademicCalendarService';

/**
 * Performance Service
 * 
 * Handles test performance data fetching using the existing AcademicCalendarService.
 * Provides a simple interface for getting test performance data for the current academic period.
 */
export const performanceService = {
  /**
   * Get test performance data for a teacher
   * @param {string} teacherId - Teacher ID
   * @param {string} classKey - Optional class key (e.g., "M1/15") to filter by class
   * @returns {Promise<Object>} Performance data response
   */
  getTestPerformance: async (teacherId, classKey = null) => {
    try {
      // Use existing AcademicCalendarService to get current period (same as class results)
      await academicCalendarService.loadAcademicCalendar();
      const currentTerm = academicCalendarService.getCurrentTerm();
      const academicPeriodId = currentTerm?.id;
      
      if (!academicPeriodId) {
        throw new Error('No current academic period found');
      }

      console.log(`📊 Fetching test performance for teacher ${teacherId}, period ${academicPeriodId}, class: ${classKey || 'all'}`);

      let url = `/.netlify/functions/get-test-performance?teacher_id=${teacherId}&academic_period_id=${academicPeriodId}`;
      if (classKey) {
        const [grade, className] = classKey.split('/');
        const gradeFormat = grade.startsWith('M') ? grade : `M${grade}`;
        url += `&grade=${gradeFormat}&class=${className}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch performance data');
      }

      console.log(`📊 Performance data loaded: ${result.count} tests`);
      return result.data;

    } catch (error) {
      console.error('📊 Error fetching test performance:', error);
      throw error;
    }
  }
};

/**
 * Academic Calendar Service
 * 
 * Provides centralized academic calendar management using static JSON data.
 * Eliminates database queries for academic period detection.
 * 
 * Features:
 * - Load academic calendar from JSON file
 * - Get current term based on today's date
 * - Get current semester with all terms
 * - Term-based UI for teachers
 * - Automatic term detection for students
 */

class AcademicCalendarService {
  constructor() {
    this.academicCalendar = null;
    this.loaded = false;
  }

  /**
   * Load academic calendar from JSON file
   * @returns {Promise<Array>} Academic calendar data
   */
  async loadAcademicCalendar() {
    if (this.loaded) return this.academicCalendar;
    
    try {
      // Prefer static JSON from public for reliability and speed
      const tryFetch = async (url) => {
        const res = await fetch(url, { headers: { 'Accept': 'application/json' }, credentials: 'include' });
        const ct = (res.headers && res.headers.get && res.headers.get('content-type')) || '';
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (!ct.includes('application/json')) throw new Error('Non-JSON response');
        return await res.json();
      };

      let data = null;
      data = await tryFetch('/academic_year.json');

      if (!Array.isArray(data)) throw new Error('Invalid academic calendar format');
      this.academicCalendar = data;
      this.loaded = true;
      console.log('📅 Academic calendar loaded:', this.academicCalendar.length, 'terms');
      return this.academicCalendar;
    } catch (error) {
      console.error('📅 Error loading academic calendar:', error);
      return null;
    }
  }

  /**
   * Get current term based on today's date
   * @returns {Object|null} Current term object or null
   */
  getCurrentTerm() {
    if (!this.academicCalendar) return null;
    
    const today = new Date();
    
    const currentTerm = this.academicCalendar.find(term => {
      const start = new Date(term.start_date);
      const end = new Date(term.end_date);
      return today >= start && today <= end;
    });
    
    return currentTerm;
  }

  /**
   * Get current semester with all terms
   * @returns {Object|null} Current semester object with all terms
   */
  getCurrentSemester() {
    const currentTerm = this.getCurrentTerm();
    if (!currentTerm) return null;
    
    const semester = currentTerm.semester;
    // Restrict to the same academic year to avoid duplicating terms across years
    const allSemesterTerms = this.academicCalendar.filter(term => 
      term.semester === semester && term.academic_year === currentTerm.academic_year
    );
    
    return {
      semester,
      currentTerm,
      allTerms: allSemesterTerms
    };
  }

  /**
   * Get current academic period ID
   * @returns {number|null} Current academic period ID
   */
  getCurrentAcademicPeriodId() {
    const currentTerm = this.getCurrentTerm();
    return currentTerm?.id || null;
  }

  /**
   * Get terms for a specific semester
   * @param {number} semester - Semester number (1 or 2)
   * @returns {Array} Array of terms for the semester
   */
  getSemesterTerms(semester) {
    if (!this.academicCalendar) return [];
    return this.academicCalendar.filter(term => term.semester === semester);
  }

  /**
   * Get terms for a specific academic year
   * @param {string} academicYear - Academic year (e.g., "2025-2026")
   * @returns {Array} Array of terms for the academic year
   */
  getAcademicYearTerms(academicYear) {
    if (!this.academicCalendar) return [];
    return this.academicCalendar.filter(term => term.academic_year === academicYear);
  }

  /**
   * Get current semester with term breakdown for teacher UI
   * @returns {Object|null} Current semester with formatted terms
   */
  getCurrentSemesterWithTerms() {
    const currentSemester = this.getCurrentSemester();
    if (!currentSemester) return null;
    
    const { semester, currentTerm, allTerms } = currentSemester;
    
    return {
      semester,
      currentTerm,
      allTerms,
      // For teacher UI: show only 2 terms of current semester
      terms: allTerms.map(term => ({
        id: term.id,
        term: term.term,
        start_date: term.start_date,
        end_date: term.end_date,
        isCurrent: term.id === currentTerm.id,
        label: `Term ${term.term}${term.id === currentTerm.id ? ' (Current)' : ''}`
      }))
    };
  }

  /**
   * Get current semester terms for teacher UI
   * Shows only the 2 terms of the current semester
   * @returns {Object|null} Current semester terms for UI
   */
  getCurrentSemesterTerms() {
    const currentSemester = this.getCurrentSemester();
    if (!currentSemester) return null;
    
    const { semester, currentTerm, allTerms } = currentSemester;
    
    return {
      semester,
      currentTerm,
      // Show only the 2 terms of the current semester
      terms: allTerms.map(term => ({
        id: term.id,
        term: term.term,
        start_date: term.start_date,
        end_date: term.end_date,
        isCurrent: term.id === currentTerm.id,
        label: `Term ${term.term}${term.id === currentTerm.id ? ' (Current)' : ''}`
      }))
    };
  }

  /**
   * Get term by ID
   * @param {number} termId - Term ID
   * @returns {Object|null} Term object or null
   */
  getTermById(termId) {
    if (!this.academicCalendar) return null;
    return this.academicCalendar.find(term => term.id === termId);
  }

  /**
   * Check if a term is current
   * @param {number} termId - Term ID
   * @returns {boolean} True if term is current
   */
  isCurrentTerm(termId) {
    const currentTerm = this.getCurrentTerm();
    return currentTerm?.id === termId;
  }

  /**
   * Get all academic years
   * @returns {Array} Array of unique academic years
   */
  getAcademicYears() {
    if (!this.academicCalendar) return [];
    const years = [...new Set(this.academicCalendar.map(term => term.academic_year))];
    return years.sort();
  }

  /**
   * Get terms for a specific academic year and semester
   * @param {string} academicYear - Academic year
   * @param {number} semester - Semester number
   * @returns {Array} Array of terms
   */
  getAcademicYearSemesterTerms(academicYear, semester) {
    if (!this.academicCalendar) return [];
    return this.academicCalendar.filter(term => 
      term.academic_year === academicYear && term.semester === semester
    );
  }
}

// Export singleton instance
export const academicCalendarService = new AcademicCalendarService();

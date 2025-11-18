// RESULT SERVICE - Service for View Table Queries
// ✅ COMPLETED: New service for view table queries as specified in implementation guide
// ✅ COMPLETED: getTeacherStudentResults() - Query teacher_student_results_view
// ✅ COMPLETED: getStudentResultsView() - Query student_results_view  
// ✅ COMPLETED: getClassSummary() - Query class_summary_view
// ✅ COMPLETED: Error handling and response formatting
// ✅ COMPLETED: Integration with tokenManager for authentication

import tokenManager from '@/templates/token-manager';

// Get teacher student results from view table (term-based)
export const getTeacherStudentResults = async (teacherId, grade, className, termId, forceRefresh = false) => {
  try {
    console.log('📊 Fetching teacher student results:', { teacherId, grade, className, termId, forceRefresh });
    
    // Add cache-busting parameter if forceRefresh is true to bypass HTTP cache
    const cacheBuster = forceRefresh ? `&_t=${Date.now()}` : '';
    const response = await tokenManager.makeAuthenticatedRequest(
      `/.netlify/functions/get-teacher-student-results?teacher_id=${teacherId}&grade=${grade}&class=${className}&academic_period_id=${termId}${cacheBuster}`,
      {
        // Add cache-control header and fetch cache option to bypass browser/CDN cache when forceRefresh is true
        cache: forceRefresh ? 'no-cache' : 'default',
        headers: forceRefresh ? {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        } : {}
      }
    );
    
    const data = await response.json();
    
    if (data.success) {
      console.log('📊 Teacher student results loaded:', data.results.length, 'results');
      console.log('📊 Students loaded:', data.students?.length || 0, 'students');
      return {
        success: true,
        results: data.results,
        students: data.students || [],
        count: data.results.length,
        student_count: data.student_count || 0
      };
    } else {
      throw new Error(data.error || 'Failed to load teacher student results');
    }
  } catch (error) {
    console.error('Error fetching teacher student results:', error);
    return {
      success: false,
      error: error.message,
      results: []
    };
  }
};

// Get student results view from view table
export const getStudentResultsView = async (studentId, academicPeriodId) => {
  try {
    console.log('📊 Fetching student results view:', { studentId, academicPeriodId });
    
    // Handle null/undefined academicPeriodId
    const periodParam = academicPeriodId ? `&academic_period_id=${academicPeriodId}` : '';
    
    const response = await tokenManager.makeAuthenticatedRequest(
      `/.netlify/functions/get-student-results-view?student_id=${studentId}${periodParam}`
    );
    
    const data = await response.json();
    
    if (data.success) {
      console.log('📊 Student results view loaded:', data.results.length, 'results');
      return {
        success: true,
        results: data.results,
        count: data.results.length
      };
    } else {
      throw new Error(data.error || 'Failed to load student results view');
    }
  } catch (error) {
    console.error('Error fetching student results view:', error);
    return {
      success: false,
      error: error.message,
      results: []
    };
  }
};

// Get class summary from view table
export const getClassSummary = async (teacherId, grade, className, academicPeriodId) => {
  try {
    console.log('📊 Fetching class summary:', { teacherId, grade, className, academicPeriodId });
    
    const response = await tokenManager.makeAuthenticatedRequest(
      `/.netlify/functions/get-class-summary?teacher_id=${teacherId}&grade=${grade}&class=${className}&academic_period_id=${academicPeriodId}`
    );
    
    const data = await response.json();
    
    if (data.success) {
      console.log('📊 Class summary loaded:', data.summary);
      return {
        success: true,
        summary: data.summary,
        hasData: !!data.summary
      };
    } else {
      throw new Error(data.error || 'Failed to load class summary');
    }
  } catch (error) {
    console.error('Error fetching class summary:', error);
    return {
      success: false,
      error: error.message,
      summary: null
    };
  }
};

// Get teacher student results with enhanced filtering (term-based)
export const getTeacherStudentResultsFiltered = async (teacherId, grade, className, termId, filters = {}) => {
  try {
    const baseResults = await getTeacherStudentResults(teacherId, grade, className, termId);
    
    if (!baseResults.success) {
      return baseResults;
    }
    
    let filteredResults = baseResults.results;
    
    // Apply filters
    if (filters.subject) {
      filteredResults = filteredResults.filter(result => 
        result.subject && result.subject.toLowerCase().includes(filters.subject.toLowerCase())
      );
    }
    
    if (filters.testType) {
      filteredResults = filteredResults.filter(result => 
        result.test_type === filters.testType
      );
    }
    
    if (filters.minScore !== undefined) {
      filteredResults = filteredResults.filter(result => 
        (result.score / result.max_score) * 100 >= filters.minScore
      );
    }
    
    if (filters.maxScore !== undefined) {
      filteredResults = filteredResults.filter(result => 
        (result.score / result.max_score) * 100 <= filters.maxScore
      );
    }
    
    if (filters.passed !== undefined) {
      filteredResults = filteredResults.filter(result => 
        (result.score >= result.passing_score) === filters.passed
      );
    }
    
    return {
      success: true,
      results: filteredResults,
      count: filteredResults.length,
      originalCount: baseResults.results.length
    };
  } catch (error) {
    console.error('Error filtering teacher student results:', error);
    return {
      success: false,
      error: error.message,
      results: []
    };
  }
};

// Get student results with enhanced filtering
export const getStudentResultsViewFiltered = async (studentId, academicPeriodId, filters = {}) => {
  try {
    const baseResults = await getStudentResultsView(studentId, academicPeriodId);
    
    if (!baseResults.success) {
      return baseResults;
    }
    
    let filteredResults = baseResults.results;
    
    // Apply filters
    if (filters.subject) {
      filteredResults = filteredResults.filter(result => 
        result.subject && result.subject.toLowerCase().includes(filters.subject.toLowerCase())
      );
    }
    
    if (filters.testType) {
      filteredResults = filteredResults.filter(result => 
        result.test_type === filters.testType
      );
    }
    
    if (filters.semester) {
      filteredResults = filteredResults.filter(result => 
        result.semester === filters.semester
      );
    }
    
    if (filters.passed !== undefined) {
      filteredResults = filteredResults.filter(result => 
        (result.score >= result.passing_score) === filters.passed
      );
    }
    
    return {
      success: true,
      results: filteredResults,
      count: filteredResults.length,
      originalCount: baseResults.results.length
    };
  } catch (error) {
    console.error('Error filtering student results view:', error);
    return {
      success: false,
      error: error.message,
      results: []
    };
  }
};

// Export all functions
export const resultService = {
  getTeacherStudentResults,
  getStudentResultsView,
  getClassSummary,
  getTeacherStudentResultsFiltered,
  getStudentResultsViewFiltered
};

export default resultService;

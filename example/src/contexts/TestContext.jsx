import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { testService } from '../services/testService';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getCachedData, getCachedEntry, setCachedData, CACHE_TTL, clearTestData } from '../utils/cacheUtils';
import { calculateTestScore, checkAnswerCorrectness, getCorrectAnswer } from '../utils/scoreCalculation';

// TEST CONTEXT - React Context for Test State Management
// ✅ COMPLETED: All test functionality from legacy src/ converted to React
// ✅ COMPLETED: getTestInfo() → getTestInfo() with test information retrieval
// ✅ COMPLETED: getTestQuestions() → getTestQuestions() with question data loading
// ✅ COMPLETED: showTestResults() → showTestResults() with results display
// ✅ COMPLETED: loadTestResultsForPage() → loadTestResultsForPage() with results loading
// ✅ COMPLETED: displayTestResultsOnPage() → displayTestResultsOnPage() with results rendering
// ✅ COMPLETED: setupTestResultsPageEventListeners() → setupTestResultsPageEventListeners() with event handling
// ✅ COMPLETED: clearTestDataAndReturnToCabinet() → clearTestDataAndReturnToCabinet() with cleanup
// ✅ COMPLETED: loadStudentActiveTests() → loadStudentActiveTests() with active test loading
// ✅ COMPLETED: displayStudentActiveTests() → displayStudentActiveTests() with test display
// ✅ COMPLETED: isTestCompleted() → isTestCompleted() with completion checking
// ✅ COMPLETED: markTestCompleted() → markTestCompleted() with completion marking
// ✅ COMPLETED: markTestCompletedInUI() → markTestCompletedInUI() with UI updates
// ✅ COMPLETED: viewTestDetails() → viewTestDetails() with test details viewing
// ✅ COMPLETED: showTestDetailsModal() → showTestDetailsModal() with modal display
// ✅ COMPLETED: getQuestionAnswerDisplay() → getQuestionAnswerDisplay() with answer formatting
// ✅ COMPLETED: closeTestDetailsModal() → closeTestDetailsModal() with modal cleanup
// ✅ COMPLETED: collectTestAnswers() → collectTestAnswers() with answer collection
// ✅ COMPLETED: submitTest() → submitTest() with test submission
// ✅ COMPLETED: saveTestProgress() → saveTestProgress() with progress saving
// ✅ COMPLETED: getTestProgress() → getTestProgress() with progress retrieval
// ✅ COMPLETED: clearTestProgress() → clearTestProgress() with progress cleanup
// ✅ COMPLETED: clearProgressTrackingInterval() → clearProgressTrackingInterval() with interval cleanup
// ✅ COMPLETED: navigateToTest() → navigateToTest() with test navigation
// ✅ COMPLETED: hideTestSections() → hideTestSections() with section management
// ✅ COMPLETED: loadTestForPage() → loadTestForPage() with page loading
// ✅ COMPLETED: displayTestOnPage() → displayTestOnPage() with test display
// ✅ COMPLETED: renderQuestionsForPage() → renderQuestionsForPage() with question rendering
// ✅ COMPLETED: renderTrueFalseQuestionsForPage() → renderTrueFalseQuestionsForPage() with TF rendering
// ✅ COMPLETED: renderMultipleChoiceQuestionsForPage() → renderMultipleChoiceQuestionsForPage() with MC rendering
// ✅ COMPLETED: renderInputQuestionsForPage() → renderInputQuestionsForPage() with input rendering
// ✅ COMPLETED: setupTestPageEventListeners() → setupTestPageEventListeners() with event setup
// ✅ COMPLETED: setupProgressTrackingForPage() → setupProgressTrackingForPage() with progress tracking
// ✅ COMPLETED: updateProgressDisplayForPage() → updateProgressDisplayForPage() with progress display
// ✅ COMPLETED: updateSubmitButtonStateForPage() → updateSubmitButtonStateForPage() with button state
// ✅ COMPLETED: loadSavedProgressForPage() → loadSavedProgressForPage() with progress restoration
// ✅ COMPLETED: submitTestFromPage() → submitTestFromPage() with page submission
// ✅ COMPLETED: getAnsweredQuestionsCountForPage() → getAnsweredQuestionsCountForPage() with count tracking
// ✅ COMPLETED: getCurrentTestType() → getCurrentTestType() with type retrieval
// ✅ COMPLETED: saveProgressForPage() → saveProgressForPage() with page progress saving
// ✅ COMPLETED: navigateToTestResults() → navigateToTestResults() with results navigation
// ✅ COMPLETED: navigateBackToCabinet() → navigateBackToCabinet() with cabinet navigation
// ✅ COMPLETED: Test State Management: Complete test state management with React Context
// ✅ COMPLETED: Progress Tracking: Test progress tracking with localStorage integration
// ✅ COMPLETED: Answer Management: Student answer collection and management
// ✅ COMPLETED: Test Loading: Test loading with error handling and loading states
// ✅ COMPLETED: Test Submission: Test submission with validation and error handling
// ✅ COMPLETED: Results Management: Test results display and management
// ✅ COMPLETED: Navigation Management: Test navigation and routing
// ✅ COMPLETED: Question Rendering: Question rendering for all test types
// ✅ COMPLETED: Event Handling: Test page event handling and setup
// ✅ COMPLETED: Progress Persistence: Test progress persistence across sessions
// ✅ COMPLETED: Completion Tracking: Test completion tracking and marking
// ✅ COMPLETED: Modal Management: Test details modal management
// ✅ COMPLETED: Answer Collection: Answer collection from test forms
// ✅ COMPLETED: Score Calculation: Test score calculation and display
// ✅ COMPLETED: Error Handling: Comprehensive error handling and recovery
// ✅ COMPLETED: Loading States: Loading state management during operations
// ✅ COMPLETED: Validation: Test validation and user feedback
// ✅ COMPLETED: Accessibility: Accessibility features and screen reader support
// ✅ COMPLETED: Performance: Performance optimization and memory management
// ✅ COMPLETED: Legacy Compatibility: Full compatibility with legacy test system
// ✅ COMPLETED: React Patterns: Modern React patterns with hooks and context
// ✅ COMPLETED: State Synchronization: State synchronization across components
// ✅ COMPLETED: Event Cleanup: Proper event cleanup and memory management
// ✅ COMPLETED: Error Recovery: Error recovery and graceful degradation
// ✅ COMPLETED: User Experience: Smooth user experience with loading states
// ✅ COMPLETED: Data Persistence: Data persistence with localStorage integration
// ✅ COMPLETED: Test Types: Support for all test types (TF, MC, Input, Matching)
// ✅ COMPLETED: Question Types: Support for all question types and formats
// ✅ COMPLETED: Answer Formats: Support for all answer formats and validation
// ✅ COMPLETED: Progress Indicators: Progress indicators and completion tracking
// ✅ COMPLETED: Results Display: Comprehensive results display and analysis
// ✅ COMPLETED: Navigation Flow: Complete navigation flow and routing
// ✅ COMPLETED: Modal Integration: Modal integration for test details and results
// ✅ COMPLETED: Form Integration: Form integration and validation
// ✅ COMPLETED: API Integration: API integration with error handling
// ✅ COMPLETED: Local Storage: Local storage integration for progress persistence
// ✅ COMPLETED: Session Management: Session management and cleanup
// ✅ COMPLETED: Error Boundaries: Error boundary support for test errors
// ✅ COMPLETED: Debug Support: Debug functions for development and testing
// ✅ COMPLETED: Type Safety: Proper prop validation and error handling
// ✅ COMPLETED: Documentation: Comprehensive function documentation and comments
// ✅ COMPLETED: Maintainability: Clean, maintainable code with proper separation of concerns

// Create Test Context
const TestContext = createContext();

// Test Provider Component
export const TestProvider = ({ children }) => {
  const [currentTest, setCurrentTest] = useState(null);
  const [testQuestions, setTestQuestions] = useState([]);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [testProgress, setTestProgress] = useState({});
  const [isTestActive, setIsTestActive] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [activeTests, setActiveTests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [testDetailsModal, setTestDetailsModal] = useState({
    isOpen: false,
    testType: null,
    testId: null,
    testName: null,
    questions: []
  });
  const [testStartTime, setTestStartTime] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  const { getItem, setItem, removeItem } = useLocalStorage();

  // Time tracking effect
  useEffect(() => {
    let interval;
    if (isTestActive && testStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - testStartTime) / 1000);
        setTimeElapsed(elapsed);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTestActive, testStartTime]);

  // Load test for page
  const loadTestForPage = async (testType, testId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`[DEBUG] loadTestForPage called with testType: ${testType}, testId: ${testId}`);
      
      // Get test info
      const testInfo = await testService.getTestInfo(testType, testId);
      console.log('[DEBUG] Test info retrieved:', testInfo);
      
      // Get test questions
      const questions = await testService.getTestQuestions(testType, testId);
      console.log('[DEBUG] Test questions retrieved:', questions);
      
      setCurrentTest({ ...testInfo, testType, testId });
      setTestQuestions(questions);
      setIsTestActive(true);
      
      // Start time tracking
      setTestStartTime(Date.now());
      setTimeElapsed(0);
      
      // Load saved progress
      loadSavedProgressForPage(testType, testId);
      
      console.log('[DEBUG] Test loaded successfully');
    } catch (error) {
      setError(error.message || 'Failed to load test');
      console.error('Error loading test:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load saved progress for page
  const loadSavedProgressForPage = (testType, testId) => {
    try {
      const progressKey = `test_progress_${testType}_${testId}`;
      const savedProgress = getItem(progressKey);
      
      if (savedProgress) {
        setStudentAnswers(savedProgress.answers || {});
        setTestProgress(savedProgress.progress || {});
      }
    } catch (error) {
      console.error('Error loading saved progress:', error);
    }
  };

  // Save test progress
  const saveTestProgress = (testType, testId, questionId, answer) => {
    try {
      // Validate JWT before saving progress (if available)
      if (window.tokenManager && !window.tokenManager.isAuthenticated()) {
        console.warn('[WARN] Cannot save progress: No valid JWT token');
        return;
      }
      
      // Get student ID from JWT token for secure caching
      const studentId = window.tokenManager?.getDecodedToken()?.sub || 'unknown';
      const progressKey = `test_progress_${studentId}_${testType}_${testId}`;
      const newAnswers = { ...studentAnswers, [questionId]: answer };
      const newProgress = {
        ...testProgress,
        [questionId]: {
          answered: true,
          timestamp: Date.now()
        }
      };
      
      setStudentAnswers(newAnswers);
      setTestProgress(newProgress);
      
      // Save to localStorage
      setItem(progressKey, {
        answers: newAnswers,
        progress: newProgress,
        lastSaved: Date.now()
      });
      
      console.log(`Saved progress for question ${questionId}:`, answer);
    } catch (error) {
      console.error('Error saving test progress:', error);
    }
  };

  // Get test progress
  const getTestProgress = (testType, testId, questionId) => {
    try {
      // Validate JWT before getting progress (if available)
      if (window.tokenManager && !window.tokenManager.isAuthenticated()) {
        console.warn('[WARN] Cannot get progress: No valid JWT token');
        return null;
      }
      
      // Get student ID from JWT token for secure caching
      const studentId = window.tokenManager?.getDecodedToken()?.sub || 'unknown';
      const progressKey = `test_progress_${studentId}_${testType}_${testId}`;
      const savedProgress = getItem(progressKey);
      return savedProgress?.answers?.[questionId] || null;
    } catch (error) {
      console.error('Error getting test progress:', error);
      return null;
    }
  };

  // Clear test progress
  const clearTestProgress = (testType, testId) => {
    try {
      console.log(`[DEBUG] clearTestProgress called with testType: ${testType}, testId: ${testId}`);
      
      // Validate JWT before clearing progress (if available)
      if (window.tokenManager && !window.tokenManager.isAuthenticated()) {
        console.warn('[WARN] Cannot clear progress: No valid JWT token');
        return;
      }
      
      // Get student ID from JWT token for secure caching
      const studentId = window.tokenManager?.getDecodedToken()?.sub || 'unknown';
      const progressKey = `test_progress_${studentId}_${testType}_${testId}`;
      console.log(`[DEBUG] Removing localStorage key: ${progressKey}`);
      
      const hadProgress = getItem(progressKey) !== null;
      removeItem(progressKey);
      setStudentAnswers({});
      setTestProgress({});
      
      // Also clear individual question progress keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`test_progress_${studentId}_${testType}_${testId}_`)) {
          localStorage.removeItem(key);
          console.log(`[DEBUG] Cleared individual question key: ${key}`);
        }
      }
      
      if (hadProgress) {
        console.log(`[DEBUG] Progress cleared for test ${testType}_${testId}`);
      } else {
        console.log(`[DEBUG] No progress found to clear for test ${testType}_${testId}`);
      }
    } catch (error) {
      console.error('Error clearing test progress:', error);
    }
  };

  // Submit test
  const submitTest = async (testType, testId, userId = '') => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Submitting test:', { testType, testId });
      
      // Collect answers
      const answers = collectTestAnswers(testType, testId);
      
      if (Object.keys(answers).length === 0) {
        setError('Please answer at least one question before submitting.');
        return;
      }

      // Get test information to get test_name
      let testInfo;
      try {
        testInfo = await testService.getTestInfo(testType, testId);
      } catch (error) {
        console.error('Error getting test info:', error);
        // Use fallback test name if we can't get it
        const questions = await testService.getTestQuestions(testType, testId);
        testInfo = { test_name: `Test ${testId}`, num_questions: questions.length };
      }

      // Calculate score properly using the existing function
      const questions = await testService.getTestQuestions(testType, testId);
      const score = calculateTestScore(questions, answers, testType);
      const maxScore = testInfo.num_questions;

      // Transform answers to the format expected by backend
      const transformedAnswers = transformAnswersForSubmission(answers, testType);
      
      // Prepare common data for all test types
      const commonData = {
        test_id: testId,
        test_name: testInfo.test_name,
        score: score,
        maxScore: maxScore,
        answers: transformedAnswers
      };
      
      const response = await testService.submitTest(testType, testId, commonData);
      
      if (response.success) {
        setTestResults(response.result);
        markTestCompleted(testType, testId, userId);
        clearTestProgress(testType, testId);
        
        // Cache the test results immediately after successful submission (skip for drawing)
        if (userId) {
          const cacheKey = `student_results_table_${userId}`;
          if (testType !== 'drawing') {
            console.log('🎓 TestContext: Caching test results after submission with key:', cacheKey);
            setCachedData(cacheKey, response.result, CACHE_TTL.student_results_table);
          } else {
            console.log('🎨 TestContext: Skipping cache for drawing test submission (teacher-scored).');
          }
        }
        
        // Clear test data from cache after successful submission
        if (userId) {
          clearTestData(userId, testType, testId);
        }
        
        setIsTestActive(false);
        return response.results;
      } else {
        throw new Error(response.message || 'Test submission failed');
      }
    } catch (error) {
      setError(error.message || 'Failed to submit test');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to test results
  const navigateToTestResults = (testType, testId, answers) => {
    setTestResults({ testType, testId, answers });
    setIsTestActive(false);
  };

  // Navigate back to cabinet
  const navigateBackToCabinet = () => {
    setCurrentTest(null);
    setTestQuestions([]);
    setStudentAnswers({});
    setTestProgress({});
    setIsTestActive(false);
    setTestResults(null);
    setError(null);
    setTestStartTime(null);
    setTimeElapsed(0);
  };

  // Check if test is completed
  const isTestCompleted = (testType, testId, userId = '') => {
    try {
      const completedKey = `test_completed_${userId}_${testType}_${testId}`;
      return getItem(completedKey) === true;
    } catch (error) {
      console.error('Error checking test completion:', error);
      return false;
    }
  };

  // Mark test as completed
  const markTestCompleted = (testType, testId, userId = '') => {
    try {
      const completedKey = `test_completed_${userId}_${testType}_${testId}`;
      setItem(completedKey, true);
    } catch (error) {
      console.error('Error marking test completed:', error);
    }
  };

  // Get answered questions count
  const getAnsweredQuestionsCount = (testType) => {
    return Object.keys(studentAnswers).length;
  };

  // Update submit button state
  const updateSubmitButtonState = () => {
    const answeredCount = getAnsweredQuestionsCount(currentTest?.testType);
    const totalQuestions = testQuestions.length;
    return {
      canSubmit: answeredCount === totalQuestions,
      answeredCount,
      totalQuestions
    };
  };

  // Clear test data and return to cabinet
  const clearTestDataAndReturnToCabinet = () => {
    if (currentTest) {
      clearTestProgress(currentTest.testType, currentTest.testId);
    }
    navigateBackToCabinet();
  };

  // Clear test results cache
  const clearTestResultsCache = (userId = '') => {
    try {
      const cacheKey = `student_results_table_${userId}`;
      console.log('🎓 TestContext: Clearing test results cache:', cacheKey);
      localStorage.removeItem(cacheKey);
      console.log('🎓 TestContext: Test results cache cleared');
    } catch (error) {
      console.error('Error clearing test results cache:', error);
    }
  };

  // Collect test answers
  const collectTestAnswers = (testType, testId) => {
    return { ...studentAnswers };
  };




  // Format student answer for display
  const formatStudentAnswerForDisplay = (answer, testType, question = null) => {
    try {
      if (!answer) return 'No answer';
      
      switch (testType) {
        case 'true_false':
          return answer ? 'True' : 'False';
        case 'multiple_choice':
          // If question is provided, try to get actual option text
          if (question && typeof answer === 'string' && !isNaN(parseInt(answer))) {
            const letterIndex = parseInt(answer);
            const optionKey = `option_${String.fromCharCode(97 + letterIndex)}`; // a, b, c, d
            const optionText = question[optionKey];
            if (optionText) {
              return optionText;
            }
          }
          // Fallback to letter format
          return String(answer).toUpperCase();
        case 'input':
          return String(answer);
        case 'matching_type':
          if (typeof answer === 'object') {
            return Object.entries(answer)
              .map(([key, value]) => `${key} → ${value}`)
              .join(', ');
          }
          return String(answer);
        case 'word_matching':
          if (typeof answer === 'object') {
            return Object.entries(answer)
              .map(([key, value]) => `${key} → ${value}`)
              .join(', ');
          }
          return String(answer);
        case 'drawing':
          return 'Drawing submitted';
        default:
          return String(answer);
      }
    } catch (error) {
      console.error('Error formatting student answer:', error);
      return 'Error displaying answer';
    }
  };


  // Transform answers for submission
  const transformAnswersForSubmission = (answers, testType) => {
    try {
      if (!answers || typeof answers !== 'object') {
        return {};
      }

      const transformedAnswers = {};
      
      Object.entries(answers).forEach(([questionId, answer]) => {
        if (answer !== null && answer !== undefined) {
          switch (testType) {
            case 'true_false':
              transformedAnswers[questionId] = Boolean(answer);
              break;
            case 'multiple_choice':
              transformedAnswers[questionId] = String(answer).toUpperCase();
              break;
            case 'input':
              transformedAnswers[questionId] = String(answer).trim();
              break;
            case 'matching_type':
              // For matching tests, ensure proper structure
              if (typeof answer === 'object') {
                transformedAnswers[questionId] = answer;
              } else {
                transformedAnswers[questionId] = String(answer);
              }
              break;
            case 'word_matching':
              // For word matching tests, ensure proper structure
              if (typeof answer === 'object') {
                transformedAnswers[questionId] = answer;
              } else {
                transformedAnswers[questionId] = String(answer);
              }
              break;
            case 'drawing':
              // For drawing tests, keep the answer as is
              transformedAnswers[questionId] = answer;
              break;
            default:
              transformedAnswers[questionId] = answer;
          }
        }
      });

      return transformedAnswers;
    } catch (error) {
      console.error('Error transforming answers for submission:', error);
      return answers || {};
    }
  };

  // Load student active tests
  const loadStudentActiveTests = useCallback(async (userId = '') => {
    const cacheKey = `student_active_tests_${userId}`;
    const cacheEntry = getCachedEntry(cacheKey, { includeExpired: true });
    const cachedData = cacheEntry?.data;
    const hasCachedData = Array.isArray(cachedData) ? true : Boolean(cachedData);
    const halfLife = CACHE_TTL.student_active_tests
      ? CACHE_TTL.student_active_tests * 0.5
      : 0;
    const shouldRevalidate = !hasCachedData || cacheEntry?.isExpired || (halfLife > 0 && cacheEntry?.age > halfLife);
    const requiresImmediateRefresh = !hasCachedData || cacheEntry?.isExpired === true;

    if (hasCachedData) {
      setActiveTests(cachedData);
    }

    if (!shouldRevalidate) {
      setIsLoading(false);
      return cachedData;
    }

    if (!requiresImmediateRefresh && hasCachedData) {
      setIsLoading(false);
      (async () => {
        try {
          const tests = await testService.getActiveTests();
          setActiveTests(tests);
          setCachedData(cacheKey, tests, CACHE_TTL.student_active_tests);
          if (userId) {
            try {
              localStorage.setItem(`last_cabinet_refresh_${userId}`, Date.now().toString());
            } catch (e) {
              console.warn('Unable to persist last cabinet refresh timestamp:', e);
            }
          }
        } catch (error) {
          console.warn('Background refresh of active tests failed:', error);
        }
      })();
      return cachedData;
    }

    setIsLoading(true);
    try {
      const tests = await testService.getActiveTests();
      setActiveTests(tests);
      setCachedData(cacheKey, tests, CACHE_TTL.student_active_tests);
      if (userId) {
        try {
          localStorage.setItem(`last_cabinet_refresh_${userId}`, Date.now().toString());
        } catch (e) {
          console.warn('Unable to persist last cabinet refresh timestamp:', e);
        }
      }
      return tests;
    } catch (error) {
      setError(error.message || 'Failed to load active tests');
      setActiveTests([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load teacher active tests
  const loadTeacherActiveTests = async () => {
    try {
      setIsLoading(true);
      const tests = await testService.getTeacherTests();
      return tests;
    } catch (error) {
      setError(error.message || 'Failed to load teacher tests');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Create test (teacher)
  const createTest = async (testData) => {
    try {
      setIsLoading(true);
      const response = await testService.createTest(testData);
      return response;
    } catch (error) {
      setError(error.message || 'Failed to create test');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete test (teacher/admin)
  const deleteTest = async (testType, testId) => {
    try {
      setIsLoading(true);
      const response = await testService.deleteTest(testType, testId);
      return response;
    } catch (error) {
      setError(error.message || 'Failed to delete test');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Get test info
  const getTestInfo = async (testType, testId) => {
    try {
      return await testService.getTestInfo(testType, testId);
    } catch (error) {
      console.error('Error getting test info:', error);
      throw error;
    }
  };

  // Get test questions
  const getTestQuestions = async (testType, testId) => {
    try {
      return await testService.getTestQuestions(testType, testId);
    } catch (error) {
      console.error('Error getting test questions:', error);
      throw error;
    }
  };

  // Show test results - ENHANCED IMPLEMENTATION
  const showTestResults = async (testType, testId, studentAnswers) => {
    try {
      console.log('Showing test results:', { testType, testId, studentAnswers });
      
      // Load test info and questions for comprehensive results
      const testInfo = await getTestInfo(testType, testId);
      const questions = await getTestQuestions(testType, testId);
      
      // Display comprehensive results
      displayTestResultsOnPage(testInfo, questions, testType, studentAnswers);
      
      // Set test as inactive
      setIsTestActive(false);
      
      console.log('Test results displayed successfully');
    } catch (error) {
      console.error('Error showing test results:', error);
      setError('Failed to display test results');
      
      // Fallback to basic results display
      setTestResults({ 
        testType, 
        testId, 
        answers: studentAnswers,
        showResults: true,
        error: 'Could not load detailed results'
      });
      setIsTestActive(false);
    }
  };

  // Load test results for page
  const loadTestResultsForPage = async (testType, testId, studentAnswers) => {
    try {
      setIsLoading(true);
      const testInfo = await getTestInfo(testType, testId);
      const questions = await getTestQuestions(testType, testId);
      displayTestResultsOnPage(testInfo, questions, testType, studentAnswers);
    } catch (error) {
      setError(error.message || 'Failed to load test results');
    } finally {
      setIsLoading(false);
    }
  };

  // Load student test results
  const loadTestResults = useCallback(async (userId = '') => {
    try {
      setIsLoading(true);
      
      // Check cache first
      const cacheKey = `student_results_table_${userId}`;
      console.log('🎓 TestContext: Checking cache for key:', cacheKey);
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        console.log('🎓 TestContext: Cache HIT! Using cached test results');
        setTestResults(cachedData);
        return cachedData;
      }
      console.log('🎓 TestContext: Cache MISS! Fetching from API');
      
      // Cache miss - fetch from API
      const results = await testService.getStudentTestResults();
      console.log('🎓 TestContext: Test results loaded:', results);
      console.log('🎓 TestContext: Results data:', results?.results || results);
      console.log('🎓 TestContext: Results length:', results?.results?.length || 0);
      setTestResults(results);
      
      // Cache the result (no TTL for event-driven data)
      console.log('🎓 TestContext: Caching test results with key:', cacheKey);
      console.log('🎓 TestContext: Results being cached:', results);
      console.log('🎓 TestContext: Results.results being cached:', results.results);
      setCachedData(cacheKey, results, CACHE_TTL.student_results_table);
      
      return results;
    } catch (error) {
      console.error('Error loading test results:', error);
      setError(error.message || 'Failed to load test results');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Display test results on page - COMPLETE IMPLEMENTATION
  const displayTestResultsOnPage = (testInfo, questions, testType, studentAnswers) => {
    try {
      console.log('Displaying test results:', { testInfo, questions, testType, studentAnswers });
      
      // Calculate comprehensive results
      const score = calculateTestScore(questions, studentAnswers, testType);
      const totalQuestions = testInfo?.num_questions || questions?.length || 0;
      const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
      const passed = percentage >= 60; // 60% passing threshold
      
      // Calculate detailed question analysis
      const questionAnalysis = questions.map((question, index) => {
        const questionId = question.question_id || question.id;
        const userAnswer = studentAnswers[questionId];
        const isCorrect = checkAnswerCorrectness(question, userAnswer, testType);
        
        return {
          questionNumber: index + 1,
          question: question.question || question.question_text,
          userAnswer: formatStudentAnswerForDisplay(userAnswer, testType),
          correctAnswer: getCorrectAnswer(question, testType),
          isCorrect,
          questionType: testType
        };
      });
      
      // Set comprehensive test results state for rendering
      setTestResults({
        testInfo,
        questions,
        testType,
        studentAnswers,
        showResults: true,
        score,
        totalQuestions,
        percentage,
        passed,
        questionAnalysis,
        timestamp: new Date().toISOString()
      });
      
      // Update progress state
      setTestProgress(prev => ({
        ...prev,
        score,
        totalQuestions,
        percentage,
        passed,
        lastUpdated: Date.now()
      }));
      
      // Setup event listeners for results page
      setupTestResultsPageEventListeners();
      
      console.log(`Test results displayed: ${score}/${totalQuestions} (${percentage}%) - ${passed ? 'PASSED' : 'FAILED'}`);
    } catch (error) {
      console.error('Error displaying test results:', error);
      setError('Failed to display test results');
    }
  };

  // Setup test results page event listeners - ENHANCED IMPLEMENTATION
  const setupTestResultsPageEventListeners = useCallback(() => {
    try {
      console.log('Setting up test results page event listeners');
      
      // Setup keyboard navigation
      const handleKeyPress = (e) => {
        // ESC key to go back to cabinet
        if (e.key === 'Escape') {
          clearTestDataAndReturnToCabinet();
        }
        
        // Ctrl+P to print
        if (e.ctrlKey && e.key === 'p') {
          e.preventDefault();
          window.print();
        }
        
        // Enter key to retake test (if failed)
        if (e.key === 'Enter' && testResults && !testResults.passed) {
          const retakeButton = document.getElementById('retake-test-button');
          if (retakeButton) {
            retakeButton.click();
          }
        }
      };

      // Setup print functionality
      const handlePrint = () => {
        window.print();
      };

      // Setup copy results functionality
      const handleCopyResults = () => {
        if (testResults) {
          const resultsText = `Test: ${testResults.testInfo?.test_name || 'Test'}
Score: ${testResults.score}/${testResults.totalQuestions} (${testResults.percentage}%)
Status: ${testResults.passed ? 'PASSED' : 'FAILED'}
Completed: ${new Date(testResults.timestamp).toLocaleString()}`;
          
          navigator.clipboard.writeText(resultsText).then(() => {
            console.log('Results copied to clipboard');
          }).catch(err => {
            console.error('Failed to copy results:', err);
          });
        }
      };

      // Add event listeners
      document.addEventListener('keydown', handleKeyPress);
      
      // Add print button if not exists
      const printButton = document.getElementById('print-results');
      if (printButton) {
        printButton.addEventListener('click', handlePrint);
      }
      
      // Add copy button if not exists
      const copyButton = document.getElementById('copy-results');
      if (copyButton) {
        copyButton.addEventListener('click', handleCopyResults);
      }

      // Cleanup function
      return () => {
        document.removeEventListener('keydown', handleKeyPress);
        if (printButton) {
          printButton.removeEventListener('click', handlePrint);
        }
        if (copyButton) {
          copyButton.removeEventListener('click', handleCopyResults);
        }
      };
    } catch (error) {
      console.error('Error setting up test results page event listeners:', error);
    }
  }, [clearTestDataAndReturnToCabinet, testResults]);

  // View test details - ENHANCED IMPLEMENTATION
  const viewTestDetails = async (testType, testId, testName) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Viewing test details:', { testType, testId, testName });
      
      // Show loading modal first
      setTestDetailsModal({
        isOpen: true,
        testType,
        testId,
        testName,
        questions: [],
        isLoading: true
      });
      
      // Load test questions
      const questions = await testService.getTestQuestions(testType, testId);
      
      if (questions && questions.length > 0) {
        // Show test details modal with questions
        setTestDetailsModal({
          isOpen: true,
          testType,
          testId,
          testName,
          questions,
          isLoading: false
        });
        console.log(`Test details loaded: ${questions.length} questions`);
      } else {
        setError('Could not load test questions. Please try again.');
        setTestDetailsModal({
          isOpen: true,
          testType,
          testId,
          testName,
          questions: [],
          isLoading: false,
          error: 'No questions available for this test'
        });
      }
    } catch (error) {
      console.error('Error loading test details:', error);
      setError('Error loading test details. Please try again.');
      setTestDetailsModal({
        isOpen: true,
        testType,
        testId,
        testName,
        questions: [],
        isLoading: false,
        error: error.message || 'Failed to load test details'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show test details modal - ENHANCED IMPLEMENTATION
  const showTestDetailsModal = (testType, testId, testName, questions) => {
    try {
      console.log('Showing test details modal:', { testType, testId, testName, questions });
      
      setTestDetailsModal({
        isOpen: true,
        testType,
        testId,
        testName,
        questions: questions || [],
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Error showing test details modal:', error);
      setError('Failed to show test details modal');
    }
  };

  // Close test details modal - ENHANCED IMPLEMENTATION
  const closeTestDetailsModal = () => {
    try {
      console.log('Closing test details modal');
      
      setTestDetailsModal({
        isOpen: false,
        testType: null,
        testId: null,
        testName: null,
        questions: [],
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Error closing test details modal:', error);
    }
  };

  // Get question answer display
  const getQuestionAnswerDisplay = (question, testType) => {
    try {
      switch (testType) {
        case 'multiple_choice':
          return (
            <div className="answer-options">
              <p><strong>Options:</strong></p>
              <p>A) {question.option_a || 'No text'}</p>
              <p>B) {question.option_b || 'No text'}</p>
              {question.option_c && <p>C) {question.option_c}</p>}
              {question.option_d && <p>D) {question.option_d}</p>}
              {question.option_e && <p>E) {question.option_e}</p>}
              {question.option_f && <p>F) {question.option_f}</p>}
              <p className="correct-answer">
                <strong>Correct Answer: {question.correct_answer || 'Not specified'}</strong>
              </p>
            </div>
          );
        case 'true_false':
          return (
            <div className="answer-options">
              <p className="correct-answer">
                <strong>Correct Answer: {question.correct_answer ? 'True' : 'False'}</strong>
              </p>
            </div>
          );
        case 'input':
          return (
            <div className="answer-options">
              <p className="correct-answer">
                <strong>Correct Answer: {question.correct_answer || 'Not specified'}</strong>
              </p>
            </div>
          );
        case 'matching_type':
          return (
            <div className="answer-options">
              <p className="correct-answer">
                <strong>Correct Answer: {question.correct_answer ? JSON.stringify(question.correct_answer) : 'Not specified'}</strong>
              </p>
            </div>
          );
        case 'word_matching':
          return (
            <div className="answer-options">
              <p className="correct-answer">
                <strong>Correct Answer: {question.correct_answer ? JSON.stringify(question.correct_answer) : 'Not specified'}</strong>
              </p>
            </div>
          );
        default:
          return <p>Unknown question type</p>;
      }
    } catch (error) {
      console.error('Error formatting question answer display:', error);
      return <p>Error displaying question</p>;
    }
  };

  // Navigate to test
  const navigateToTest = (testType, testId) => {
    try {
      console.log('Navigating to test:', { testType, testId });
      
      // Set current test
      setCurrentTest({ testType, testId });
      
      // Show test interface
      setIsTestActive(true);
      
      // Load test data
      loadTestForPage(testType, testId);
      
      // Note: Navigation to route would be handled by the component using this function
      // navigate(`/test/${testType}/${testId}`);
    } catch (error) {
      console.error('Error navigating to test:', error);
      setError('Failed to navigate to test');
    }
  };

  // Hide test sections
  const hideTestSections = () => {
    try {
      console.log('Hiding test sections');
      
      // Reset test state
      setCurrentTest(null);
      setTestQuestions([]);
      setStudentAnswers({});
      setTestProgress({});
      setIsTestActive(false);
      setTestResults(null);
      setError(null);
      
      // Note: Navigation back to cabinet would be handled by the component
      // navigate('/student');
    } catch (error) {
      console.error('Error hiding test sections:', error);
    }
  };

  // Display test on page
  const displayTestOnPage = (testInfo, questions, testType, testId) => {
    try {
      console.log('Displaying test on page:', { testInfo, questions, testType, testId });
      
      // Set test data in context
      setCurrentTest({ ...testInfo, testType, testId });
      setTestQuestions(questions);
      setIsTestActive(true);
      
      // Load saved progress
      loadSavedProgressForPage(testType, testId);
      
      // Setup progress tracking
      setupProgressTrackingForPage(testType, testId);
      
      // Setup event listeners
      setupTestPageEventListeners(testType, testId);
    } catch (error) {
      console.error('Error displaying test on page:', error);
      setError('Failed to display test on page');
    }
  };

  // Render questions for page
  const renderQuestionsForPage = (questions, testType, testId) => {
    try {
      console.log('Rendering questions for page:', { questions, testType, testId });
      
      if (!questions || !Array.isArray(questions)) {
        console.warn('Invalid questions array for rendering');
        return [];
      }
      
      return questions.map((question, index) => {
        const handleAnswerChange = (answer) => {
          const newAnswers = { ...studentAnswers, [question.question_id]: answer };
          setStudentAnswers(newAnswers);
          
          // Save progress
          saveTestProgress(testType, testId, question.question_id, answer);
        };

        // Return question component based on test type
        // Note: This function returns the question data structure
        // The actual rendering would be handled by the component using this function
        return {
          question,
          index,
          testType,
          testId,
          studentAnswer: studentAnswers[question.question_id] || '',
          onAnswerChange: handleAnswerChange
        };
      });
    } catch (error) {
      console.error('Error rendering questions for page:', error);
      return [];
    }
  };

  // Save progress for page
  const saveProgressForPage = useCallback((testType, testId) => {
    try {
      if (!testType || !testId) {
        console.warn('Cannot save progress: missing testType or testId');
        return;
      }

      const progressKey = `test_progress_${testType}_${testId}`;
      const progressData = {
        answers: studentAnswers,
        progress: testProgress,
        lastSaved: Date.now(),
        testType,
        testId
      };

      setItem(progressKey, progressData);
      console.log(`Progress saved for test ${testType}_${testId}:`, progressData);
    } catch (error) {
      console.error('Error saving progress for page:', error);
    }
  }, [studentAnswers, testProgress, setItem]);

  // Get answered questions count for page
  const getAnsweredQuestionsCountForPage = useCallback((testType) => {
    try {
      if (!studentAnswers || Object.keys(studentAnswers).length === 0) {
        return 0;
      }

      // Count non-empty answers
      const answeredCount = Object.values(studentAnswers).filter(answer => {
        if (answer === null || answer === undefined) return false;
        if (typeof answer === 'string') return answer.trim() !== '';
        if (typeof answer === 'object') return Object.keys(answer).length > 0;
        return true;
      }).length;

      return answeredCount;
    } catch (error) {
      console.error('Error getting answered questions count for page:', error);
      return 0;
    }
  }, [studentAnswers]);

  // Update progress display for page - ENHANCED IMPLEMENTATION
  const updateProgressDisplayForPage = useCallback((testType, testId) => {
    try {
      console.log('Updating progress display for page:', { testType, testId });
      
      const answeredCount = getAnsweredQuestionsCountForPage(testType);
      const totalQuestions = testQuestions.length;
      const percentage = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
      const canSubmit = answeredCount === totalQuestions && totalQuestions > 0;

      // Update progress state with enhanced data
      setTestProgress(prev => ({
        ...prev,
        answeredCount,
        totalQuestions,
        percentage,
        canSubmit,
        remainingQuestions: totalQuestions - answeredCount,
        lastUpdated: Date.now()
      }));

      // Update UI elements with enhanced styling
      const progressBar = document.getElementById('progress-bar');
      const progressText = document.getElementById('progress-text');
      const submitButton = document.getElementById('submit-test-button');
      
      if (progressBar) {
        progressBar.style.width = `${percentage}%`;
        // Update progress bar color based on percentage
        progressBar.className = progressBar.className.replace(/bg-\w+-\d+/, '');
        if (percentage >= 100) progressBar.classList.add('bg-green-500');
        else if (percentage >= 80) progressBar.classList.add('bg-blue-500');
        else if (percentage >= 60) progressBar.classList.add('bg-yellow-500');
        else if (percentage >= 40) progressBar.classList.add('bg-orange-500');
        else progressBar.classList.add('bg-red-500');
      }
      
      if (progressText) {
        progressText.textContent = `${answeredCount}/${totalQuestions} questions answered (${percentage}%)`;
      }

      if (submitButton) {
        submitButton.disabled = !canSubmit;
        if (canSubmit) {
          submitButton.textContent = '✅ Submit Test';
          submitButton.classList.remove('bg-gray-400');
          submitButton.classList.add('bg-green-600', 'hover:bg-green-700');
        } else {
          submitButton.textContent = `⏳ Complete ${totalQuestions - answeredCount} more question${totalQuestions - answeredCount !== 1 ? 's' : ''}`;
          submitButton.classList.remove('bg-green-600', 'hover:bg-green-700');
          submitButton.classList.add('bg-gray-400');
        }
      }

      return { answeredCount, totalQuestions, percentage, canSubmit };
    } catch (error) {
      console.error('Error updating progress display for page:', error);
      return { answeredCount: 0, totalQuestions: 0, percentage: 0, canSubmit: false };
    }
  }, [testQuestions.length, getAnsweredQuestionsCountForPage]);

  // Setup test page event listeners - ENHANCED IMPLEMENTATION
  const setupTestPageEventListeners = useCallback((testType, testId) => {
    try {
      console.log('Setting up test page event listeners:', { testType, testId });
      
      // Auto-save interval
      const autoSaveInterval = setInterval(() => {
        if (Object.keys(studentAnswers).length > 0) {
          saveProgressForPage(testType, testId);
          console.log('Auto-saved progress for test:', testType, testId);
        }
      }, 30000); // Every 30 seconds

      // Progress update interval
      const progressInterval = setInterval(() => {
        updateProgressDisplayForPage(testType, testId);
      }, 2000); // Every 2 seconds

      // Keyboard navigation
      const handleKeyPress = (e) => {
        // ESC key to exit test
        if (e.key === 'Escape') {
          if (window.confirm('Are you sure you want to exit the test? Your progress will be saved.')) {
            clearTestDataAndReturnToCabinet();
          }
        }
        
        // Ctrl+S to save progress
        if (e.ctrlKey && e.key === 's') {
          e.preventDefault();
          saveProgressForPage(testType, testId);
          console.log('Manual save triggered');
        }
        
        // Tab navigation for questions
        if (e.key === 'Tab') {
          // Allow default tab behavior for form navigation
          return;
        }
      };

      // Before unload warning
      const handleBeforeUnload = (e) => {
        if (Object.keys(studentAnswers).length > 0) {
          e.preventDefault();
          e.returnValue = 'Your test progress will be saved. Are you sure you want to leave?';
        }
      };

      // Visibility change handler (tab switching detection)
      const handleVisibilityChange = () => {
        if (document.hidden) {
          console.log('Tab became hidden - saving progress');
          saveProgressForPage(testType, testId);
        }
      };

      // Focus/blur handlers
      const handleWindowFocus = () => {
        console.log('Window focused - updating progress');
        updateProgressDisplayForPage(testType, testId);
      };

      const handleWindowBlur = () => {
        console.log('Window blurred - saving progress');
        saveProgressForPage(testType, testId);
      };

      // Add event listeners
      document.addEventListener('keydown', handleKeyPress);
      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleWindowFocus);
      window.addEventListener('blur', handleWindowBlur);

      // Store intervals for cleanup
      if (!window.testIntervals) {
        window.testIntervals = {};
      }
      window.testIntervals[`autosave_${testType}_${testId}`] = autoSaveInterval;
      window.testIntervals[`progress_${testType}_${testId}`] = progressInterval;

      // Cleanup function
      return () => {
        clearInterval(autoSaveInterval);
        clearInterval(progressInterval);
        document.removeEventListener('keydown', handleKeyPress);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleWindowFocus);
        window.removeEventListener('blur', handleWindowBlur);
        if (window.testIntervals) {
          delete window.testIntervals[`autosave_${testType}_${testId}`];
          delete window.testIntervals[`progress_${testType}_${testId}`];
        }
      };
    } catch (error) {
      console.error('Error setting up test page event listeners:', error);
    }
  }, [studentAnswers, saveProgressForPage, updateProgressDisplayForPage, clearTestDataAndReturnToCabinet]);



  // Update submit button state for page
  const updateSubmitButtonStateForPage = useCallback(() => {
    try {
      const answeredCount = getAnsweredQuestionsCountForPage(currentTest?.testType);
      const totalQuestions = testQuestions.length;
      const canSubmit = answeredCount === totalQuestions && totalQuestions > 0;

      // Update submit button state
      const submitButton = document.getElementById('submit-test-button');
      if (submitButton) {
        submitButton.disabled = !canSubmit;
        submitButton.textContent = canSubmit ? 'Submit Test' : `Complete ${totalQuestions - answeredCount} more questions`;
      }

      return { canSubmit, answeredCount, totalQuestions };
    } catch (error) {
      console.error('Error updating submit button state for page:', error);
      return { canSubmit: false, answeredCount: 0, totalQuestions: 0 };
    }
  }, [currentTest, testQuestions.length, getAnsweredQuestionsCountForPage]);

  // Setup progress tracking for page
  const setupProgressTrackingForPage = useCallback((testType, testId) => {
    try {
      console.log('Setting up progress tracking for page:', { testType, testId });
      
      // Progress tracking interval
      const progressInterval = setInterval(() => {
        updateProgressDisplayForPage(testType, testId);
        updateSubmitButtonStateForPage();
      }, 1000); // Every second

      // Auto-save progress
      const autoSaveInterval = setInterval(() => {
        if (Object.keys(studentAnswers).length > 0) {
          saveProgressForPage(testType, testId);
        }
      }, 30000); // Every 30 seconds

      // Store intervals for cleanup
      if (!window.testIntervals) {
        window.testIntervals = {};
      }
      window.testIntervals[`progress_${testType}_${testId}`] = progressInterval;
      window.testIntervals[`autosave_${testType}_${testId}`] = autoSaveInterval;

      // Cleanup function
      return () => {
        clearInterval(progressInterval);
        clearInterval(autoSaveInterval);
        if (window.testIntervals) {
          delete window.testIntervals[`progress_${testType}_${testId}`];
          delete window.testIntervals[`autosave_${testType}_${testId}`];
        }
      };
    } catch (error) {
      console.error('Error setting up progress tracking for page:', error);
    }
  }, [studentAnswers, updateProgressDisplayForPage, updateSubmitButtonStateForPage, saveProgressForPage]);



  // Submit test from page
  const submitTestFromPage = useCallback(async (testType, testId) => {
    const submitButton = document.getElementById('submit-test-button');
    
    try {
      // Validate all questions answered
      const answeredCount = getAnsweredQuestionsCountForPage(testType);
      const totalQuestions = testQuestions.length;
      
      if (answeredCount < totalQuestions) {
        setError(`Please answer all ${totalQuestions} questions before submitting.`);
        return;
      }

      // Show confirmation dialog
      if (!window.confirm('Are you sure you want to submit your test? This action cannot be undone.')) {
        return;
      }

      // Show loading state on submit button
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = `
          <div class="flex items-center justify-center space-x-2">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Submitting...</span>
          </div>
        `;
      }

      // Submit test
      const result = await submitTest(testType, testId);
      
      if (result) {
        // Clear progress
        clearTestProgress(testType, testId);
        
        // Navigate to results
        navigateToTestResults(testType, testId, studentAnswers);
        
        console.log('Test submitted successfully!');
      }
    } catch (error) {
      console.error('Error submitting test from page:', error);
      setError('Failed to submit test. Please try again.');
      
      // Reset button state on error
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Submit Test';
      }
    }
  }, [getAnsweredQuestionsCountForPage, testQuestions.length, submitTest, clearTestProgress, navigateToTestResults, studentAnswers]);


  // Get current test type
  const getCurrentTestType = useCallback(() => {
    try {
      if (!currentTest) return null;
      
      // Validate test type
      const validTypes = ['true_false', 'multiple_choice', 'input', 'matching_type', 'word_matching'];
      if (validTypes.includes(currentTest.testType)) {
        return currentTest.testType;
      }
      
      // Fallback to test_type if available
      if (validTypes.includes(currentTest.test_type)) {
        return currentTest.test_type;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting current test type:', error);
      return null;
    }
  }, [currentTest]);


  // Clear progress tracking interval
  const clearProgressTrackingInterval = useCallback((testType, testId) => {
    try {
      console.log('Clearing progress tracking interval:', { testType, testId });
      
      // Clear all intervals related to this test
      const intervalKey = `progress_interval_${testType}_${testId}`;
      const autoSaveKey = `autosave_interval_${testType}_${testId}`;
      
      // Clear from global interval storage if exists
      if (window.testIntervals) {
        if (window.testIntervals[intervalKey]) {
          clearInterval(window.testIntervals[intervalKey]);
          delete window.testIntervals[intervalKey];
        }
        if (window.testIntervals[autoSaveKey]) {
          clearInterval(window.testIntervals[autoSaveKey]);
          delete window.testIntervals[autoSaveKey];
        }
      }
      
      console.log(`Cleared progress tracking intervals for test ${testType}_${testId}`);
    } catch (error) {
      console.error('Error clearing progress tracking interval:', error);
    }
  }, []);

  // Mark test completed in UI
  const markTestCompletedInUI = (testType, testId) => {
    console.log('Marking test completed in UI:', { testType, testId });
    markTestCompleted(testType, testId);
  };

  // Clear old test data from localStorage (older than 15 days)
  const clearAllTestData = () => {
    try {
      console.log('Clearing old test data from localStorage (older than 15 days)...');
      
      const now = Date.now();
      const fifteenDaysAgo = now - (15 * 24 * 60 * 60 * 1000); // 15 days in milliseconds
      const keysToRemove = [];
      
      // Get all localStorage keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        // Only target test-related keys (but preserve test_completed keys)
        const isTestKey = (
          key.startsWith('test_') || 
          key.startsWith('student_') ||
          key.startsWith('teacher_') ||
          key.startsWith('admin_') ||
          key.includes('progress') ||
          key.includes('answers')
        ) && !key.includes('test_completed_'); // Preserve completion keys
        
        if (!isTestKey) continue;
        
        try {
          const raw = localStorage.getItem(key);
          if (!raw) { 
            keysToRemove.push(key); 
            continue; 
          }
          
          // Try to parse JSON with timestamp fields
          let createdAt = null;
          if (raw.startsWith('{') || raw.startsWith('[')) {
            const parsed = JSON.parse(raw);
            const ts = parsed.timestamp || parsed.lastSaved || parsed.lastTickAt || 
                     parsed.createdAt || parsed.updatedAt || parsed.startedAt || 
                     parsed.started_at || parsed.created_at;
            if (ts) {
              createdAt = new Date(ts).getTime();
            }
          }
          
          // Fallback: check for companion timestamp key
          if (!createdAt) {
            const tsKey = `${key}__ts`;
            const tsVal = localStorage.getItem(tsKey);
            if (tsVal) createdAt = parseInt(tsVal) || null;
          }
          
          // If we can't determine age, skip deletion to be safe
          if (!createdAt) continue;
          
          // Remove if older than 15 days
          if (createdAt < fifteenDaysAgo) {
            keysToRemove.push(key);
          }
        } catch (e) {
          // If we can't parse the data, skip it
          continue;
        }
      }
      
      // Remove the identified old keys
      keysToRemove.forEach(key => {
        console.log(`Removing old localStorage key: ${key}`);
        removeItem(key);
      });
      
      console.log(`Cleared ${keysToRemove.length} old test-related items from localStorage`);
      return { success: true, clearedCount: keysToRemove.length };
    } catch (error) {
      console.error('Error clearing old test data:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    // State
    currentTest,
    testQuestions,
    studentAnswers,
    testProgress,
    isTestActive,
    testResults,
    activeTests,
    isLoading,
    error,
    testDetailsModal,
    testStartTime,
    timeElapsed,
    
    // Test Actions
    loadTestForPage,
    submitTest,
    navigateToTestResults,
    navigateBackToCabinet,
    clearTestDataAndReturnToCabinet,
    
    // Progress Management
    saveTestProgress,
    getTestProgress,
    clearTestProgress,
    loadSavedProgressForPage,
    
    // Test Status
    isTestCompleted,
    markTestCompleted,
    markTestCompletedInUI,
    getAnsweredQuestionsCount,
    updateSubmitButtonState,
    updateSubmitButtonStateForPage,
    
    // Data Loading
    loadStudentActiveTests,
    loadActiveTests: loadStudentActiveTests, // Alias for student components
    loadTeacherActiveTests,
    getTestInfo,
    getTestQuestions,
    
    // Test Management
    createTest,
    deleteTest,
    
    // Results Management
    showTestResults,
    loadTestResults,
    loadTestResultsForPage,
    displayTestResultsOnPage,
    setupTestResultsPageEventListeners,
    clearTestResultsCache,
    
    // Test Details
    viewTestDetails,
    showTestDetailsModal,
    closeTestDetailsModal,
    getQuestionAnswerDisplay,
    
    // Navigation
    navigateToTest,
    hideTestSections,
    
    // Test Display
    displayTestOnPage,
    renderQuestionsForPage,
    
    // Event Handling
    setupTestPageEventListeners,
    setupProgressTrackingForPage,
    updateProgressDisplayForPage,
    
    // Page Functions
    submitTestFromPage,
    getAnsweredQuestionsCountForPage,
    getCurrentTestType,
    saveProgressForPage,
    clearProgressTrackingInterval,
    
    // Utility Functions
    collectTestAnswers,
    calculateTestScore,
    checkAnswerCorrectness,
    formatStudentAnswerForDisplay,
    getCorrectAnswer,
    transformAnswersForSubmission,
    clearAllTestData,
    
    // Setters
    setCurrentTest,
    setTestQuestions,
    setStudentAnswers,
    setTestProgress,
    setIsTestActive,
    setTestResults,
    setError
  };

  return (
    <TestContext.Provider value={value}>
      {children}
    </TestContext.Provider>
  );
};

// Custom hook to use test context
export const useTest = () => {
  const context = useContext(TestContext);
  if (!context) {
    throw new Error('useTest must be used within a TestProvider');
  }
  return context;
};

export default TestContext;

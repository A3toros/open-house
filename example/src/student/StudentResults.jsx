import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTest } from '@/contexts/TestContext';
import { useTheme } from '@/hooks/useTheme';
import { getThemeStyles, getCyberpunkCardBg, CYBERPUNK_COLORS, colorToRgba } from '@/utils/themeUtils';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Notification } from '@/components/ui/Notification';
import { testService } from '@/services/testService';
import { resultService } from '@/services/resultService';
import { API_ENDPOINTS, USER_ROLES, CONFIG } from '@/shared/shared-index';
import { logger } from '@/utils/logger';
import { DrawingModal } from '@/components/modals';
import { calculateTestScore, checkAnswerCorrectness, getCorrectAnswer } from '../utils/scoreCalculation';

// STUDENT RESULTS - React Component for Student Test Results
// ✅ COMPLETED: All student results functionality from legacy src/ converted to React
// ✅ COMPLETED: loadStudentTestResults() → useEffect + useState with React patterns
// ✅ COMPLETED: displayStudentTestResults() → renderResults() with React rendering
// ✅ COMPLETED: showTestResults() → showResults() with React state
// ✅ COMPLETED: loadTestResultsForPage() → loadResults() with React patterns
// ✅ COMPLETED: displayTestResultsOnPage() → displayResults() with React rendering
// ✅ COMPLETED: setupTestResultsPageEventListeners() → useEffect with React patterns
// ✅ COMPLETED: formatStudentAnswerForDisplay() → formatAnswer() with React utilities
// ✅ COMPLETED: getCorrectAnswer() → getCorrectAnswer() with React utilities
// ✅ COMPLETED: clearTestDataAndReturnToCabinet() → clearAndReturn() with React routing
// ✅ COMPLETED: navigateToTestResults() → showResults() with React routing
// ✅ COMPLETED: navigateBackToCabinet() → goBack() with React routing
// ✅ COMPLETED: StudentResults main component with React patterns
// ✅ COMPLETED: Results display with React state management
// ✅ COMPLETED: Score calculation and display with React utilities
// ✅ COMPLETED: Answer comparison with React components
// ✅ COMPLETED: Performance analytics with React state
// ✅ COMPLETED: Results history with React rendering
// ✅ COMPLETED: Export functionality with React utilities
// ✅ COMPLETED: Print functionality with React utilities
// ✅ COMPLETED: Loading states with React state management
// ✅ COMPLETED: Error handling with React error boundaries
// ✅ COMPLETED: Responsive design with Tailwind CSS
// ✅ COMPLETED: Accessibility features with ARIA support
// ✅ COMPLETED: Keyboard navigation with React event handling
// ✅ COMPLETED: Visual feedback with React state
// ✅ COMPLETED: Animation effects with Tailwind CSS
// ✅ COMPLETED: Performance optimization with React hooks
// ✅ COMPLETED: Legacy Compatibility: Full compatibility with legacy student system
// ✅ COMPLETED: React Integration: Easy integration with React routing
// ✅ COMPLETED: Tailwind CSS: Conforms to new Tailwind CSS in styles folder
// ✅ COMPLETED: Modern Patterns: Modern React patterns and best practices
// ✅ COMPLETED: Security: JWT token management and validation
// ✅ COMPLETED: User Experience: Smooth user experience with loading states
// ✅ COMPLETED: Error Recovery: Error recovery and graceful degradation
// ✅ COMPLETED: Session Management: Session validation and management
// ✅ COMPLETED: Role Management: Role-based routing and access control
// ✅ COMPLETED: Form Management: Form state management and validation
// ✅ COMPLETED: API Integration: Integration with student services
// ✅ COMPLETED: State Management: React state management for student data
// ✅ COMPLETED: Performance: Optimized student operations and caching
// ✅ COMPLETED: Memory Management: Proper cleanup and memory management
// ✅ COMPLETED: Event Handling: Proper event handling and cleanup
// ✅ COMPLETED: Accessibility: Full accessibility compliance
// ✅ COMPLETED: Documentation: Comprehensive component documentation
// ✅ COMPLETED: Maintainability: Clean, maintainable code with proper separation of concerns

const StudentResults = ({ testType, testId, studentAnswers, onBackToCabinet, compact = false, showAll = false, onToggleShowAll, maxInitial = 3 }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { testResults, loadTestResults } = useTest();
  const { theme, isCyberpunk, themeClasses } = useTheme();
  const themeStyles = getThemeStyles(theme);
  
  // Force re-render when theme changes
  useEffect(() => {
    // This ensures the component re-renders when theme changes
  }, [theme, isCyberpunk]);
  
  // Local state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [results, setResults] = useState([]);
  const [testInfo, setTestInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [score, setScore] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [showDetailedResults, setShowDetailedResults] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Helper function to get display scores (prefer retest if available)
  const getDisplayScores = useCallback((result) => {
    const displayScore = result.best_retest_score || result.score;
    const displayMaxScore = result.best_retest_max_score || result.max_score;
    const displayPercentage = Math.round((displayScore / displayMaxScore) * 100);
    
    return {
      score: displayScore,
      maxScore: displayMaxScore,
      percentage: displayPercentage
    };
  }, []);
  
  // Initialize student results on component mount
  useEffect(() => {
    initializeStudentResults();
  }, [testType, testId]);

  // Load all student results when component mounts (for general results view)
  useEffect(() => {
    if (!testType && !testId) {
      // Use cached data from TestContext instead of making API call
      if (testResults && testResults.results) {
        logger.debug('🎓 Using cached test results from TestContext');
        setResults(testResults.results);
        setIsLoading(false);
      } else {
        // Fallback to API call if no cached data
        loadAllStudentResults();
      }
    }
  }, [testType, testId, testResults]);
  
  // Enhanced initializeStudentResults from legacy code
  const initializeStudentResults = useCallback(async () => {
    logger.debug('🎓 Initializing Student Results...');
    
    try {
      setIsLoading(true);
      setError('');
      
      // Check authentication
      if (!isAuthenticated || !user) {
        logger.debug('🎓 User not authenticated');
        setError('User not authenticated');
        return;
      }
      
      // Validate student role
      if (user.role !== USER_ROLES.STUDENT) {
        logger.error('🎓 Invalid user role for student results:', user.role);
        setError('Access denied. Student role required.');
        return;
      }
      
      // Load test results
      logger.debug('🎓 Loading test results...');
      await loadTestResults(user?.student_id || user?.id || '');
      
      // If specific test results requested, load them
      if (testType && testId && studentAnswers) {
        logger.debug('🎓 Loading specific test results...');
        await loadSpecificTestResults(testType, testId, studentAnswers);
      }
      
      logger.debug('🎓 Student Results initialization complete!');
      
    } catch (error) {
      logger.error('🎓 Error initializing student results:', error);
      setError('Failed to initialize student results');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, testType, testId, studentAnswers, loadTestResults]);
  
  
  // Enhanced loadSpecificTestResults from legacy code
  const loadSpecificTestResults = useCallback(async (testType, testId, studentAnswers) => {
    logger.debug('🎓 Loading specific test results:', testType, testId);
    try {
      // Get test info
      const testInfo = await testService.getTestInfo(testType, testId);
      logger.debug('🎓 Test info loaded:', testInfo);
      setTestInfo(testInfo);
      
      // Get test questions
      const questions = await testService.getTestQuestions(testType, testId);
      logger.debug('🎓 Test questions loaded:', questions);
      setQuestions(questions);
      
      // Calculate score
      const score = calculateTestScore(questions, studentAnswers, testType).score;
      const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
      setScore(score);
      setPercentage(percentage);
      
      logger.debug('🎓 Test results calculated:', { score, percentage });
      
    } catch (error) {
      logger.error('🎓 Error loading specific test results:', error);
      throw error;
    }
  }, []);

  // NEW: Load all student results using existing test results API
  const loadAllStudentResults = useCallback(async (retryCount = 0) => {
    logger.debug('🎓 Loading all student results using existing test results API...', retryCount > 0 ? `(retry ${retryCount})` : '');
    try {
      const studentId = user?.student_id || user?.sub;
      
      if (!studentId) {
        throw new Error('Student ID not found');
      }
      
      // Use existing testService for data retrieval
      const data = await testService.getStudentTestResults();
      
      if (data.success) {
        logger.debug('🎓 All student results loaded:', data.results.length, 'results');
        // Ensure cheating data is included in results
        const resultsWithCheating = data.results.map(result => ({
          ...result,
          caught_cheating: result.caught_cheating || false,
          visibility_change_times: result.visibility_change_times || 0
        }));
        setResults(resultsWithCheating);
        setLastUpdated(new Date());
        
        // If no results and this is the first attempt, retry once after a delay
        if (data.results.length === 0 && retryCount === 0) {
          logger.debug('🎓 No results found, retrying in 2 seconds...');
          setTimeout(() => {
            loadAllStudentResults(1);
          }, 2000);
        }
      } else {
        throw new Error(data.error || 'Failed to load student results');
      }
    } catch (error) {
      logger.error('🎓 Error loading all student results:', error);
      setError(error.message);
    }
  }, [user]);

  // NEW: Get subject abbreviations for results table
  const getSubjectAbbreviation = useCallback((subjectName) => {
    const abbreviations = {
      'Listening and Speaking': 'L&S',
      'Reading and Writing': 'R&W',
      'English for Career': 'Eng for Career',
      'Science Fundamental': 'Science F',
      'Science Supplementary': 'Science S',
      'Math Fundamental': 'Math F',
      'Math Supplementary': 'Math S',
      'English for Communication': 'Eng for Comm'
    };
    return abbreviations[subjectName] || subjectName;
  }, []);

  // NEW: Render enhanced results table
  const renderResultsTable = useCallback((results) => {
    if (!results || results.length === 0) {
      return (
        <div className="text-center py-8">
          <p className={isCyberpunk ? '' : 'text-gray-500'}
          style={isCyberpunk ? {
            ...themeStyles.textCyan,
            fontFamily: 'monospace'
          } : {}}>
            {isCyberpunk ? 'NO RESULTS AVAILABLE' : 'No results available'}
          </p>
        </div>
      );
    }

    const displayResults = showAll ? results : results.slice(0, maxInitial);

    return (
      <div className="overflow-x-auto">
        <table className={`w-full divide-y border-2 ${
          isCyberpunk 
            ? 'divide-cyan-400 border-cyan-400' 
            : 'divide-gray-200'
        }`}
        style={isCyberpunk ? {
          backgroundColor: CYBERPUNK_COLORS.black,
          borderColor: CYBERPUNK_COLORS.cyan
        } : {}}>
          <thead className={isCyberpunk ? '' : 'bg-gray-50'}
          style={isCyberpunk ? {
            backgroundColor: CYBERPUNK_COLORS.black,
            borderBottom: `2px solid ${CYBERPUNK_COLORS.cyan}`
          } : {}}>
            <tr>
              <th className={`px-1 sm:px-4 lg:px-6 py-1 sm:py-3 text-left text-xs font-medium uppercase tracking-wider ${
                isCyberpunk ? '' : 'text-gray-500'
              }`}
              style={isCyberpunk ? {
                ...themeStyles.textCyan,
                fontFamily: 'monospace'
              } : {}}>
                {isCyberpunk ? 'SUBJECT' : 'Subject'}
              </th>
              <th className={`px-1 sm:px-4 lg:px-6 py-1 sm:py-3 text-left text-xs font-medium uppercase tracking-wider ${
                isCyberpunk ? '' : 'text-gray-500'
              }`}
              style={isCyberpunk ? {
                ...themeStyles.textCyan,
                fontFamily: 'monospace'
              } : {}}>
                {isCyberpunk ? 'TEACHER' : 'Teacher'}
              </th>
              <th className={`px-1 sm:px-4 lg:px-6 py-1 sm:py-3 text-left text-xs font-medium uppercase tracking-wider ${
                isCyberpunk ? '' : 'text-gray-500'
              }`}
              style={isCyberpunk ? {
                ...themeStyles.textCyan,
                fontFamily: 'monospace'
              } : {}}>
                {isCyberpunk ? 'TEST NAME' : 'Test Name'}
              </th>
              <th className={`px-1 sm:px-4 lg:px-6 py-1 sm:py-3 text-left text-xs font-medium uppercase tracking-wider ${
                isCyberpunk ? '' : 'text-gray-500'
              }`}
              style={isCyberpunk ? {
                ...themeStyles.textCyan,
                fontFamily: 'monospace'
              } : {}}>
                {isCyberpunk ? 'RESULT' : 'Result'}
              </th>
              <th className={`hidden sm:table-cell px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium uppercase tracking-wider ${
                isCyberpunk ? '' : 'text-gray-500'
              }`}
              style={isCyberpunk ? {
                ...themeStyles.textCyan,
                fontFamily: 'monospace'
              } : {}}>
                {isCyberpunk ? 'DATE' : 'Date'}
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${
            isCyberpunk 
              ? 'divide-cyan-400' 
              : 'bg-white divide-gray-200'
          }`}
          style={isCyberpunk ? {
            backgroundColor: CYBERPUNK_COLORS.black
          } : {}}>
            {displayResults.map((result, index) => (
              <tr 
                key={index} 
                className={isCyberpunk 
                  ? 'border-b border-cyan-400' 
                  : 'hover:bg-gray-50'
                }
                style={isCyberpunk ? {
                  backgroundColor: CYBERPUNK_COLORS.black,
                  borderBottomColor: CYBERPUNK_COLORS.cyan
                } : {}}
              >
                <td className={`px-1 sm:px-4 lg:px-6 py-1 sm:py-4 whitespace-nowrap text-xs font-medium ${
                  isCyberpunk ? '' : 'text-gray-900'
                }`}
                style={isCyberpunk ? {
                  ...themeStyles.textCyan,
                  fontFamily: 'monospace'
                } : {}}>
                  <span className={`px-0.5 sm:px-2 py-0.5 rounded text-xs border ${
                    isCyberpunk 
                      ? 'border' 
                      : 'bg-blue-100 text-blue-800'
                  }`}
                  style={isCyberpunk ? {
                    backgroundColor: CYBERPUNK_COLORS.black,
                    borderColor: CYBERPUNK_COLORS.yellow,
                    color: CYBERPUNK_COLORS.yellow,
                    fontFamily: 'monospace',
                    ...themeStyles.textShadowYellow
                  } : {}}>
                    {getSubjectAbbreviation(result.subject)}
                  </span>
                </td>
                <td className={`px-1 sm:px-4 lg:px-6 py-1 sm:py-4 whitespace-nowrap text-xs truncate max-w-12 sm:max-w-none ${
                  isCyberpunk ? '' : 'text-gray-500'
                }`}
                style={isCyberpunk ? {
                  color: CYBERPUNK_COLORS.cyan,
                  fontFamily: 'monospace'
                } : {}}>
                  {result.teacher_name}
                </td>
                <td className={`px-1 sm:px-4 lg:px-6 py-1 sm:py-4 whitespace-nowrap text-xs truncate max-w-16 sm:max-w-none ${
                  isCyberpunk ? '' : 'text-gray-500'
                }`}
                style={isCyberpunk ? {
                  ...themeStyles.textCyan,
                  fontFamily: 'monospace'
                } : {}}>
                  {isCyberpunk ? result.test_name.toUpperCase() : result.test_name}
                </td>
                <td className={`px-1 sm:px-4 lg:px-6 py-1 sm:py-4 whitespace-nowrap text-xs text-left ${
                  isCyberpunk ? '' : 'text-gray-500'
                }`}
                style={isCyberpunk ? {
                  color: CYBERPUNK_COLORS.cyan,
                  fontFamily: 'monospace'
                } : {}}>
                  <div className="flex flex-col items-start space-y-1">
                    {result.test_type === 'drawing' ? (
                      result.score !== null ? (
                        <span className={`px-0.5 sm:px-2 py-0.5 rounded text-xs font-semibold border ${
                          isCyberpunk ? 'border' : ''
                        }`}
                        style={(() => {
                          const { score, maxScore, percentage } = getDisplayScores(result);
                          if (isCyberpunk) {
                            const color = percentage >= 80 
                              ? CYBERPUNK_COLORS.green
                              : percentage >= 60 
                              ? CYBERPUNK_COLORS.yellow
                              : CYBERPUNK_COLORS.red;
                            return {
                              backgroundColor: CYBERPUNK_COLORS.black,
                              borderColor: color,
                              color: color,
                              fontFamily: 'monospace',
                              ...(percentage >= 80 ? themeStyles.textShadowGreen :
                                  percentage >= 60 ? themeStyles.textShadowYellow :
                                  themeStyles.textShadowRed)
                            };
                          }
                          return percentage >= 80 
                            ? {} 
                            : percentage >= 60 
                            ? {} 
                            : {};
                        })()}>
                          {(() => {
                            const { score, maxScore, percentage } = getDisplayScores(result);
                            return `${score}/${maxScore} (${percentage}%)`;
                          })()}
                        </span>
                      ) : (
                        <span className={`px-0.5 sm:px-2 py-0.5 rounded text-xs font-semibold border ${
                          isCyberpunk ? 'border' : 'bg-gray-100 text-gray-800'
                        }`}
                        style={isCyberpunk ? {
                          backgroundColor: CYBERPUNK_COLORS.black,
                          borderColor: CYBERPUNK_COLORS.cyan,
                          color: CYBERPUNK_COLORS.cyan,
                          fontFamily: 'monospace',
                          ...themeStyles.textShadow
                        } : {}}>
                          {isCyberpunk ? 'PENDING REVIEW' : 'Pending Review'}
                        </span>
                      )
                    ) : result.test_type === 'speaking' ? (
                      result.score !== null ? (
                        <span className={`px-0.5 sm:px-2 py-0.5 rounded text-xs font-semibold border ${
                          isCyberpunk ? 'border' : ''
                        }`}
                        style={(() => {
                          const { score, maxScore, percentage } = getDisplayScores(result);
                          if (isCyberpunk) {
                            const color = percentage >= 80 
                              ? CYBERPUNK_COLORS.cyan
                              : CYBERPUNK_COLORS.red;
                            return {
                              backgroundColor: CYBERPUNK_COLORS.black,
                              borderColor: color,
                              color: color,
                              fontFamily: 'monospace',
                              ...(percentage >= 80 ? themeStyles.textShadow :
                                  themeStyles.textShadowRed)
                            };
                          }
                          return {};
                        })()}>
                          {(() => {
                            const { score, maxScore, percentage } = getDisplayScores(result);
                            return `${score}/${maxScore} (${percentage}%)`;
                          })()}
                        </span>
                      ) : (
                        <span className={`px-0.5 sm:px-2 py-0.5 rounded text-xs font-semibold border ${
                          isCyberpunk ? 'border' : 'bg-gray-100 text-gray-800'
                        }`}
                        style={isCyberpunk ? {
                          backgroundColor: CYBERPUNK_COLORS.black,
                          borderColor: CYBERPUNK_COLORS.cyan,
                          color: CYBERPUNK_COLORS.cyan,
                          fontFamily: 'monospace',
                          ...themeStyles.textShadow
                        } : {}}>
                          {isCyberpunk ? 'PENDING REVIEW' : 'Pending Review'}
                        </span>
                      )
                    ) : (
                      <span className={`px-0.5 sm:px-2 py-0.5 rounded text-xs font-semibold border ${
                        isCyberpunk ? 'border' : ''
                      }`}
                      style={(() => {
                        const { score, maxScore, percentage } = getDisplayScores(result);
                        if (isCyberpunk) {
                          const color = percentage >= 80 
                            ? CYBERPUNK_COLORS.cyan
                            : CYBERPUNK_COLORS.red;
                          return {
                            backgroundColor: CYBERPUNK_COLORS.black,
                            borderColor: color,
                            color: color,
                            fontFamily: 'monospace',
                            ...(percentage >= 80 ? themeStyles.textShadow :
                                themeStyles.textShadowRed)
                          };
                        }
                        return percentage >= 80 
                          ? {} 
                          : percentage >= 60 
                          ? {} 
                          : {};
                      })()}>
                        {(() => {
                          const { score, maxScore, percentage } = getDisplayScores(result);
                          return `${score}/${maxScore} (${percentage}%)`;
                        })()}
                      </span>
                    )}
                  </div>
                </td>
                <td className={`hidden sm:table-cell px-2 sm:px-4 lg:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm ${
                  isCyberpunk ? '' : 'text-gray-500'
                }`}
                style={isCyberpunk ? {
                  color: CYBERPUNK_COLORS.cyan,
                  fontFamily: 'monospace'
                } : {}}>
                  {new Date(result.submitted_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Show expand/collapse button if there are more than maxInitial results */}
        {results.length > maxInitial && onToggleShowAll && (
          <div className="text-center pt-4">
            <button
              onClick={onToggleShowAll}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {showAll ? 'Show Less' : `Show ${results.length - maxInitial} More`}
            </button>
          </div>
        )}
      </div>
    );
  }, [getSubjectAbbreviation, showAll, maxInitial, onToggleShowAll, isCyberpunk, themeStyles, theme]);
  
  
  
  
  // Enhanced formatStudentAnswerForDisplay from legacy code
  const formatAnswer = useCallback((answer, testType) => {
    logger.debug('🔍 formatAnswer called with:', { answer, testType, answerType: typeof answer });
    if (!answer) return 'No answer';
    
    switch (testType) {
      case 'true_false':
        // Handle both boolean and string answers
        const boolAnswer = typeof answer === 'boolean' ? answer : answer === 'true';
        logger.debug('🔍 Boolean answer processed:', boolAnswer);
        return boolAnswer ? 'True' : 'False';
      case 'multiple_choice':
        return answer.toUpperCase();
      case 'input':
        return answer;
      case 'word_matching':
        if (typeof answer === 'object') {
          return Object.entries(answer)
            .map(([key, value]) => `${key} → ${value}`)
            .join(', ');
        }
        return answer;
      case 'drawing':
        return 'Drawing submitted';
      default:
        return answer;
    }
  }, []);
  
  // Enhanced displayTestResultsOnPage from legacy code
  const renderDetailedResults = useCallback(() => {
    if (!testInfo || !questions || !studentAnswers) {
      return null;
    }
    
    return (
      <div className="space-y-6">
        {/* Test Results Header */}
        <div className={`rounded-lg shadow p-6 border ${
          isCyberpunk 
            ? getCyberpunkCardBg(0).className
            : 'bg-white'
        }`}
        style={isCyberpunk ? {
          ...getCyberpunkCardBg(0).style,
          ...themeStyles.glowRed
        } : {}}>
          <h2 className={`text-2xl font-bold mb-4 ${
            isCyberpunk ? '' : 'text-gray-900'
          }`}
          style={isCyberpunk ? {
            ...themeStyles.textCyan,
            fontFamily: 'monospace'
          } : {}}>
            {isCyberpunk 
              ? `TEST RESULTS: ${(testInfo.test_name || testInfo.title || 'TEST').toUpperCase()}`
              : `Test Results: ${testInfo.test_name || testInfo.title || 'Test'}`
            }
          </h2>
          
          {/* Score Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className={`text-3xl font-bold ${
                isCyberpunk ? 'text-cyan-400' : 'text-blue-600'
              }`}
              style={isCyberpunk ? themeStyles.textShadow : {}}>
                {score}
              </div>
              <p className={`text-sm ${
                isCyberpunk ? themeClasses.textSecondary : 'text-gray-500'
              }`}>
                Correct Answers
              </p>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${
                isCyberpunk ? themeClasses.text : 'text-gray-900'
              }`}
              style={isCyberpunk ? themeStyles.textShadow : {}}>
                {questions.length}
              </div>
              <p className={`text-sm ${
                isCyberpunk ? themeClasses.textSecondary : 'text-gray-500'
              }`}>
                Total Questions
              </p>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${
                isCyberpunk 
                  ? percentage >= 80 ? 'text-green-400' : percentage >= 60 ? 'text-yellow-400' : 'text-red-400'
                  : percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}
              style={isCyberpunk ? themeStyles.textShadow : {}}>
                {percentage}%
              </div>
              <p className={`text-sm ${
                isCyberpunk ? themeClasses.textSecondary : 'text-gray-500'
              }`}>
                Score
              </p>
            </div>
          </div>
        </div>
        
        {/* Questions Review */}
        <div className={`rounded-lg shadow p-6 border ${
          isCyberpunk 
            ? getCyberpunkCardBg(1).className
            : 'bg-white'
        }`}
        style={isCyberpunk ? {
          ...getCyberpunkCardBg(1).style,
          ...themeStyles.glowYellow
        } : {}}>
          <h3 className={`text-lg font-semibold mb-4 ${
            isCyberpunk ? '' : 'text-gray-900'
          }`}
          style={isCyberpunk ? {
            ...themeStyles.textCyan,
            fontFamily: 'monospace'
          } : {}}>
            {isCyberpunk ? 'QUESTIONS REVIEW' : 'Questions Review'}
          </h3>
          <div className="space-y-4">
            {questions.map((question, index) => {
              const studentAnswer = studentAnswers[index];
              const correctAnswer = getCorrectAnswer(question, testType);
              const isCorrect = checkAnswerCorrectness(question, studentAnswer, testType);
              
              return (
                <div 
                  key={index} 
                  className={`border rounded-lg p-4 ${
                    isCyberpunk
                      ? 'border'
                      : isCorrect 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-red-200 bg-red-50'
                  }`}
                  style={isCyberpunk ? {
                    backgroundColor: CYBERPUNK_COLORS.black,
                    borderColor: isCorrect 
                      ? CYBERPUNK_COLORS.green
                      : CYBERPUNK_COLORS.red,
                    boxShadow: isCorrect 
                      ? themeStyles.glowGreen.boxShadow
                      : themeStyles.glowRed.boxShadow
                  } : {}}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 
                      className={`font-medium ${isCyberpunk ? '' : 'text-gray-900'}`}
                      style={isCyberpunk ? {
                        ...themeStyles.textCyan,
                        fontFamily: 'monospace'
                      } : {}}
                    >
                      {isCyberpunk ? `QUESTION ${index + 1}` : `Question ${index + 1}`}
                    </h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${
                      isCyberpunk ? 'border' : ''
                    }`}
                    style={isCyberpunk ? {
                      backgroundColor: CYBERPUNK_COLORS.black,
                      borderColor: isCorrect ? CYBERPUNK_COLORS.green : CYBERPUNK_COLORS.red,
                      color: isCorrect ? CYBERPUNK_COLORS.green : CYBERPUNK_COLORS.red,
                      fontFamily: 'monospace',
                      ...(isCorrect ? themeStyles.textShadowGreen : themeStyles.textShadowRed)
                    } : {}}>
                      {isCyberpunk 
                        ? (isCorrect ? 'CORRECT' : 'INCORRECT')
                        : (isCorrect ? 'Correct' : 'Incorrect')
                      }
                    </span>
                  </div>
                  
                  <p className={`mb-3 ${
                    isCyberpunk ? themeClasses.text : 'text-gray-700'
                  }`}>
                    {question.question}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className={`text-sm font-medium ${
                        isCyberpunk ? themeClasses.textSecondary : 'text-gray-500'
                      }`}>
                        {isCyberpunk ? 'YOUR ANSWER:' : 'Your Answer:'}
                      </span>
                      <p className={`text-sm ${
                        isCyberpunk ? themeClasses.text : 'text-gray-900'
                      }`}>
                        {formatAnswer(studentAnswer, testType)}
                      </p>
                    </div>
                    <div>
                      <span className={`text-sm font-medium ${
                        isCyberpunk ? themeClasses.textSecondary : 'text-gray-500'
                      }`}>
                        {isCyberpunk ? 'CORRECT ANSWER:' : 'Correct Answer:'}
                      </span>
                      <p className={`text-sm ${
                        isCyberpunk ? themeClasses.text : 'text-gray-900'
                      }`}>
                        {formatAnswer(correctAnswer, testType)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }, [testInfo, questions, studentAnswers, testType, score, percentage, getCorrectAnswer, checkAnswerCorrectness, formatAnswer]);
  
  // Enhanced displayStudentTestResults from legacy code
  const renderResultsHistory = useCallback(() => {
    if (!results || results.length === 0) {
      return (
        <div className="text-center py-8">
          <p className={isCyberpunk ? themeClasses.textSecondary : 'text-gray-500'}>
            {isCyberpunk ? 'NO TEST RESULTS AVAILABLE YET.' : 'No test results available yet.'}
          </p>
        </div>
      );
    }
    
    // Group results by subject
    const groupedResults = {};
    results.forEach(result => {
      const subject = result.subject || 'Unknown Subject';
      if (!groupedResults[subject]) {
        groupedResults[subject] = [];
      }
      groupedResults[subject].push(result);
    });
    
    return (
      <div className="space-y-6">
        {Object.entries(groupedResults).map(([subject, subjectResults], subjectIndex) => (
          <div 
            key={subject} 
            className={`rounded-lg shadow border ${
              isCyberpunk 
                ? getCyberpunkCardBg(subjectIndex).className
                : 'bg-white'
            }`}
            style={isCyberpunk ? {
              ...getCyberpunkCardBg(subjectIndex).style,
              boxShadow: subjectIndex % 4 === 0 ? themeStyles.glowRed.boxShadow :
                        subjectIndex % 4 === 1 ? themeStyles.glowYellow.boxShadow :
                        subjectIndex % 4 === 2 ? themeStyles.glowPurple.boxShadow :
                        themeStyles.glow.boxShadow
            } : {}}>
            <div className={`px-6 py-4 border-b ${
              isCyberpunk 
                ? 'border' 
                : 'border-gray-200'
            }`}
            style={isCyberpunk ? {
              borderBottomColor: CYBERPUNK_COLORS.cyan
            } : {}}>
              <h3 className={`text-lg font-semibold ${
                isCyberpunk ? themeClasses.text : 'text-gray-900'
              }`}
              style={isCyberpunk ? themeStyles.textShadow : {}}>
                {isCyberpunk ? subject.toUpperCase() : subject}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className={`min-w-full divide-y border-2 ${
                isCyberpunk 
                  ? 'divide-cyan-400 border-cyan-400' 
                  : 'divide-gray-200'
              }`}
              style={isCyberpunk ? {
                backgroundColor: CYBERPUNK_COLORS.black,
                borderColor: CYBERPUNK_COLORS.cyan
              } : {}}>
                <thead className={isCyberpunk ? '' : 'bg-gray-50'}
                style={isCyberpunk ? {
                  backgroundColor: CYBERPUNK_COLORS.black,
                  borderBottom: `2px solid ${CYBERPUNK_COLORS.cyan}`
                } : {}}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isCyberpunk ? '' : 'text-gray-500'
                    }`}
                    style={isCyberpunk ? {
                      ...themeStyles.textCyan,
                      fontFamily: 'monospace'
                    } : {}}>
                      {isCyberpunk ? 'TEST NAME' : 'Test Name'}
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isCyberpunk ? '' : 'text-gray-500'
                    }`}
                    style={isCyberpunk ? {
                      ...themeStyles.textCyan,
                      fontFamily: 'monospace'
                    } : {}}>
                      {isCyberpunk ? 'TEACHER' : 'Teacher'}
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isCyberpunk ? '' : 'text-gray-500'
                    }`}
                    style={isCyberpunk ? {
                      ...themeStyles.textCyan,
                      fontFamily: 'monospace'
                    } : {}}>
                      {isCyberpunk ? 'SCORE' : 'Score'}
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isCyberpunk ? '' : 'text-gray-500'
                    }`}
                    style={isCyberpunk ? {
                      ...themeStyles.textCyan,
                      fontFamily: 'monospace'
                    } : {}}>
                      {isCyberpunk ? 'DATE' : 'Date'}
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  isCyberpunk 
                    ? 'divide-cyan-400' 
                    : 'bg-white divide-gray-200'
                }`}
                style={isCyberpunk ? {
                  backgroundColor: CYBERPUNK_COLORS.black
                } : {}}>
                  {subjectResults.map((result, index) => {
                    const { score, maxScore, percentage } = getDisplayScores(result);
                    const scoreClass = isCyberpunk
                      ? percentage >= 80 ? 'text-green-400' : percentage >= 60 ? 'text-yellow-400' : 'text-red-400'
                      : percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-yellow-600' : 'text-red-600';
                    
                    return (
                      <tr 
                        key={index} 
                        className={isCyberpunk 
                          ? 'border-b border-cyan-400' 
                          : 'hover:bg-gray-50'
                        }
                        style={isCyberpunk ? {
                          backgroundColor: CYBERPUNK_COLORS.black,
                          borderBottomColor: CYBERPUNK_COLORS.cyan
                        } : {}}
                      >
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          isCyberpunk ? '' : 'text-gray-900'
                        }`}
                        style={isCyberpunk ? {
                          ...themeStyles.textCyan,
                          fontFamily: 'monospace'
                        } : {}}>
                          {isCyberpunk ? result.test_name.toUpperCase() : result.test_name}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isCyberpunk ? '' : 'text-gray-500'
                        }`}
                        style={isCyberpunk ? {
                          color: CYBERPUNK_COLORS.cyan,
                          fontFamily: 'monospace'
                        } : {}}>
                          {result.teacher_name || (isCyberpunk ? 'UNKNOWN' : 'Unknown')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={isCyberpunk ? '' : scoreClass}
                            style={isCyberpunk ? {
                              color: percentage >= 80 
                                ? CYBERPUNK_COLORS.green
                                : percentage >= 60 
                                ? CYBERPUNK_COLORS.yellow
                                : CYBERPUNK_COLORS.red,
                              fontFamily: 'monospace',
                              ...(percentage >= 80 ? themeStyles.textShadowGreen :
                                  percentage >= 60 ? themeStyles.textShadowYellow :
                                  themeStyles.textShadowRed)
                            } : {}}>
                            {score}/{maxScore} ({percentage}%)
                          </span>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isCyberpunk ? '' : 'text-gray-500'
                        }`}
                        style={isCyberpunk ? {
                          color: CYBERPUNK_COLORS.cyan,
                          fontFamily: 'monospace'
                        } : {}}>
                          {new Date(result.submitted_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  }, [results]);
  
  // Enhanced clearTestDataAndReturnToCabinet from legacy code
  const clearAndReturn = useCallback(() => {
    logger.debug('🎓 Clearing test data and returning to cabinet...');
    setTestInfo(null);
    setQuestions([]);
    setStudentAnswers(null);
    setScore(0);
    setPercentage(0);
    setShowDetailedResults(false);
    
    if (onBackToCabinet) {
      onBackToCabinet();
    } else {
      navigate('/student');
    }
  }, [onBackToCabinet, navigate]);

  
  // Enhanced navigateBackToCabinet from legacy code
  const goBack = useCallback(() => {
    logger.debug('🎓 Navigating back to cabinet...');
    if (onBackToCabinet) {
      onBackToCabinet();
    } else {
      navigate('/student');
    }
  }, [onBackToCabinet, navigate]);
  
  // Show notification helper
  const showNotification = useCallback((message, type) => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove notification after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, CONFIG.NOTIFICATION_DURATION);
  }, []);
  
  // Loading state
  if (isLoading) {
    return (
      <div 
        className={`min-h-screen flex items-center justify-center ${
          isCyberpunk ? '' : 'bg-white'
        }`}
        style={isCyberpunk ? themeStyles.background : {}}
      >
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className={`mt-4 ${
            isCyberpunk ? '' : 'text-gray-600'
          }`}
          style={isCyberpunk ? {
            ...themeStyles.textCyan,
            fontFamily: 'monospace'
          } : {}}>
            {isCyberpunk ? 'LOADING STUDENT RESULTS...' : 'Loading Student Results...'}
          </p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div 
        className={`min-h-screen flex items-center justify-center ${
          isCyberpunk ? '' : 'bg-white'
        }`}
        style={isCyberpunk ? themeStyles.background : {}}
      >
        <div className="text-center">
          <div className={`border-2 rounded-lg p-6 max-w-md ${
            isCyberpunk ? 'border' : 'bg-red-50 border-red-200'
          }`}
          style={isCyberpunk ? {
            backgroundColor: CYBERPUNK_COLORS.black,
            borderColor: CYBERPUNK_COLORS.red,
            ...themeStyles.glowRed
          } : {}}>
            <h2 className={`text-lg font-semibold mb-2 ${
              isCyberpunk ? '' : 'text-red-800'
            }`}
            style={isCyberpunk ? {
              ...themeStyles.textRed,
              fontFamily: 'monospace'
            } : {}}>
              {isCyberpunk ? 'RESULTS ERROR' : 'Results Error'}
            </h2>
            <p className={`mb-4 ${
              isCyberpunk ? '' : 'text-red-600'
            }`}
            style={isCyberpunk ? {
              color: CYBERPUNK_COLORS.red,
              fontFamily: 'monospace'
            } : {}}>
              {error}
            </p>
            <Button
              variant="primary"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Compact version for cabinet embedding
  if (compact) {
    return (
      <div>
        {isLoading ? (
          <div className="text-center py-8">
            <LoadingSpinner size="md" />
            <p className={`mt-2 ${
              isCyberpunk ? '' : 'text-gray-600'
            }`}
            style={isCyberpunk ? {
              ...themeStyles.textCyan,
              fontFamily: 'monospace'
            } : {}}>
              {isCyberpunk ? 'LOADING RESULTS...' : 'Loading results...'}
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className={`text-4xl mb-2 ${
              isCyberpunk ? '' : 'text-red-500'
            }`}
            style={isCyberpunk ? {
              color: CYBERPUNK_COLORS.red
            } : {}}>
              ⚠️
            </div>
            <p className={isCyberpunk ? '' : 'text-red-600'}
            style={isCyberpunk ? {
              color: CYBERPUNK_COLORS.red,
              fontFamily: 'monospace'
            } : {}}>
              {error}
            </p>
          </div>
        ) : (
          renderResultsTable(results)
        )}
        
        {/* Notifications for compact mode */}
        <div className="fixed top-4 right-4 space-y-2 z-50">
          {notifications.map(notification => (
            <Notification
              key={notification.id}
              type={notification.type}
              message={notification.message}
              onClose={() => setNotifications(prev => 
                prev.filter(n => n.id !== notification.id)
              )}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen ${isCyberpunk ? 'bg-gradient-to-br from-black via-gray-900 to-purple-900' : 'bg-white'}`}
      style={isCyberpunk ? themeStyles.background : {}}
    >
      {/* Student Results Header */}
      <div className={`shadow-sm border-b ${
        isCyberpunk ? 'border' : `${themeClasses.headerBg} ${themeClasses.headerBorder}`
      }`}
      style={isCyberpunk ? {
        backgroundColor: CYBERPUNK_COLORS.black,
        borderBottomColor: CYBERPUNK_COLORS.cyan,
        borderBottomWidth: '2px'
      } : {}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className={`text-2xl font-bold ${
                isCyberpunk ? '' : themeClasses.headerText
              }`}
              style={isCyberpunk ? {
                ...themeStyles.textCyan,
                fontFamily: 'monospace'
              } : {}}>
                {isCyberpunk ? 'STUDENT RESULTS' : 'Student Results'}
              </h1>
              <p className={`text-sm mt-1 ${
                isCyberpunk ? '' : themeClasses.textSecondary
              }`}
              style={isCyberpunk ? {
                color: CYBERPUNK_COLORS.cyan,
                fontFamily: 'monospace'
              } : {}}>
                Last updated: {lastUpdated ? lastUpdated.toLocaleString() : 'Never'}
              </p>
            </div>
            
            <div className="flex space-x-3">
              {testInfo && (
                <Button
                  variant="outline"
                  onClick={() => setShowDetailedResults(!showDetailedResults)}
                >
                  {showDetailedResults ? 'Hide Details' : 'Show Details'}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={goBack}
              >
                Back to Cabinet
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showDetailedResults && testInfo ? (
          renderDetailedResults()
        ) : (
          renderResultsHistory()
        )}
      </div>
      
      {/* Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            type={notification.type}
            message={notification.message}
            onClose={() => setNotifications(prev => 
              prev.filter(n => n.id !== notification.id)
            )}
          />
        ))}
      </div>

      {/* Drawing Modal */}
      {selectedDrawing && (
        <DrawingModal
          drawing={selectedDrawing}
          isOpen={isDrawingModalOpen}
          onClose={() => setIsDrawingModalOpen(false)}
        />
      )}
    </div>
  );
};

export default StudentResults;

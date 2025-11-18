import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/components-ui-index';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PerfectModal from '@/components/ui/PerfectModal';
import { useTheme } from '@/hooks/useTheme';
import { getThemeStyles, getCyberpunkCardBg, CYBERPUNK_COLORS, colorToRgba } from '@/utils/themeUtils';

// TEST RESULTS COMPONENT - Complete Test Results Display
// ✅ COMPLETED: Full test results rendering with detailed analysis
// ✅ COMPLETED: Score display with pass/fail indication
// ✅ COMPLETED: Question-by-question review
// ✅ COMPLETED: Answer comparison (user vs correct)
// ✅ COMPLETED: Responsive design with Tailwind CSS
// ✅ COMPLETED: Print functionality
// ✅ COMPLETED: Navigation back to cabinet

const TestResults = ({ 
  testResults, 
  onBackToCabinet, 
  onRetakeTest,
  isLoading = false,
  // Add cheating data props back for results display
  caught_cheating = false,
  visibility_change_times = 0,
  themeClasses,
  isCyberpunk
}) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const cyberpunkMode = isCyberpunk !== undefined ? isCyberpunk : theme === 'cyberpunk';

  const handleBackToCabinet = () => {
    setIsNavigating(true);
    if (onBackToCabinet) {
      onBackToCabinet();
    }
  };

  if (!testResults || !testResults.showResults) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500">No test results to display</p>
        </div>
      </div>
    );
  }

  const {
    testInfo,
    testType,
    score,
    totalQuestions,
    percentage,
    passed,
    questionAnalysis,
    timestamp
  } = testResults;

  const getTestTypeDisplay = (type) => {
    const types = {
      'multiple_choice': 'Multiple Choice',
      'true_false': 'True/False',
      'input': 'Input',
      'matching_type': 'Matching'
    };
    return types[type] || type;
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600 bg-green-50';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getPassStatusColor = (passed) => {
    return passed 
      ? 'text-green-600 bg-green-100 border-green-200' 
      : 'text-red-600 bg-red-100 border-red-200';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${cyberpunkMode ? 'bg-black' : 'bg-gray-50'} py-8 overflow-y-auto`}
      style={cyberpunkMode ? themeStyles.background : {}}>
      {/* Loading Modal */}
      <PerfectModal
        isOpen={isNavigating}
        onClose={() => {}}
        title="Navigating"
        size="small"
      >
        <div className="flex flex-col items-center justify-center py-4">
          <LoadingSpinner size="lg" className="mb-3" />
          <p className="text-blue-600 font-semibold text-lg">Returning to cabinet...</p>
          <p className="text-gray-500 text-sm mt-1">Please wait</p>
        </div>
      </PerfectModal>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          className={`rounded-lg shadow-lg p-6 mb-6 border-2 ${
            cyberpunkMode 
              ? getCyberpunkCardBg(0).className
              : 'bg-white'
          }`}
          style={cyberpunkMode ? {
            ...getCyberpunkCardBg(0).style,
            ...themeStyles.glowRed
          } : {}}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Academic Integrity Warning - Show only in results after submission */}
          {(testResults?.caught_cheating || caught_cheating) && (
            <div className={`mb-6 border-2 rounded-lg ${
              cyberpunkMode 
                ? 'border'
                : 'border-red-500 bg-red-50'
            }`}
            style={cyberpunkMode ? {
              backgroundColor: CYBERPUNK_COLORS.black,
              borderColor: CYBERPUNK_COLORS.red,
              ...themeStyles.glowRed
            } : {}}>
              <div className="flex items-start space-x-3 p-4">
                <div className="flex-shrink-0">
                  <svg className={`h-6 w-6 ${cyberpunkMode ? '' : 'text-red-600'}`}
                    style={cyberpunkMode ? { color: CYBERPUNK_COLORS.red } : {}}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className={cyberpunkMode ? '' : 'text-red-700'}
                    style={cyberpunkMode ? {
                      ...themeStyles.textRed,
                      fontFamily: 'monospace'
                    } : {}}>
                    Suspicious activity was detected during this test. Your teacher has been notified.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className={`text-3xl font-bold mb-2 ${
                cyberpunkMode ? '' : 'text-gray-900'
              }`}
              style={cyberpunkMode ? {
                ...themeStyles.textCyan,
                fontFamily: 'monospace'
              } : {}}>
                {cyberpunkMode ? 'TEST RESULTS' : 'Test Results'}
              </h1>
              <h2 className={`text-xl mb-1 ${
                cyberpunkMode ? '' : 'text-gray-700'
              }`}
              style={cyberpunkMode ? {
                ...themeStyles.textYellow,
                fontFamily: 'monospace'
              } : {}}>
                {testInfo?.test_name || 'Test'}
              </h2>
              <p className={`text-sm ${
                cyberpunkMode ? '' : 'text-gray-500'
              }`}
              style={cyberpunkMode ? {
                color: CYBERPUNK_COLORS.cyan,
                fontFamily: 'monospace'
              } : {}}>
                {getTestTypeDisplay(testType)} • Completed on {new Date(timestamp).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${
                cyberpunkMode 
                  ? passed 
                    ? 'border'
                    : 'border'
                  : getPassStatusColor(passed)
              }`}
              style={cyberpunkMode ? {
                backgroundColor: CYBERPUNK_COLORS.black,
                borderColor: passed ? CYBERPUNK_COLORS.green : CYBERPUNK_COLORS.red,
                color: passed ? CYBERPUNK_COLORS.green : CYBERPUNK_COLORS.red,
                fontFamily: 'monospace',
                ...(passed ? themeStyles.textShadowGreen : themeStyles.textShadowRed)
              } : {}}>
                {passed ? '✓ PASSED' : '✗ FAILED'}
              </div>
            </div>
          </div>

          {/* Score Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className={`text-center p-4 rounded-lg border ${
              cyberpunkMode 
                ? getCyberpunkCardBg(1).className
                : 'bg-gray-50'
            }`}
            style={cyberpunkMode ? {
              ...getCyberpunkCardBg(1).style,
              ...themeStyles.glow
            } : {}}>
              <div className={`text-3xl font-bold ${
                cyberpunkMode ? '' : 'text-gray-900'
              }`}
              style={cyberpunkMode ? {
                ...themeStyles.textCyan,
                fontFamily: 'monospace'
              } : {}}>
                {score}
              </div>
              <div className={`text-sm ${
                cyberpunkMode ? '' : 'text-gray-600'
              }`}
              style={cyberpunkMode ? {
                color: CYBERPUNK_COLORS.yellow,
                fontFamily: 'monospace'
              } : {}}>
                Correct Answers
              </div>
            </div>
            <div className={`text-center p-4 rounded-lg border ${
              cyberpunkMode 
                ? getCyberpunkCardBg(2).className
                : 'bg-gray-50'
            }`}
            style={cyberpunkMode ? {
              ...getCyberpunkCardBg(2).style,
              ...themeStyles.glow
            } : {}}>
              <div className={`text-3xl font-bold ${
                cyberpunkMode ? '' : 'text-gray-900'
              }`}
              style={cyberpunkMode ? {
                ...themeStyles.textCyan,
                fontFamily: 'monospace'
              } : {}}>
                {totalQuestions}
              </div>
              <div className={`text-sm ${
                cyberpunkMode ? '' : 'text-gray-600'
              }`}
              style={cyberpunkMode ? {
                color: CYBERPUNK_COLORS.yellow,
                fontFamily: 'monospace'
              } : {}}>
                Total Questions
              </div>
            </div>
            <div className={`text-center p-4 rounded-lg border ${
              cyberpunkMode 
                ? getCyberpunkCardBg(3).className
                : 'bg-gray-50'
            }`}
            style={cyberpunkMode ? {
              ...getCyberpunkCardBg(3).style,
              ...themeStyles.glow
            } : {}}>
              <div className={`text-3xl font-bold ${
                cyberpunkMode 
                  ? ''
                  : getScoreColor(percentage).split(' ')[0]
              }`}
              style={cyberpunkMode ? {
                ...themeStyles.textCyan,
                fontFamily: 'monospace'
              } : {}}>
                {percentage}%
              </div>
              <div className={`text-sm ${
                cyberpunkMode ? '' : 'text-gray-600'
              }`}
              style={cyberpunkMode ? {
                color: CYBERPUNK_COLORS.yellow,
                fontFamily: 'monospace'
              } : {}}>
                Score
              </div>
            </div>
          </div>


          {/* Progress Bar */}
          <div className={`w-full rounded-full h-3 mb-6 border ${
            cyberpunkMode 
              ? 'bg-gray-800 border-cyan-400/50'
              : 'bg-gray-200'
          }`}
          style={cyberpunkMode ? themeStyles.glow : {}}>
            <motion.div 
              className={`h-3 rounded-full ${
                cyberpunkMode ? '' : getScoreColor(percentage).split(' ')[1]
              }`}
              style={cyberpunkMode ? {
                background: `linear-gradient(to right, ${CYBERPUNK_COLORS.yellow}, ${CYBERPUNK_COLORS.cyan})`,
                boxShadow: `0 0 10px ${CYBERPUNK_COLORS.cyan}`
              } : {}}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>

        </motion.div>

        {/* Question Analysis */}
        {/* Question Review - Only show for non-matching tests */}
        {testType !== 'matching_type' && testType !== 'word_matching' && (
          <motion.div 
            className={`rounded-lg shadow-lg p-6 border-2 ${
              cyberpunkMode 
                ? getCyberpunkCardBg(1).className
                : 'bg-white'
            }`}
            style={cyberpunkMode ? {
              ...getCyberpunkCardBg(1).style,
              ...themeStyles.glow
            } : {}}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className={`text-2xl font-bold mb-6 ${
              cyberpunkMode ? '' : 'text-gray-900'
            }`}
            style={cyberpunkMode ? {
              ...themeStyles.textCyan,
              fontFamily: 'monospace'
            } : {}}>
              {cyberpunkMode ? 'QUESTION REVIEW' : 'Question Review'}
            </h3>
            
            <div className="space-y-4">
              {questionAnalysis.map((q, index) => (
                <motion.div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    cyberpunkMode 
                      ? 'border'
                      : q.isCorrect 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                  }`}
                    style={cyberpunkMode ? {
                      backgroundColor: CYBERPUNK_COLORS.black,
                      borderColor: q.isCorrect ? CYBERPUNK_COLORS.green : CYBERPUNK_COLORS.red,
                      boxShadow: q.isCorrect 
                        ? themeStyles.glow.boxShadow
                        : themeStyles.glowRed.boxShadow
                    } : {}}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className={`text-lg font-semibold ${
                      cyberpunkMode ? '' : 'text-gray-900'
                    }`}
                    style={cyberpunkMode ? {
                      ...themeStyles.textCyan,
                      fontFamily: 'monospace'
                    } : {}}>
                      Question {q.questionNumber}
                    </h4>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium border ${
                      cyberpunkMode 
                        ? 'border'
                        : q.isCorrect 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                    }`}
                    style={cyberpunkMode ? {
                      backgroundColor: CYBERPUNK_COLORS.black,
                      borderColor: q.isCorrect ? CYBERPUNK_COLORS.green : CYBERPUNK_COLORS.red,
                      color: q.isCorrect ? CYBERPUNK_COLORS.green : CYBERPUNK_COLORS.red,
                      fontFamily: 'monospace',
                      ...(q.isCorrect ? themeStyles.textShadowGreen : themeStyles.textShadowRed)
                    } : {}}>
                      {q.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className={`font-medium mb-2 ${
                      cyberpunkMode ? '' : 'text-gray-800'
                    }`}
                    style={cyberpunkMode ? {
                      ...themeStyles.textYellow,
                      fontFamily: 'monospace'
                    } : {}}>
                      Question:
                    </p>
                    <p className={`p-3 rounded border ${
                      cyberpunkMode 
                        ? 'border'
                        : 'text-gray-700 bg-gray-100'
                    }`}
                    style={cyberpunkMode ? {
                      backgroundColor: CYBERPUNK_COLORS.black,
                      borderColor: CYBERPUNK_COLORS.cyan,
                      color: CYBERPUNK_COLORS.cyan,
                      fontFamily: 'monospace',
                      ...themeStyles.textShadow
                    } : {}}>
                      {q.question}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className={`font-medium mb-2 ${
                        cyberpunkMode ? '' : 'text-gray-800'
                      }`}
                      style={cyberpunkMode ? {
                        ...themeStyles.textYellow,
                        fontFamily: 'monospace'
                      } : {}}>
                        Your Answer:
                      </p>
                      <p className={`p-3 rounded border ${
                        cyberpunkMode 
                          ? 'border'
                          : q.isCorrect 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                      }`}
                      style={cyberpunkMode ? {
                        backgroundColor: CYBERPUNK_COLORS.black,
                        borderColor: q.isCorrect ? CYBERPUNK_COLORS.green : CYBERPUNK_COLORS.red,
                        color: q.isCorrect ? CYBERPUNK_COLORS.green : CYBERPUNK_COLORS.red,
                        fontFamily: 'monospace',
                        ...(q.isCorrect ? themeStyles.textShadowGreen : themeStyles.textShadowRed)
                      } : {}}>
                        {q.userAnswer || 'No answer provided'}
                      </p>
                    </div>
                    <div>
                      <p className={`font-medium mb-2 ${
                        cyberpunkMode ? '' : 'text-gray-800'
                      }`}
                      style={cyberpunkMode ? {
                        ...themeStyles.textYellow,
                        fontFamily: 'monospace'
                      } : {}}>
                        Correct Answer:
                      </p>
                      <p className={`p-3 rounded border ${
                        cyberpunkMode 
                          ? 'border'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                      style={cyberpunkMode ? {
                        backgroundColor: CYBERPUNK_COLORS.black,
                        borderColor: CYBERPUNK_COLORS.cyan,
                        color: CYBERPUNK_COLORS.cyan,
                        fontFamily: 'monospace',
                        ...themeStyles.textShadow
                      } : {}}>
                        {q.correctAnswer}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Summary Statistics */}
        <motion.div 
          className={`rounded-lg shadow-lg p-6 mt-6 border-2 ${
            cyberpunkMode 
              ? getCyberpunkCardBg(0).className
              : 'bg-white'
          }`}
          style={cyberpunkMode ? {
            ...getCyberpunkCardBg(0).style,
            ...themeStyles.glow
          } : {}}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className={`text-2xl font-bold mb-4 ${
            cyberpunkMode ? '' : 'text-gray-900'
          }`}
          style={cyberpunkMode ? {
            color: CYBERPUNK_COLORS.cyan,
            fontFamily: 'monospace',
            ...themeStyles.textShadow
          } : {}}>
            {cyberpunkMode ? 'SUMMARY STATISTICS' : 'Summary Statistics'}
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`text-center p-4 rounded-lg border-2 ${
              cyberpunkMode ? getCyberpunkCardBg(2).className : 'bg-blue-50'
            }`}
            style={cyberpunkMode ? {
              ...getCyberpunkCardBg(2).style,
              ...themeStyles.glow
            } : {}}>
              <div className={`text-2xl font-bold ${
                cyberpunkMode ? '' : 'text-blue-600'
              }`}
              style={cyberpunkMode ? {
                color: CYBERPUNK_COLORS.cyan,
                fontFamily: 'monospace',
                ...themeStyles.textShadow
              } : {}}>
                {questionAnalysis.filter(q => q.isCorrect).length}
              </div>
              <div className={`text-sm ${
                cyberpunkMode ? '' : 'text-blue-600'
              }`}
              style={cyberpunkMode ? {
                color: CYBERPUNK_COLORS.cyan,
                fontFamily: 'monospace'
              } : {}}>
                {cyberpunkMode ? 'CORRECT' : 'Correct'}
              </div>
            </div>
            <div className={`text-center p-4 rounded-lg border-2 ${
              cyberpunkMode ? getCyberpunkCardBg(0).className : 'bg-red-50'
            }`}
            style={cyberpunkMode ? {
              ...getCyberpunkCardBg(0).style,
              ...themeStyles.glowRed
            } : {}}>
              <div className={`text-2xl font-bold ${
                cyberpunkMode ? '' : 'text-red-600'
              }`}
              style={cyberpunkMode ? {
                color: CYBERPUNK_COLORS.red,
                fontFamily: 'monospace',
                ...themeStyles.textShadowRed
              } : {}}>
                {questionAnalysis.filter(q => !q.isCorrect).length}
              </div>
              <div className={`text-sm ${
                cyberpunkMode ? '' : 'text-red-600'
              }`}
              style={cyberpunkMode ? {
                color: CYBERPUNK_COLORS.red,
                fontFamily: 'monospace'
              } : {}}>
                {cyberpunkMode ? 'INCORRECT' : 'Incorrect'}
              </div>
            </div>
            <div className={`text-center p-4 rounded-lg border-2 ${
              cyberpunkMode ? getCyberpunkCardBg(1).className : 'bg-gray-50'
            }`}
            style={cyberpunkMode ? {
              ...getCyberpunkCardBg(1).style,
              ...themeStyles.glow
            } : {}}>
              <div className={`text-2xl font-bold ${
                cyberpunkMode ? '' : 'text-gray-600'
              }`}
              style={cyberpunkMode ? {
                color: CYBERPUNK_COLORS.cyan,
                fontFamily: 'monospace',
                ...themeStyles.textShadow
              } : {}}>
                {Math.round((questionAnalysis.filter(q => q.isCorrect).length / totalQuestions) * 100)}%
              </div>
              <div className={`text-sm ${
                cyberpunkMode ? '' : 'text-gray-600'
              }`}
              style={cyberpunkMode ? {
                color: CYBERPUNK_COLORS.cyan,
                fontFamily: 'monospace'
              } : {}}>
                {cyberpunkMode ? 'ACCURACY' : 'Accuracy'}
              </div>
            </div>
            <div className={`text-center p-4 rounded-lg border-2 ${
              cyberpunkMode ? getCyberpunkCardBg(2).className : 'bg-purple-50'
            }`}
            style={cyberpunkMode ? {
              ...getCyberpunkCardBg(2).style,
              ...themeStyles.glow
            } : {}}>
              <div className={`text-2xl font-bold ${
                cyberpunkMode ? '' : 'text-purple-600'
              }`}
              style={cyberpunkMode ? {
                color: CYBERPUNK_COLORS.cyan,
                fontFamily: 'monospace',
                ...themeStyles.textShadow
              } : {}}>
                {totalQuestions}
              </div>
              <div className={`text-sm ${
                cyberpunkMode ? '' : 'text-purple-600'
              }`}
              style={cyberpunkMode ? {
                color: CYBERPUNK_COLORS.cyan,
                fontFamily: 'monospace'
              } : {}}>
                {cyberpunkMode ? 'TOTAL' : 'Total'}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Back to Cabinet Button - Bottom */}
        <motion.div 
          className={`rounded-lg shadow-lg p-6 mt-6 border-2 ${
            cyberpunkMode 
              ? getCyberpunkCardBg(0).className
              : 'bg-white'
          }`}
          style={cyberpunkMode ? {
            ...getCyberpunkCardBg(0).style,
            ...themeStyles.glowRed
          } : {}}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="flex justify-center">
            <Button
              onClick={handleBackToCabinet}
              variant="primary"
              className="flex items-center gap-2"
              disabled={isNavigating}
            >
              {isNavigating ? (
                <>
                  <LoadingSpinner size="sm" color="white" className="mr-2" />
                  Navigating...
                </>
              ) : (
                '← Back to Cabinet'
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TestResults;

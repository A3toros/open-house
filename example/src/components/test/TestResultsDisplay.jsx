import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useTheme } from '@/hooks/useTheme';
import { getThemeStyles, getCyberpunkCardBg, CYBERPUNK_COLORS, colorToRgba } from '@/utils/themeUtils';
import { calculateTestScore } from '../../utils/scoreCalculation';

const TestResultsDisplay = ({ 
  testInfo, 
  questions, 
  testType, 
  studentAnswers, 
  onBackToCabinet,
  checkAnswerCorrectness,
  formatStudentAnswerForDisplay,
  getCorrectAnswer,
  caughtCheating = false
}) => {
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const isCyberpunk = theme === 'cyberpunk';
  const [score, setScore] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const calculateResults = () => {
      try {
        const calculatedScore = calculateTestScore(questions, studentAnswers, testType).score;
        const totalQuestions = testInfo?.num_questions || questions?.length || 0;
        const calculatedPercentage = totalQuestions > 0 ? Math.round((calculatedScore / totalQuestions) * 100) : 0;
        
        setScore(calculatedScore);
        setPercentage(calculatedPercentage);
        setIsLoading(false);
      } catch (error) {
        console.error('Error calculating test results:', error);
        setScore(0);
        setPercentage(0);
        setIsLoading(false);
      }
    };

    if (questions && questions.length > 0) {
      calculateResults();
    } else {
      setIsLoading(false);
    }
  }, [questions, studentAnswers, testType, testInfo, calculateTestScore]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg">Calculating results...</div>
      </div>
    );
  }

  const totalQuestions = testInfo?.num_questions || questions?.length || 0;
  const testName = testInfo?.test_name || testInfo?.title || 'Test';

  return (
    <div className={`test-results-page max-w-4xl mx-auto p-6 overflow-y-auto min-h-screen ${
      isCyberpunk ? 'bg-black' : ''
    }`}
    style={isCyberpunk ? themeStyles.background : {}}>
      {/* Results Header */}
      <Card className={`mb-6 border-2 ${
        isCyberpunk ? getCyberpunkCardBg(0).className : ''
      }`}
      style={isCyberpunk ? {
        ...getCyberpunkCardBg(0).style,
        ...themeStyles.glowRed
      } : {}}>
        <div className="results-header text-center">
          <h2 className={`text-2xl font-bold mb-2 ${
            isCyberpunk ? '' : 'text-gray-800'
          }`}
          style={isCyberpunk ? {
            ...themeStyles.textCyan,
            fontFamily: 'monospace'
          } : {}}>
            {isCyberpunk ? `TEST RESULTS: ${testName.toUpperCase()}` : `Test Results: ${testName}`}
          </h2>
          <p className={isCyberpunk ? '' : 'text-gray-600'}
          style={isCyberpunk ? {
            color: CYBERPUNK_COLORS.yellow,
            fontFamily: 'monospace'
          } : {}}>
            {testType === 'matching_type' ? 'Matching Test' : 
             testType === 'multiple_choice' ? 'Multiple Choice Test' :
             testType === 'true_false' ? 'True/False Test' :
             testType === 'input' ? 'Input Test' :
             testType === 'drawing' ? 'Drawing Test' : 'Test'}
          </p>
        </div>
      </Card>
      
      {/* Cheating Warning */}
      {caughtCheating && (
        <Card className={`mb-6 border-2 ${
          isCyberpunk ? 'border' : 'border-red-500 bg-red-50'
        }`}
        style={isCyberpunk ? {
          backgroundColor: CYBERPUNK_COLORS.black,
          borderColor: CYBERPUNK_COLORS.red,
          ...themeStyles.glowRed
        } : {}}>
          <div className="flex items-start space-x-3 p-4">
            <div className="flex-shrink-0">
              <svg className={`h-6 w-6 ${isCyberpunk ? '' : 'text-red-600'}`}
                style={isCyberpunk ? { color: CYBERPUNK_COLORS.red } : {}}
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className={isCyberpunk ? '' : 'text-red-700'}
              style={isCyberpunk ? {
                ...themeStyles.textRed,
                fontFamily: 'monospace'
              } : {}}>
                Suspicious activity was detected during this test. Your teacher has been notified.
              </p>
            </div>
          </div>
        </Card>
      )}
      
      {/* Results Summary */}
      <Card className={`mb-6 border-2 ${
        isCyberpunk ? getCyberpunkCardBg(1).className : ''
      }`}
      style={isCyberpunk ? {
        ...getCyberpunkCardBg(1).style,
        ...themeStyles.glow
      } : {}}>
        <div className="results-summary">
          <h3 className={`text-xl font-semibold mb-4 text-center ${
            isCyberpunk ? '' : 'text-gray-800'
          }`}
          style={isCyberpunk ? {
            ...themeStyles.textCyan,
            fontFamily: 'monospace'
          } : {}}>
            {isCyberpunk 
              ? `YOUR SCORE: ${score} / ${totalQuestions} (${percentage}%)`
              : `Your Score: ${score} / ${totalQuestions} (${percentage}%)`}
          </h3>
          
          {/* Score Bar */}
          <div className={`w-full rounded-full h-4 mb-4 border ${
            isCyberpunk 
              ? 'bg-gray-800 border-cyan-400/50'
              : 'bg-gray-200'
          }`}
          style={isCyberpunk ? themeStyles.glow : {}}>
            <div 
              className={`h-4 rounded-full transition-all duration-500 ${
                isCyberpunk ? '' :
                percentage >= 80 ? 'bg-green-500' :
                percentage >= 60 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={isCyberpunk ? {
                background: `linear-gradient(to right, ${CYBERPUNK_COLORS.yellow}, ${CYBERPUNK_COLORS.cyan})`,
                boxShadow: `0 0 10px ${CYBERPUNK_COLORS.cyan}`,
                width: `${percentage}%`
              } : {width: `${percentage}%`}}
            ></div>
          </div>
          
          {/* Score Description */}
          <div className="text-center">
            <p className={`text-lg font-medium ${
              isCyberpunk 
                ? ''
                : percentage >= 80 ? 'text-green-600' :
                  percentage >= 60 ? 'text-yellow-600' :
                  'text-red-600'
            }`}
            style={isCyberpunk ? {
              color: percentage >= 80 ? CYBERPUNK_COLORS.green :
                     percentage >= 60 ? CYBERPUNK_COLORS.yellow :
                     CYBERPUNK_COLORS.red,
              fontFamily: 'monospace',
              ...(percentage >= 80 ? themeStyles.textShadowGreen :
                  percentage >= 60 ? themeStyles.textShadowYellow :
                  themeStyles.textShadowRed)
            } : {}}>
              {percentage >= 80 ? 'Excellent!' :
               percentage >= 60 ? 'Good job!' :
               'Keep practicing!'}
            </p>
          </div>
        </div>
      </Card>
      
      {/* Questions Review */}
      {questions && questions.length > 0 && (
        <Card className={`mb-6 border-2 ${
          isCyberpunk ? getCyberpunkCardBg(2).className : ''
        }`}
        style={isCyberpunk ? {
          ...getCyberpunkCardBg(2).style,
          ...themeStyles.glow
        } : {}}>
          <div className="questions-review">
            <h3 className={`text-xl font-semibold mb-4 ${
              isCyberpunk ? '' : 'text-gray-800'
            }`}
            style={isCyberpunk ? {
              ...themeStyles.textCyan,
              fontFamily: 'monospace'
            } : {}}>
              {isCyberpunk ? 'QUESTION REVIEW' : 'Question Review'}
            </h3>
            <div className="space-y-4">
              {questions.map((question, index) => {
                const studentAnswer = studentAnswers[String(question.question_id)] || 'No answer';
                const isCorrect = checkAnswerCorrectness(question, studentAnswer, testType);
                
                return (
                  <div 
                    key={question.question_id || index} 
                    className={`question-review p-4 rounded-lg border-2 ${
                      isCyberpunk 
                        ? 'border'
                        : isCorrect 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                    }`}
                    style={isCyberpunk ? {
                      backgroundColor: CYBERPUNK_COLORS.black,
                      borderColor: isCorrect ? CYBERPUNK_COLORS.green : CYBERPUNK_COLORS.red,
                      boxShadow: isCorrect 
                        ? themeStyles.glow.boxShadow
                        : themeStyles.glowRed.boxShadow
                    } : {}}
                  >
                    <div className="question-review-header flex justify-between items-start mb-3">
                      <h4 className={`text-lg font-medium ${
                        isCyberpunk ? '' : 'text-gray-800'
                      }`}
                      style={isCyberpunk ? {
                        ...themeStyles.textCyan,
                        fontFamily: 'monospace'
                      } : {}}>
                        Question {index + 1}
                      </h4>
                      <span className={`text-2xl font-bold ${
                        isCyberpunk 
                          ? ''
                          : isCorrect ? 'text-green-600' : 'text-red-600'
                      }`}
                      style={isCyberpunk ? {
                        color: isCorrect ? CYBERPUNK_COLORS.green : CYBERPUNK_COLORS.red,
                        fontFamily: 'monospace',
                        ...(isCorrect ? themeStyles.textShadowGreen : themeStyles.textShadowRed)
                      } : {}}>
                        {isCorrect ? '✓' : '✗'}
                      </span>
                    </div>
                    
                    <div className="question-text mb-3">
                      <p className={`p-3 rounded border ${
                        isCyberpunk 
                          ? 'border'
                          : 'text-gray-700 bg-gray-100'
                      }`}
                      style={isCyberpunk ? {
                        backgroundColor: CYBERPUNK_COLORS.black,
                        borderColor: CYBERPUNK_COLORS.cyan,
                        color: CYBERPUNK_COLORS.cyan,
                        fontFamily: 'monospace',
                        ...themeStyles.textShadow
                      } : {}}>
                        {question.question}
                      </p>
                    </div>
                    
                    <div className="answer-section space-y-2">
                      <p className="student-answer">
                        <strong className={isCyberpunk ? '' : 'text-gray-600'}
                        style={isCyberpunk ? {
                          color: CYBERPUNK_COLORS.yellow,
                          fontFamily: 'monospace'
                        } : {}}>
                          Your Answer:
                        </strong>{' '}
                        <span className={`p-3 rounded border font-medium ${
                          isCyberpunk 
                            ? 'border'
                            : isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                        style={isCyberpunk ? {
                          backgroundColor: CYBERPUNK_COLORS.black,
                          borderColor: isCorrect ? CYBERPUNK_COLORS.green : CYBERPUNK_COLORS.red,
                          color: isCorrect ? CYBERPUNK_COLORS.green : CYBERPUNK_COLORS.red,
                          fontFamily: 'monospace',
                          ...(isCorrect ? themeStyles.textShadowGreen : themeStyles.textShadowRed)
                        } : {}}>
                          {formatStudentAnswerForDisplay(studentAnswer, testType, question)}
                        </span>
                      </p>
                      
                      {!isCorrect && (
                        <p className="correct-answer">
                          <strong className={isCyberpunk ? '' : 'text-gray-600'}
                          style={isCyberpunk ? {
                            color: CYBERPUNK_COLORS.yellow,
                            fontFamily: 'monospace'
                          } : {}}>
                            Correct Answer:
                          </strong>{' '}
                          <span className={`p-3 rounded border font-medium ${
                            isCyberpunk ? 'border' : 'bg-blue-100 text-blue-800'
                          }`}
                          style={isCyberpunk ? {
                            backgroundColor: CYBERPUNK_COLORS.black,
                            borderColor: CYBERPUNK_COLORS.cyan,
                            color: CYBERPUNK_COLORS.cyan,
                            fontFamily: 'monospace',
                            ...themeStyles.textShadow
                          } : {}}>
                            {testType === 'multiple_choice'
                              ? String(question.correct_answer || '').toUpperCase()
                              : formatStudentAnswerForDisplay(getCorrectAnswer(question, testType), testType, question)}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}
      
      {/* Results Actions */}
      <Card className={`border-2 ${
        isCyberpunk ? getCyberpunkCardBg(0).className : ''
      }`}
      style={isCyberpunk ? {
        ...getCyberpunkCardBg(0).style,
        ...themeStyles.glowRed
      } : {}}>
        <div className="results-actions text-center">
          <Button 
            onClick={onBackToCabinet}
            className={`px-8 py-3 text-lg font-medium ${
              isCyberpunk 
                ? ''
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            style={isCyberpunk ? {
              backgroundColor: CYBERPUNK_COLORS.cyan,
              color: CYBERPUNK_COLORS.black,
              fontFamily: 'monospace',
              ...themeStyles.glow
            } : {}}
          >
            {isCyberpunk ? 'BACK TO CABINET' : 'Back to Cabinet'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default TestResultsDisplay;

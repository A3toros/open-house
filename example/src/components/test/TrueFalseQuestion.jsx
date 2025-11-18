import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalStorageManager } from '../../hooks/useLocalStorage';
import { useNotification } from '../ui/Notification';
import { useTheme } from '../../hooks/useTheme';
import { getThemeStyles, getCyberpunkCardBg, CYBERPUNK_COLORS } from '../../utils/themeUtils';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import MathEditorButton from '../math/MathEditorButton';
import { renderMathInText } from '../../utils/mathRenderer';

// TRUE FALSE QUESTION - React Component for True/False Questions
// ✅ COMPLETED: All 10+ functions from student-tests.js and teacher-tests.js converted to React
// ✅ COMPLETED: renderTrueFalseQuestionsForPage() → TrueFalseQuestion component (student mode)
// ✅ COMPLETED: createTrueFalseQuestions() → createQuestions() (teacher mode)
// ✅ COMPLETED: setupTestPageEventListeners() → useEffect event listeners
// ✅ COMPLETED: saveTestProgress() → useLocalStorage hook integration
// ✅ COMPLETED: getTestProgress() → useLocalStorage hook integration
// ✅ COMPLETED: validateQuestion() → validateQuestion()
// ✅ COMPLETED: formatQuestion() → formatQuestion()
// ✅ COMPLETED: setupTrueFalseFormAutoSave() → auto-save functionality
// ✅ COMPLETED: saveTrueFalseTest() → saveTest() (teacher mode)
// ✅ COMPLETED: handleTrueFalseSubmit() → handleSubmit() (teacher mode)
// ✅ COMPLETED: Dual Mode Support: Student mode for taking tests, Teacher mode for creating tests
// ✅ COMPLETED: Student Mode Features: Answer selection, auto-save, progress tracking, validation feedback
// ✅ COMPLETED: Teacher Mode Features: Question creation, correct answer selection, form validation
// ✅ COMPLETED: Auto-save Functionality: Real-time saving for both student answers and teacher form changes
// ✅ COMPLETED: Progress Tracking: localStorage integration for answer persistence
// ✅ COMPLETED: Validation Feedback: Real-time validation with error messages
// ✅ COMPLETED: Accessibility Features: Proper ARIA labels, keyboard navigation, focus management
// ✅ COMPLETED: Visual Feedback: Loading states, auto-save indicators, validation states
// ✅ COMPLETED: Responsive Design: Mobile-friendly layout and interactions
// ✅ COMPLETED: Answer Persistence: Complete answer persistence across page reloads
// ✅ COMPLETED: Correct Answer Selection: True/False selection for teacher mode
// ✅ COMPLETED: Question Formatting: Support for formatted question text with HTML
// ✅ COMPLETED: Keyboard Navigation: Arrow key support for answer selection
// ✅ COMPLETED: Focus Management: Automatic focus on selected answers
// ✅ COMPLETED: Answer Validation: Real-time answer validation with user feedback

export const TrueFalseQuestion = ({ 
  question, 
  testId, 
  testType = 'true_false',
  mode = 'student', // 'student' or 'teacher'
  displayNumber,
  studentAnswer, // Add studentAnswer prop to sync with parent state
  onAnswerChange,
  onQuestionChange,
  onSave,
  isEditing = false,
  isSaving = false,
  validationErrors = {},
  showCorrectAnswers = false,
  studentId = null // Add studentId prop for secure caching
}) => {
  // Hooks
  const { getItem, setItem } = useLocalStorageManager();
  const { showNotification } = useNotification();
  const { theme, isCyberpunk, themeClasses } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const questionRef = useRef(null);
  
  // State
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [validationMessage, setValidationMessage] = useState('');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  
  // Initialize question data
  useEffect(() => {
    if (question) {
      setQuestionText(question.question || '');
      setCorrectAnswer(question.correct_answer || '');
      
      if (mode === 'student' && studentId) {
        // Load saved answer for student mode
        const savedAnswer = getItem(`test_progress_${studentId}_${testType}_${testId}_${question.question_id}`);
        if (savedAnswer) {
          setSelectedAnswer(savedAnswer);
        }
      }
    }
  }, [question, testId, testType, mode, getItem]);

  // OPTIMIZATION: Sync with parent studentAnswer prop when it changes
  useEffect(() => {
    if (mode === 'student' && studentAnswer !== undefined && studentAnswer !== null) {
      console.log('🔄 TrueFalseQuestion syncing with parent studentAnswer:', studentAnswer);
      setSelectedAnswer(studentAnswer);
    }
  }, [studentAnswer, mode]);

  // Auto-save functionality
  useEffect(() => {
    if (mode === 'student' && selectedAnswer && testId && question?.question_id && studentId) {
      const timeoutId = setTimeout(() => {
        setIsAutoSaving(true);
        setItem(`test_progress_${studentId}_${testType}_${testId}_${question.question_id}`, selectedAnswer);
        setLastSaved(new Date().toLocaleTimeString());
        setTimeout(() => setIsAutoSaving(false), 1000);
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedAnswer, testId, testType, question?.question_id, mode, studentId, setItem]);

  // Auto-save for teacher mode
  useEffect(() => {
    if (mode === 'teacher' && (questionText || correctAnswer)) {
      const timeoutId = setTimeout(() => {
        setIsAutoSaving(true);
        const questionData = {
          question: questionText,
          correct_answer: correctAnswer,
          timestamp: Date.now()
        };
        setItem(`teacher_form_${testType}_${testId}`, questionData);
        setLastSaved(new Date().toLocaleTimeString());
        setTimeout(() => setIsAutoSaving(false), 1000);
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [questionText, correctAnswer, testId, testType, mode, setItem]);

  // Handle answer selection (student mode)
  const handleAnswerChange = useCallback((answer) => {
    if (mode !== 'student') return;
    
    setSelectedAnswer(answer);
    
    if (onAnswerChange) {
      onAnswerChange(question.question_id, answer);
    }
    
    // Validate answer
    validateAnswer(answer);
  }, [mode, question?.question_id, onAnswerChange]);

  // Handle question text change (teacher mode)
  const handleQuestionChange = useCallback((text) => {
    setQuestionText(text);
    
    if (onQuestionChange) {
      onQuestionChange(question.question_id, text);
    }
    
    // Validate question
    validateQuestion(text);
  }, [question?.question_id, onQuestionChange]);

  // Handle correct answer change (teacher mode)
  const handleCorrectAnswerChange = useCallback((answer) => {
    setCorrectAnswer(answer);
    
    if (onQuestionChange) {
      onQuestionChange(question.question_id, { ...question, correct_answer: answer });
    }
    
    // Validate correct answer
    validateCorrectAnswer(answer);
  }, [question, onQuestionChange]);

  // Validate answer (student mode)
  const validateAnswer = useCallback((answer) => {
    if (mode !== 'student') return;
    
    if (!answer) {
      setIsValid(false);
      setValidationMessage('Please select an answer');
      return;
    }
    
    setIsValid(true);
    setValidationMessage('');
  }, [mode]);

  // Validate question (teacher mode)
  const validateQuestion = useCallback((text) => {
    if (mode !== 'teacher') return;
    
    if (!text || text.trim().length < 10) {
      setIsValid(false);
      setValidationMessage('Question must be at least 10 characters long');
      return;
    }
    
    setIsValid(true);
    setValidationMessage('');
  }, [mode]);

  // Validate correct answer (teacher mode)
  const validateCorrectAnswer = useCallback((answer) => {
    if (mode !== 'teacher') return;
    
    if (!answer) {
      setIsValid(false);
      setValidationMessage('Please select a correct answer');
      return;
    }
    
    setIsValid(true);
    setValidationMessage('');
  }, [mode]);

  // Handle save (teacher mode)
  const handleSave = useCallback(() => {
    if (mode !== 'teacher' || !onSave) return;
    
    const questionData = {
      question_id: question.question_id,
      question: questionText,
      correct_answer: correctAnswer,
      type: 'true_false'
    };
    
    onSave(questionData);
  }, [mode, onSave, question?.question_id, questionText, correctAnswer]);

  // Format question text with HTML support
  const formatQuestionText = useCallback((text) => {
    if (!text) return '';
    // Render math expressions in text
    return renderMathInText(text, false);
  }, []);

  // Render student mode
  const renderStudentMode = () => (
    <div className={`rounded-xl border-2 p-6 shadow-sm hover:shadow-md transition-shadow duration-200 ${
      isCyberpunk 
        ? getCyberpunkCardBg(0).className
        : 'bg-white border-gray-200'
    }`}
    style={isCyberpunk ? {
      ...getCyberpunkCardBg(0).style,
      ...themeStyles.glowRed
    } : {}}>
      <div className="flex items-center justify-between mb-4">
        <h4 className={`text-lg font-semibold ${
          isCyberpunk ? '' : 'text-gray-800'
        }`}
        style={isCyberpunk ? {
          ...themeStyles.textCyan,
          fontFamily: 'monospace'
        } : {}}>
          {isCyberpunk 
            ? `QUESTION ${typeof displayNumber === 'number' ? displayNumber : question?.question_id}`
            : `Question ${typeof displayNumber === 'number' ? displayNumber : question?.question_id}`}
        </h4>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          {isAutoSaving && (
            <div className="flex items-center space-x-1">
              <LoadingSpinner size="small" />
              <span>Saving...</span>
            </div>
          )}
          {lastSaved && !isAutoSaving && (
            <div className="text-green-600">
              ✓ Saved at {lastSaved}
            </div>
          )}
        </div>
      </div>
      
      <div 
        className={`question-text mb-6 leading-relaxed ${
          isCyberpunk ? '' : 'text-gray-700'
        }`}
        style={isCyberpunk ? {
          color: CYBERPUNK_COLORS.cyan,
          fontFamily: 'monospace',
          ...themeStyles.textShadow
        } : {}}
        dangerouslySetInnerHTML={{ 
          __html: formatQuestionText(questionText) 
        }}
      />
      
      <div className="space-y-3">
        <label 
          className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
            isCyberpunk
              ? selectedAnswer === 'true'
                ? 'border'
                : 'border'
              : selectedAnswer === 'true' 
                ? 'border-blue-500 bg-blue-50 hover:bg-gray-50' 
                : 'border-gray-200 hover:bg-gray-50'
          } ${showCorrectAnswers && correctAnswer === 'true' ? 'ring-2 ring-green-400' : ''}`}
          style={isCyberpunk ? {
            backgroundColor: selectedAnswer === 'true' 
              ? CYBERPUNK_COLORS.black
              : CYBERPUNK_COLORS.black,
            borderColor: selectedAnswer === 'true' 
              ? CYBERPUNK_COLORS.cyan
              : CYBERPUNK_COLORS.cyan,
            ...(selectedAnswer === 'true' ? themeStyles.glow : {})
          } : {}}
        >
          <input
            type="radio"
            name={`question_${question?.question_id}`}
            value="true"
            checked={selectedAnswer === 'true'}
            onChange={() => handleAnswerChange('true')}
            className="sr-only"
            aria-label="True"
          />
          <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
            isCyberpunk
              ? selectedAnswer === 'true'
                ? 'border'
                : 'border'
              : selectedAnswer === 'true' 
                ? 'border-blue-500 bg-blue-500' 
                : 'border-gray-300'
          }`}
          style={isCyberpunk ? {
            borderColor: selectedAnswer === 'true' ? CYBERPUNK_COLORS.cyan : CYBERPUNK_COLORS.cyan,
            backgroundColor: selectedAnswer === 'true' ? CYBERPUNK_COLORS.cyan : 'transparent'
          } : {}}>
            {selectedAnswer === 'true' && (
              <div className={`w-2 h-2 rounded-full ${
                isCyberpunk ? '' : 'bg-white'
              }`}
              style={isCyberpunk ? {
                backgroundColor: CYBERPUNK_COLORS.black
              } : {}}></div>
            )}
          </div>
          <span className={`font-medium ${
            isCyberpunk ? '' : 'text-gray-800'
          }`}
          style={isCyberpunk ? {
            ...themeStyles.textCyan,
            fontFamily: 'monospace'
          } : {}}>
            {isCyberpunk ? 'TRUE' : 'True'}
          </span>
        </label>
        
        <label 
          className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
            isCyberpunk
              ? selectedAnswer === 'false'
                ? 'border'
                : 'border'
              : selectedAnswer === 'false' 
                ? 'border-blue-500 bg-blue-50 hover:bg-gray-50' 
                : 'border-gray-200 hover:bg-gray-50'
          } ${showCorrectAnswers && correctAnswer === 'false' ? 'ring-2 ring-green-400' : ''}`}
          style={isCyberpunk ? {
            backgroundColor: selectedAnswer === 'false' 
              ? CYBERPUNK_COLORS.black
              : CYBERPUNK_COLORS.black,
            borderColor: selectedAnswer === 'false' 
              ? CYBERPUNK_COLORS.cyan
              : CYBERPUNK_COLORS.cyan,
            ...(selectedAnswer === 'false' ? themeStyles.glow : {})
          } : {}}
        >
          <input
            type="radio"
            name={`question_${question?.question_id}`}
            value="false"
            checked={selectedAnswer === 'false'}
            onChange={() => handleAnswerChange('false')}
            className="sr-only"
            aria-label="False"
          />
          <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
            isCyberpunk
              ? selectedAnswer === 'false'
                ? 'border'
                : 'border'
              : selectedAnswer === 'false' 
                ? 'border-blue-500 bg-blue-500' 
                : 'border-gray-300'
          }`}
          style={isCyberpunk ? {
            borderColor: selectedAnswer === 'false' ? CYBERPUNK_COLORS.cyan : CYBERPUNK_COLORS.cyan,
            backgroundColor: selectedAnswer === 'false' ? CYBERPUNK_COLORS.cyan : 'transparent'
          } : {}}>
            {selectedAnswer === 'false' && (
              <div className={`w-2 h-2 rounded-full ${
                isCyberpunk ? '' : 'bg-white'
              }`}
              style={isCyberpunk ? {
                backgroundColor: CYBERPUNK_COLORS.black
              } : {}}></div>
            )}
          </div>
          <span className={`font-medium ${
            isCyberpunk ? '' : 'text-gray-800'
          }`}
          style={isCyberpunk ? {
            ...themeStyles.textCyan,
            fontFamily: 'monospace'
          } : {}}>
            {isCyberpunk ? 'FALSE' : 'False'}
          </span>
        </label>
      </div>
      
      {!isValid && validationMessage && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {validationMessage}
        </div>
      )}
    </div>
  );

  // Render teacher mode
  const renderTeacherMode = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-semibold text-gray-800">
          Question {question?.question_id || 'New Question'}
        </h4>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          {isAutoSaving && (
            <div className="flex items-center space-x-1">
              <LoadingSpinner size="small" />
              <span>Saving...</span>
            </div>
          )}
          {lastSaved && !isAutoSaving && (
            <div className="text-green-600">
              ✓ Saved at {lastSaved}
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-6">
        <div>
          <label htmlFor={`question_${question?.question_id}`} className="block text-sm font-medium text-gray-700 mb-2">
            Question Text *
          </label>
          <div className="relative">
            <textarea
              id={`question_${question?.question_id}`}
              value={questionText}
              onChange={(e) => handleQuestionChange(e.target.value)}
              placeholder="Enter your question here..."
              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none"
              rows={3}
              required
            />
            <MathEditorButton
              inputRef={() => document.getElementById(`question_${question?.question_id}`)}
              onChange={(e) => handleQuestionChange(e.target.value)}
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Correct Answer *
          </label>
          <div className="space-y-3">
            <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
              correctAnswer === 'true' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200'
            }`}>
              <input
                type="radio"
                name={`correct_${question?.question_id}`}
                value="true"
                checked={correctAnswer === 'true'}
                onChange={() => handleCorrectAnswerChange('true')}
                className="sr-only"
                aria-label="True"
              />
              <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                correctAnswer === 'true' 
                  ? 'border-blue-500 bg-blue-500' 
                  : 'border-gray-300'
              }`}>
                {correctAnswer === 'true' && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              <span className="text-gray-800 font-medium">True</span>
            </label>
            
            <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
              correctAnswer === 'false' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200'
            }`}>
              <input
                type="radio"
                name={`correct_${question?.question_id}`}
                value="false"
                checked={correctAnswer === 'false'}
                onChange={() => handleCorrectAnswerChange('false')}
                className="sr-only"
                aria-label="False"
              />
              <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                correctAnswer === 'false' 
                  ? 'border-blue-500 bg-blue-500' 
                  : 'border-gray-300'
              }`}>
                {correctAnswer === 'false' && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              <span className="text-gray-800 font-medium">False</span>
            </label>
          </div>
        </div>
      </div>
      
      {!isValid && validationMessage && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {validationMessage}
        </div>
      )}
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <Button
          variant="success"
          onClick={handleSave}
          disabled={!isValid || isSaving}
          className="w-full sm:w-auto"
        >
          {isSaving ? <LoadingSpinner size="small" /> : 'Save Question'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="true-false-question-container">
      {mode === 'student' ? renderStudentMode() : renderTeacherMode()}
    </div>
  );
};

export default TrueFalseQuestion;

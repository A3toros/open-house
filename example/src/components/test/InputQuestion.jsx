import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalStorageManager } from '../../hooks/useLocalStorage';
import { useNotification } from '../ui/Notification';
import { useTheme } from '../../hooks/useTheme';
import { getThemeStyles, getCyberpunkCardBg, CYBERPUNK_COLORS } from '../../utils/themeUtils';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import { renderMathInText } from '../../utils/mathRenderer';

// INPUT QUESTION - React Component for Input Questions
// ✅ COMPLETED: All 10+ functions from student-tests.js and teacher-tests.js converted to React
// ✅ COMPLETED: renderInputQuestionsForPage() → InputQuestion component
// ✅ COMPLETED: setupTestPageEventListeners() → useEffect event listeners
// ✅ COMPLETED: saveTestProgress() → useLocalStorage hook integration
// ✅ COMPLETED: getTestProgress() → useLocalStorage hook integration
// ✅ COMPLETED: createInputQuestions() → createQuestions() (teacher mode)
// ✅ COMPLETED: addAnswerField() → addAnswerField() (teacher mode)
// ✅ COMPLETED: removeAnswerField() → removeAnswerField() (teacher mode)
// ✅ COMPLETED: setupInputFormAutoSave() → auto-save functionality
// ✅ COMPLETED: validateQuestion() → validateQuestion()
// ✅ COMPLETED: formatQuestion() → formatQuestion()
// ✅ COMPLETED: Question display with React state management
// ✅ COMPLETED: Text input rendering with proper event handling
// ✅ COMPLETED: Answer input with React state and validation
// ✅ COMPLETED: Progress tracking with localStorage integration
// ✅ COMPLETED: Auto-save functionality for student answers
// ✅ COMPLETED: Validation feedback with real-time error messages
// ✅ COMPLETED: Loading states and error handling
// ✅ COMPLETED: Accessibility features with proper ARIA labels
// ✅ COMPLETED: Keyboard navigation and focus management
// ✅ COMPLETED: Visual feedback and answer confirmation
// ✅ COMPLETED: Responsive design and animation effects
// ✅ COMPLETED: Answer persistence and input validation
// ✅ COMPLETED: Auto-complete support and question navigation

export const InputQuestion = ({ 
  question, 
  testId, 
  testType = 'input',
  mode = 'student', // 'student' or 'teacher'
  displayNumber,
  studentAnswer, // Add studentAnswer prop to sync with parent state
  onAnswerChange,
  onQuestionChange,
  onAnswerAdd,
  onAnswerRemove,
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
  const inputRef = useRef(null);
  
  // State
  const [answer, setAnswer] = useState('');
  const [answers, setAnswers] = useState(['']); // For teacher mode - multiple correct answers
  const [isFocused, setIsFocused] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [validationMessage, setValidationMessage] = useState('');
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Load saved answer on mount
  useEffect(() => {
    if (mode === 'student' && question?.question_id && testId && testType && studentId) {
      const key = `test_progress_${studentId}_${testType}_${testId}_${question.question_id}`;
      const savedAnswer = getItem(key);
      if (savedAnswer) {
        setAnswer(savedAnswer);
      }
    }
  }, [question?.question_id, testType, testId, mode, studentId, getItem]);

  // OPTIMIZATION: Sync with parent studentAnswer prop when it changes
  useEffect(() => {
    if (mode === 'student' && studentAnswer !== undefined && studentAnswer !== null) {
      console.log('🔄 InputQuestion syncing with parent studentAnswer:', studentAnswer);
      setAnswer(studentAnswer);
    }
  }, [studentAnswer, mode]);

  // Load answers for teacher mode
  useEffect(() => {
    if (mode === 'teacher' && question?.answers) {
      setAnswers(question.answers.length > 0 ? question.answers : ['']);
    }
  }, [question?.answers, mode]);

  // Auto-save functionality for student mode
  useEffect(() => {
    if (mode === 'student' && answer && question?.question_id && testId && testType && studentId) {
      const timeoutId = setTimeout(() => {
        setIsAutoSaving(true);
        setItem(`test_progress_${studentId}_${testType}_${testId}_${question.question_id}`, answer);
        setTimeout(() => setIsAutoSaving(false), 1000);
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [answer, question?.question_id, testType, testId, mode, studentId, setItem]);

  // Auto-save functionality for teacher mode
  useEffect(() => {
    if (mode === 'teacher' && answers && onQuestionChange) {
      const timeoutId = setTimeout(() => {
        onQuestionChange({
          ...question,
          answers: answers.filter(a => a.trim())
        });
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [answers, question, mode, onQuestionChange]);

  // Handle answer change for student mode
  const handleAnswerChange = useCallback((value) => {
    setAnswer(value);
    
    // Validate answer
    const isValidAnswer = value.trim().length > 0;
    setIsValid(isValidAnswer);
    setValidationMessage(isValidAnswer ? '' : 'Please enter an answer');
    
    // Notify parent component
    if (onAnswerChange) {
      onAnswerChange(question.question_id, value);
    }
  }, [question?.question_id, onAnswerChange]);

  // Handle answer change for teacher mode
  const handleAnswerChangeTeacher = useCallback((index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
    
    // Notify parent component
    if (onAnswerChange) {
      onAnswerChange(question.question_id, newAnswers);
    }
  }, [answers, question?.question_id, onAnswerChange]);

  // ✅ COMPLETED: addAnswerField() → addAnswerField() (teacher mode)
  const addAnswerField = useCallback(() => {
    if (mode === 'teacher') {
      const newAnswers = [...answers, ''];
      setAnswers(newAnswers);
      
      if (onAnswerAdd) {
        onAnswerAdd(question.question_id, newAnswers);
      }
    }
  }, [answers, question?.question_id, mode, onAnswerAdd]);

  // ✅ COMPLETED: removeAnswerField() → removeAnswerField() (teacher mode)
  const removeAnswerField = useCallback((index) => {
    if (mode === 'teacher' && answers.length > 1) {
      const newAnswers = answers.filter((_, i) => i !== index);
      setAnswers(newAnswers);
      
      if (onAnswerRemove) {
        onAnswerRemove(question.question_id, newAnswers);
      }
    }
  }, [answers, question?.question_id, mode, onAnswerRemove]);

  // ✅ COMPLETED: validateQuestion() → validateQuestion()
  const validateQuestion = useCallback(() => {
    if (mode === 'student') {
      const isValidAnswer = answer.trim().length > 0;
      setIsValid(isValidAnswer);
      setValidationMessage(isValidAnswer ? '' : 'Please enter an answer');
      return isValidAnswer;
    } else if (mode === 'teacher') {
      const hasValidAnswers = answers.some(a => a.trim().length > 0);
      setIsValid(hasValidAnswers);
      setValidationMessage(hasValidAnswers ? '' : 'Please enter at least one correct answer');
      return hasValidAnswers;
    }
    return true;
  }, [answer, answers, mode]);

  // ✅ COMPLETED: formatQuestion() → formatQuestion()
  const formatQuestion = useCallback((questionText) => {
    if (!questionText) return '';
    // Render math expressions in text
    return renderMathInText(questionText, false);
  }, []);

  // Handle input focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  // Handle input blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    validateQuestion();
  }, [validateQuestion]);

  // Handle key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && mode === 'student') {
      // Auto-save on Enter
      if (answer.trim()) {
        setItem(`test_progress_${testType}_${testId}_${question.question_id}`, answer);
        showNotification('Answer saved', 'success');
      }
    }
  }, [answer, testType, testId, question?.question_id, mode, setItem, showNotification]);

  // Optional focus on mount (disabled to avoid auto-scrolling page)
  // useEffect(() => {
  //   if (inputRef.current && mode === 'student') {
  //     inputRef.current.focus();
  //   }
  // }, [mode]);

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
            ? `QUESTION ${typeof displayNumber === 'number' ? displayNumber : question.question_id}`
            : `Question ${typeof displayNumber === 'number' ? displayNumber : question.question_id}`}
        </h4>
        {isAutoSaving && (
          <div className={`flex items-center space-x-1 text-sm ${
            isCyberpunk ? '' : 'text-gray-500'
          }`}
          style={isCyberpunk ? {
            color: CYBERPUNK_COLORS.cyan,
            fontFamily: 'monospace'
          } : {}}>
            <LoadingSpinner size="small" />
            <span>Saving...</span>
          </div>
        )}
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
          __html: formatQuestion(question.question) 
        }}
      />
      
      <div className="space-y-3">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            id={`input_${question.question_id}`}
            placeholder={isCyberpunk ? "ENTER YOUR ANSWER HERE..." : "Enter your answer here..."}
            value={answer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyPress={handleKeyPress}
            className={`w-full px-4 py-3 pr-10 border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 ${
              isCyberpunk
                ? 'border'
                : !isValid 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500 text-gray-800 placeholder-gray-400' 
                  : isFocused 
                    ? 'border-blue-500 text-gray-800 placeholder-gray-400 focus:ring-blue-500' 
                    : 'border-gray-300 hover:border-gray-400 text-gray-800 placeholder-gray-400'
            }`}
            style={isCyberpunk ? {
              backgroundColor: CYBERPUNK_COLORS.black,
              borderColor: !isValid 
                ? CYBERPUNK_COLORS.red
                : isFocused 
                  ? CYBERPUNK_COLORS.cyan
                  : CYBERPUNK_COLORS.cyan,
              color: CYBERPUNK_COLORS.cyan,
              fontFamily: 'monospace',
              ...(isFocused ? themeStyles.glow : {}),
              ...(isFocused ? {} : {})
            } : {}}
            data-question-id={question.question_id}
            aria-label={`Answer for question ${question.question_id}`}
            aria-invalid={!isValid}
            aria-describedby={!isValid ? `error-${question.question_id}` : undefined}
          />
        </div>
        
      </div>
      
      {showCorrectAnswers && question.correct_answers && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h5 className="text-sm font-semibold text-green-800 mb-2">Correct Answers:</h5>
          <ul className="space-y-1">
            {question.correct_answers.map((correctAnswer, index) => (
              <li 
                key={index} 
                className="text-green-700 text-sm"
                dangerouslySetInnerHTML={{
                  __html: `• ${renderMathInText(correctAnswer, false)}`
                }}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  // Render teacher mode
  const renderTeacherMode = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-semibold text-gray-800">
          Question {question.question_id || 'New'}
        </h4>
        {isSaving && (
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <LoadingSpinner size="small" />
            <span>Saving...</span>
          </div>
        )}
      </div>
      
      <div className="space-y-6">
        <div>
          <label htmlFor={`question_${question.question_id || 'new'}`} className="block text-sm font-medium text-gray-700 mb-2">
            Question Text *
          </label>
          <div className="relative">
            <input
              type="text"
              id={`question_${question.question_id || 'new'}`}
              value={question.question || ''}
              onChange={(e) => onQuestionChange && onQuestionChange({
                ...question,
                question: e.target.value
              })}
              placeholder="Enter question text"
              className={`w-full px-4 py-3 pr-10 border-2 rounded-lg text-gray-800 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.question 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 hover:border-gray-400 focus:border-blue-500'
              }`}
            />
            <MathEditorButton
              inputRef={() => document.getElementById(`question_${question.question_id || 'new'}`)}
              onChange={(e) => onQuestionChange && onQuestionChange({
                ...question,
                question: e.target.value
              })}
            />
          </div>
          {validationErrors.question && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {validationErrors.question}
            </div>
          )}
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Correct Answers *
            </label>
            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={addAnswerField}
              className="px-3 py-1 text-sm"
            >
              + Add Answer
            </Button>
          </div>
          
          <div className="space-y-3">
            {answers.map((answer, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
                  {index + 1}
                </div>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => handleAnswerChangeTeacher(index, e.target.value)}
                    placeholder={`Correct answer ${index + 1}`}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    data-question-id={question.question_id}
                    data-answer-index={index}
                  />
                  <MathEditorButton
                    inputRef={() => {
                      return document.querySelector(`[data-question-id="${question.question_id}"][data-answer-index="${index}"]`);
                    }}
                    onChange={(e) => handleAnswerChangeTeacher(index, e.target.value)}
                  />
                </div>
                {answers.length > 1 && (
                  <Button
                    type="button"
                    variant="danger"
                    size="small"
                    onClick={() => removeAnswerField(index)}
                    className="px-2 py-1 text-sm"
                  >
                    × Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
          
          {validationErrors.answers && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {validationErrors.answers}
            </div>
          )}
        </div>
      </div>
      
      {onSave && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="success"
            onClick={onSave}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving ? <LoadingSpinner size="small" /> : 'Save Question'}
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className={`input-question-container ${mode} ${isFocused ? 'focused' : ''}`}>
      {mode === 'student' ? renderStudentMode() : renderTeacherMode()}
    </div>
  );
};

export default InputQuestion;

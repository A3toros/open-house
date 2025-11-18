import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { getThemeStyles, getCyberpunkCardBg, CYBERPUNK_COLORS, colorToRgba } from '@/utils/themeUtils';

// PROGRESS TRACKER COMPONENT - Visual Progress Tracking UI
// ✅ COMPLETED: Real-time progress tracking with visual indicators
// ✅ COMPLETED: Progress bar with percentage display
// ✅ COMPLETED: Question counter with answered/total
// ✅ COMPLETED: Time tracking display
// ✅ COMPLETED: Submit button state management
// ✅ COMPLETED: Responsive design with Tailwind CSS
// ✅ COMPLETED: Animation effects with Framer Motion

const ProgressTracker = ({
  answeredCount = 0,
  totalQuestions = 0,
  timeElapsed = 0,
  onSubmitTest,
  isSubmitting = false,
  canSubmit = false,
  className = '',
  themeClasses,
  isCyberpunk
}) => {
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const cyberpunkMode = isCyberpunk !== undefined ? isCyberpunk : theme === 'cyberpunk';
  const percentage = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const remainingQuestions = totalQuestions - answeredCount;
  
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 80) return 'bg-blue-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getProgressTextColor = (percentage) => {
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 60) return 'text-yellow-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className={`rounded-lg shadow-lg p-6 border-2 ${
      cyberpunkMode 
        ? getCyberpunkCardBg(1).className
        : 'bg-white'
    } ${className}`}
    style={cyberpunkMode ? {
      ...getCyberpunkCardBg(1).style,
      ...themeStyles.glow
    } : {}}>
      {/* Progress Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${
          cyberpunkMode ? '' : 'text-gray-900'
        }`}
        style={cyberpunkMode ? {
          ...themeStyles.textCyan,
          fontFamily: 'monospace'
        } : {}}>
          {cyberpunkMode ? 'TEST PROGRESS' : 'Test Progress'}
        </h3>
        <div className="flex items-center space-x-4">
          {/* Time Display */}
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⏱️</span>
            <span className={`text-sm font-mono ${
              cyberpunkMode ? '' : 'text-gray-600'
            }`}
            style={cyberpunkMode ? {
              ...themeStyles.textYellow,
              fontFamily: 'monospace'
            } : {}}>
              {formatTime(timeElapsed)}
            </span>
          </div>
          
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-medium ${
            cyberpunkMode ? '' : 'text-gray-700'
          }`}
          style={cyberpunkMode ? {
            color: CYBERPUNK_COLORS.yellow,
            fontFamily: 'monospace'
          } : {}}>
            Progress
          </span>
          <span className={`text-sm font-semibold ${
            cyberpunkMode ? '' : getProgressTextColor(percentage)
          }`}
          style={cyberpunkMode ? {
            ...themeStyles.textCyan,
            fontFamily: 'monospace'
          } : {}}>
            {percentage}%
          </span>
        </div>
        
        <div className={`w-full rounded-full h-3 overflow-hidden border ${
          cyberpunkMode 
            ? 'bg-gray-800 border-cyan-400/50'
            : 'bg-gray-200'
        }`}
        style={cyberpunkMode ? themeStyles.glow : {}}>
          <motion.div
            className={`h-full transition-colors duration-300 ${
              cyberpunkMode ? '' : getProgressColor(percentage)
            }`}
            style={cyberpunkMode ? {
              background: `linear-gradient(to right, ${CYBERPUNK_COLORS.yellow}, ${CYBERPUNK_COLORS.cyan})`,
              boxShadow: `0 0 10px ${CYBERPUNK_COLORS.cyan}`
            } : {}}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Question Counter */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
        <div className={`text-center p-2 sm:p-3 rounded-lg border ${
          cyberpunkMode 
            ? getCyberpunkCardBg(3).className
            : 'bg-blue-50'
        }`}
        style={cyberpunkMode ? {
          ...getCyberpunkCardBg(3).style,
          ...themeStyles.glow
        } : {}}>
          <div className={`text-lg sm:text-2xl font-bold ${
            cyberpunkMode ? '' : 'text-blue-600'
          }`}
          style={cyberpunkMode ? {
            ...themeStyles.textCyan,
            fontFamily: 'monospace'
          } : {}}>
            {answeredCount}
          </div>
          <div className={`text-xs ${
            cyberpunkMode ? '' : 'text-blue-600'
          }`}
          style={cyberpunkMode ? {
            color: CYBERPUNK_COLORS.yellow,
            fontFamily: 'monospace'
          } : {}}>
            Answered
          </div>
        </div>
        <div className={`text-center p-2 sm:p-3 rounded-lg border ${
          cyberpunkMode 
            ? getCyberpunkCardBg(1).className
            : 'bg-gray-50'
        }`}
        style={cyberpunkMode ? {
          ...getCyberpunkCardBg(1).style,
          ...themeStyles.glow
        } : {}}>
          <div className={`text-lg sm:text-2xl font-bold ${
            cyberpunkMode ? '' : 'text-gray-600'
          }`}
          style={cyberpunkMode ? {
            ...themeStyles.textYellow,
            fontFamily: 'monospace'
          } : {}}>
            {remainingQuestions}
          </div>
          <div className={`text-xs ${
            cyberpunkMode ? '' : 'text-gray-600'
          }`}
          style={cyberpunkMode ? {
            color: CYBERPUNK_COLORS.yellow,
            fontFamily: 'monospace'
          } : {}}>
            Remaining
          </div>
        </div>
        <div className={`text-center p-2 sm:p-3 rounded-lg border ${
          cyberpunkMode 
            ? getCyberpunkCardBg(2).className
            : 'bg-purple-50'
        }`}
        style={cyberpunkMode ? {
          ...getCyberpunkCardBg(2).style,
          ...themeStyles.glow
        } : {}}>
          <div className={`text-lg sm:text-2xl font-bold ${
            cyberpunkMode ? '' : 'text-purple-600'
          }`}
          style={cyberpunkMode ? {
            ...themeStyles.textPurple,
            fontFamily: 'monospace'
          } : {}}>
            {totalQuestions}
          </div>
          <div className={`text-xs ${
            cyberpunkMode ? '' : 'text-purple-600'
          }`}
          style={cyberpunkMode ? {
            color: CYBERPUNK_COLORS.yellow,
            fontFamily: 'monospace'
          } : {}}>
            Total
          </div>
        </div>
      </div>

      {/* Progress Status */}
      <div className="mb-4">
        {answeredCount === totalQuestions ? (
          <motion.div
            className={`flex items-center justify-center p-3 border rounded-lg ${
              cyberpunkMode 
                ? 'border'
                : 'bg-green-50 border-green-200'
            }`}
            style={cyberpunkMode ? {
              backgroundColor: CYBERPUNK_COLORS.black,
              borderColor: CYBERPUNK_COLORS.green,
              ...themeStyles.glow
            } : {}}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <span className={`font-medium ${
              cyberpunkMode ? '' : 'text-green-600'
            }`}
            style={cyberpunkMode ? {
              ...themeStyles.textGreen,
              fontFamily: 'monospace'
            } : {}}>
              🎉 All questions answered! Ready to submit.
            </span>
          </motion.div>
        ) : remainingQuestions === 1 ? (
          <motion.div
            className={`flex items-center justify-center p-3 border rounded-lg ${
              cyberpunkMode 
                ? 'border'
                : 'bg-yellow-50 border-yellow-200'
            }`}
            style={cyberpunkMode ? {
              backgroundColor: CYBERPUNK_COLORS.black,
              borderColor: CYBERPUNK_COLORS.yellow,
              ...themeStyles.glow
            } : {}}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <span className={`font-medium ${
              cyberpunkMode ? '' : 'text-yellow-600'
            }`}
            style={cyberpunkMode ? {
              ...themeStyles.textYellow,
              fontFamily: 'monospace'
            } : {}}>
              Almost there! 1 question remaining.
            </span>
          </motion.div>
        ) : (
          <div className={`flex items-center justify-center p-3 border rounded-lg ${
            cyberpunkMode 
              ? 'border'
              : 'bg-gray-50 border-gray-200'
          }`}
          style={cyberpunkMode ? {
            backgroundColor: CYBERPUNK_COLORS.black,
            borderColor: CYBERPUNK_COLORS.cyan
          } : {}}>
            <span className={`font-medium ${
              cyberpunkMode ? '' : 'text-gray-600'
            }`}
            style={cyberpunkMode ? {
              color: CYBERPUNK_COLORS.cyan,
              fontFamily: 'monospace'
            } : {}}>
              {remainingQuestions} questions remaining
            </span>
          </div>
        )}
      </div>

      {/* Submit Button - Only show when all questions are answered */}
      {canSubmit && (
        <div className="flex justify-center">
          <motion.button
            onClick={onSubmitTest}
            disabled={isSubmitting}
            className={`px-8 py-3 rounded-lg font-semibold transition-all duration-300 border-2 ${
              isCyberpunk
                ? 'border'
                : !isSubmitting
                  ? 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl text-white'
                  : 'bg-gray-400 cursor-not-allowed text-white'
            }`}
            style={isCyberpunk ? {
              backgroundColor: CYBERPUNK_COLORS.black,
              borderColor: !isSubmitting ? CYBERPUNK_COLORS.cyan : CYBERPUNK_COLORS.cyan,
              color: !isSubmitting ? CYBERPUNK_COLORS.cyan : CYBERPUNK_COLORS.cyan,
              fontFamily: 'monospace',
              ...(!isSubmitting ? themeStyles.glow : {})
            } : {}}
            whileHover={!isSubmitting ? { scale: 1.05 } : {}}
            whileTap={!isSubmitting ? { scale: 0.95 } : {}}
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className={`animate-spin rounded-full h-4 w-4 border-b-2 ${
                  isCyberpunk ? '' : 'border-white'
                }`}
                style={isCyberpunk ? {
                  borderColor: CYBERPUNK_COLORS.cyan
                } : {}}></div>
                <span>{isCyberpunk ? 'SUBMITTING...' : 'Submitting...'}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {!isCyberpunk && <span>✅</span>}
                <span>{isCyberpunk ? 'SUBMIT TEST' : 'Submit Test'}</span>
              </div>
            )}
          </motion.button>
        </div>
      )}

    </div>
  );
};

export default ProgressTracker;
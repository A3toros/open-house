import React, { useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { getThemeStyles, getCyberpunkCardBg, CYBERPUNK_COLORS } from '../../utils/themeUtils';
import AudioPlayer from './AudioPlayer';

const FeedbackDisplay = ({ 
  transcript, 
  scores, 
  audioBlob, 
  recordingTime,
  onReRecord, 
  onFinalSubmit, 
  canReRecord, 
  attemptNumber, 
  maxAttempts,
  isSubmitting = false
}) => {
  // Theme hook
  const { theme, isCyberpunk, themeClasses } = useTheme();
  const themeStyles = getThemeStyles(theme);
  
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);
  
  console.log('🎤 FeedbackDisplay received recordingTime:', recordingTime);

  const getScoreColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (isCyberpunk) {
      if (percentage >= 80) return CYBERPUNK_COLORS.cyan;
      return CYBERPUNK_COLORS.red;
    }
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getScoreColorClass = (score, maxScore) => {
    if (isCyberpunk) return '';
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGrade = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  const getOverallGrade = () => {
    return getScoreGrade(scores?.overall_score || 0, 100);
  };

  const getOverallColor = () => {
    return getScoreColor(scores?.overall_score || 0, 100);
  };

  // Debug logging
  console.log('🎯 FeedbackDisplay received scores:', scores);
  console.log('🎯 Individual score values:', {
    grammar_score: scores?.grammar_score,
    vocabulary_score: scores?.vocabulary_score,
    pronunciation_score: scores?.pronunciation_score,
    fluency_score: scores?.fluency_score,
    content_score: scores?.content_score
  });

  return (
    <div className={`feedback-display rounded-lg shadow-lg p-3 sm:p-6 ${
      isCyberpunk ? getCyberpunkCardBg(0).className : 'bg-white'
    }`}
    style={isCyberpunk ? {
      ...getCyberpunkCardBg(0).style,
      ...themeStyles.glow
    } : {}}>
      <div className="mb-6">
        <h2 className={`text-2xl font-bold mb-2 ${
          isCyberpunk ? '' : ''
        }`}
        style={isCyberpunk ? {
          ...themeStyles.textCyan,
          fontFamily: 'monospace'
        } : {}}>
          {isCyberpunk ? 'SPEAKING TEST RESULTS' : 'Speaking Test Results'}
        </h2>
        <p className={isCyberpunk ? '' : 'text-gray-600'}
        style={isCyberpunk ? {
          color: CYBERPUNK_COLORS.cyan,
          fontFamily: 'monospace'
        } : {}}>
          {isCyberpunk 
            ? 'REVIEW YOUR PERFORMANCE AND DECIDE WHETHER TO SUBMIT OR RE-RECORD.'
            : 'Review your performance and decide whether to submit or re-record.'}
        </p>
      </div>

      {/* Overall Score */}
      <div className={`p-3 sm:p-6 rounded-lg mb-6 border-2 ${
        isCyberpunk ? getCyberpunkCardBg(1).className : 'bg-gradient-to-r from-blue-50 to-green-50'
      }`}
      style={isCyberpunk ? {
        ...getCyberpunkCardBg(1).style,
        ...themeStyles.glow
      } : {}}>
        <div className="text-center">
          <div className={`text-4xl font-bold ${
            isCyberpunk ? '' : getOverallColor()
          }`}
          style={isCyberpunk ? {
            color: getScoreColor(scores?.overall_score || 0, 100),
            fontFamily: 'monospace',
            ...(scores?.overall_score >= 80 ? themeStyles.textShadow : themeStyles.textShadowRed)
          } : {}}>
            {scores?.overall_score || 0}/100
          </div>
          <div className={`text-2xl font-semibold mt-2 ${
            isCyberpunk ? '' : getOverallColor()
          }`}
          style={isCyberpunk ? {
            color: getScoreColor(scores?.overall_score || 0, 100),
            fontFamily: 'monospace',
            ...(scores?.overall_score >= 80 ? themeStyles.textShadow : themeStyles.textShadowRed)
          } : {}}>
            {isCyberpunk ? `GRADE: ${getOverallGrade()}` : `Grade: ${getOverallGrade()}`}
          </div>
          <div className={`mt-2 ${
            isCyberpunk ? '' : 'text-gray-600'
          }`}
          style={isCyberpunk ? {
            color: CYBERPUNK_COLORS.cyan,
            fontFamily: 'monospace'
          } : {}}>
            {scores?.overall_score >= 80 ? (isCyberpunk ? 'EXCELLENT WORK!' : 'Excellent work!') : 
             scores?.overall_score >= 60 ? (isCyberpunk ? 'GOOD JOB!' : 'Good job!') : 
             scores?.overall_score >= 50 ? (isCyberpunk ? 'NOT BAD, BUT COULD BE BETTER.' : 'Not bad, but could be better.') : 
             (isCyberpunk ? 'KEEP PRACTICING!' : 'Keep practicing!')}
          </div>
        </div>
      </div>

      {/* Score Breakdown - All 5 AI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Grammar Score */}
        <div className={`border rounded-lg p-3 sm:p-4 ${
          isCyberpunk ? getCyberpunkCardBg(2).className : 'bg-white'
        }`}
        style={isCyberpunk ? {
          ...getCyberpunkCardBg(2).style
        } : {}}>
          <div className="flex justify-between items-center mb-2">
            <span className={`font-semibold ${
              isCyberpunk ? '' : 'text-gray-700'
            }`}
            style={isCyberpunk ? {
              color: CYBERPUNK_COLORS.cyan,
              fontFamily: 'monospace'
            } : {}}>
              {isCyberpunk ? 'GRAMMAR' : 'Grammar'}
            </span>
            <span className={`font-bold ${
              isCyberpunk ? '' : getScoreColorClass(scores?.grammar_score || 0, 25)
            }`}
            style={isCyberpunk ? {
              color: getScoreColor(scores?.grammar_score || 0, 25),
              fontFamily: 'monospace'
            } : {}}>
              {scores?.grammar_score || 0}/25
            </span>
          </div>
          <div className={`text-sm ${
            isCyberpunk ? '' : 'text-gray-600'
          }`}
          style={isCyberpunk ? {
            color: CYBERPUNK_COLORS.cyan,
            fontFamily: 'monospace'
          } : {}}>
            {isCyberpunk 
              ? `${scores?.grammar_mistakes || 0} MISTAKES FOUND`
              : `${scores?.grammar_mistakes || 0} mistakes found`}
          </div>
          <div className={`w-full rounded-full h-2 mt-2 ${
            isCyberpunk ? 'bg-gray-800' : 'bg-gray-200'
          }`}>
            <div 
              className={`h-2 rounded-full ${
                isCyberpunk ? '' : 'bg-green-600'
              }`}
              style={isCyberpunk ? {
                backgroundColor: getScoreColor(scores?.grammar_score || 0, 25),
                width: `${Math.min((scores?.grammar_score || 0) / 25 * 100, 100)}%`
              } : {
                width: `${Math.min((scores?.grammar_score || 0) / 25 * 100, 100)}%`
              }}
            />
          </div>
        </div>

        {/* Vocabulary Score */}
        <div className={`border rounded-lg p-3 sm:p-4 ${
          isCyberpunk ? getCyberpunkCardBg(0).className : 'bg-white'
        }`}
        style={isCyberpunk ? {
          ...getCyberpunkCardBg(0).style
        } : {}}>
          <div className="flex justify-between items-center mb-2">
            <span className={`font-semibold ${
              isCyberpunk ? '' : 'text-gray-700'
            }`}
            style={isCyberpunk ? {
              color: CYBERPUNK_COLORS.cyan,
              fontFamily: 'monospace'
            } : {}}>
              {isCyberpunk ? 'VOCABULARY' : 'Vocabulary'}
            </span>
            <span className={`font-bold ${
              isCyberpunk ? '' : getScoreColorClass(scores?.vocabulary_score || 0, 20)
            }`}
            style={isCyberpunk ? {
              color: getScoreColor(scores?.vocabulary_score || 0, 20),
              fontFamily: 'monospace'
            } : {}}>
              {scores?.vocabulary_score || 0}/20
            </span>
          </div>
          <div className={`text-sm ${
            isCyberpunk ? '' : 'text-gray-600'
          }`}
          style={isCyberpunk ? {
            color: CYBERPUNK_COLORS.cyan,
            fontFamily: 'monospace'
          } : {}}>
            {isCyberpunk 
              ? `${scores?.vocabulary_mistakes || 0} VOCABULARY ISSUES`
              : `${scores?.vocabulary_mistakes || 0} vocabulary issues`}
          </div>
          <div className={`w-full rounded-full h-2 mt-2 ${
            isCyberpunk ? 'bg-gray-800' : 'bg-gray-200'
          }`}>
            <div 
              className={`h-2 rounded-full ${
                isCyberpunk ? '' : 'bg-purple-600'
              }`}
              style={isCyberpunk ? {
                backgroundColor: getScoreColor(scores?.vocabulary_score || 0, 20),
                width: `${Math.min((scores?.vocabulary_score || 0) / 20 * 100, 100)}%`
              } : {
                width: `${Math.min((scores?.vocabulary_score || 0) / 20 * 100, 100)}%`
              }}
            />
          </div>
        </div>

        {/* Pronunciation Score */}
        <div className={`border rounded-lg p-3 sm:p-4 ${
          isCyberpunk ? getCyberpunkCardBg(1).className : 'bg-white'
        }`}
        style={isCyberpunk ? {
          ...getCyberpunkCardBg(1).style
        } : {}}>
          <div className="flex justify-between items-center mb-2">
            <span className={`font-semibold ${
              isCyberpunk ? '' : 'text-gray-700'
            }`}
            style={isCyberpunk ? {
              color: CYBERPUNK_COLORS.cyan,
              fontFamily: 'monospace'
            } : {}}>
              {isCyberpunk ? 'PRONUNCIATION' : 'Pronunciation'}
            </span>
            <span className={`font-bold ${
              isCyberpunk ? '' : getScoreColorClass(scores?.pronunciation_score || 0, 15)
            }`}
            style={isCyberpunk ? {
              color: getScoreColor(scores?.pronunciation_score || 0, 15),
              fontFamily: 'monospace'
            } : {}}>
              {scores?.pronunciation_score || 0}/15
            </span>
          </div>
          <div className={`text-sm ${
            isCyberpunk ? '' : 'text-gray-600'
          }`}
          style={isCyberpunk ? {
            color: CYBERPUNK_COLORS.cyan,
            fontFamily: 'monospace'
          } : {}}>
            {isCyberpunk ? 'CLARITY AND ACCURACY' : 'Clarity and accuracy'}
          </div>
          <div className={`w-full rounded-full h-2 mt-2 ${
            isCyberpunk ? 'bg-gray-800' : 'bg-gray-200'
          }`}>
            <div 
              className={`h-2 rounded-full ${
                isCyberpunk ? '' : 'bg-orange-600'
              }`}
              style={isCyberpunk ? {
                backgroundColor: getScoreColor(scores?.pronunciation_score || 0, 15),
                width: `${Math.min((scores?.pronunciation_score || 0) / 15 * 100, 100)}%`
              } : {
                width: `${Math.min((scores?.pronunciation_score || 0) / 15 * 100, 100)}%`
              }}
            />
          </div>
        </div>

        {/* Fluency Score */}
        <div className={`border rounded-lg p-3 sm:p-4 ${
          isCyberpunk ? getCyberpunkCardBg(2).className : 'bg-white'
        }`}
        style={isCyberpunk ? {
          ...getCyberpunkCardBg(2).style
        } : {}}>
          <div className="flex justify-between items-center mb-2">
            <span className={`font-semibold ${
              isCyberpunk ? '' : 'text-gray-700'
            }`}
            style={isCyberpunk ? {
              color: CYBERPUNK_COLORS.cyan,
              fontFamily: 'monospace'
            } : {}}>
              {isCyberpunk ? 'FLUENCY' : 'Fluency'}
            </span>
            <span className={`font-bold ${
              isCyberpunk ? '' : getScoreColorClass(scores?.fluency_score || 0, 20)
            }`}
            style={isCyberpunk ? {
              color: getScoreColor(scores?.fluency_score || 0, 20),
              fontFamily: 'monospace'
            } : {}}>
              {scores?.fluency_score || 0}/20
            </span>
          </div>
          <div className={`text-sm ${
            isCyberpunk ? '' : 'text-gray-600'
          }`}
          style={isCyberpunk ? {
            color: CYBERPUNK_COLORS.cyan,
            fontFamily: 'monospace'
          } : {}}>
            {isCyberpunk ? 'PACE, PAUSES, AND FLOW' : 'Pace, pauses, and flow'}
          </div>
          <div className={`w-full rounded-full h-2 mt-2 ${
            isCyberpunk ? 'bg-gray-800' : 'bg-gray-200'
          }`}>
            <div 
              className={`h-2 rounded-full ${
                isCyberpunk ? '' : 'bg-blue-600'
              }`}
              style={isCyberpunk ? {
                backgroundColor: getScoreColor(scores?.fluency_score || 0, 20),
                width: `${Math.min((scores?.fluency_score || 0) / 20 * 100, 100)}%`
              } : {
                width: `${Math.min((scores?.fluency_score || 0) / 20 * 100, 100)}%`
              }}
            />
          </div>
        </div>

        {/* Content Score */}
        <div className={`border rounded-lg p-3 sm:p-4 ${
          isCyberpunk ? getCyberpunkCardBg(0).className : 'bg-white'
        }`}
        style={isCyberpunk ? {
          ...getCyberpunkCardBg(0).style
        } : {}}>
          <div className="flex justify-between items-center mb-2">
            <span className={`font-semibold ${
              isCyberpunk ? '' : 'text-gray-700'
            }`}
            style={isCyberpunk ? {
              color: CYBERPUNK_COLORS.cyan,
              fontFamily: 'monospace'
            } : {}}>
              {isCyberpunk ? 'CONTENT' : 'Content'}
            </span>
            <span className={`font-bold ${
              isCyberpunk ? '' : getScoreColorClass(scores?.content_score || 0, 20)
            }`}
            style={isCyberpunk ? {
              color: getScoreColor(scores?.content_score || 0, 20),
              fontFamily: 'monospace'
            } : {}}>
              {scores?.content_score || 0}/20
            </span>
          </div>
          <div className={`text-sm ${
            isCyberpunk ? '' : 'text-gray-600'
          }`}
          style={isCyberpunk ? {
            color: CYBERPUNK_COLORS.cyan,
            fontFamily: 'monospace'
          } : {}}>
            {isCyberpunk ? 'HOW WELL ADDRESSED THE PROMPT' : 'How well addressed the prompt'}
          </div>
          <div className={`w-full rounded-full h-2 mt-2 ${
            isCyberpunk ? 'bg-gray-800' : 'bg-gray-200'
          }`}>
            <div 
              className={`h-2 rounded-full ${
                isCyberpunk ? '' : 'bg-indigo-600'
              }`}
              style={isCyberpunk ? {
                backgroundColor: getScoreColor(scores?.content_score || 0, 20),
                width: `${Math.min((scores?.content_score || 0) / 20 * 100, 100)}%`
              } : {
                width: `${Math.min((scores?.content_score || 0) / 20 * 100, 100)}%`
              }}
            />
          </div>
        </div>

        {/* Word Count (Bonus Info) */}
        <div className={`border rounded-lg p-3 sm:p-4 ${
          isCyberpunk ? getCyberpunkCardBg(1).className : 'bg-white'
        }`}
        style={isCyberpunk ? {
          ...getCyberpunkCardBg(1).style
        } : {}}>
          <div className="flex justify-between items-center mb-2">
            <span className={`font-semibold ${
              isCyberpunk ? '' : 'text-gray-700'
            }`}
            style={isCyberpunk ? {
              color: CYBERPUNK_COLORS.cyan,
              fontFamily: 'monospace'
            } : {}}>
              {isCyberpunk ? 'WORD COUNT' : 'Word Count'}
            </span>
            <span className={`font-bold ${
              isCyberpunk ? '' : 'text-gray-700'
            }`}
            style={isCyberpunk ? {
              color: CYBERPUNK_COLORS.cyan,
              fontFamily: 'monospace'
            } : {}}>
              {scores?.word_count || 0} {isCyberpunk ? 'WORDS' : 'words'}
            </span>
          </div>
          <div className={`text-sm ${
            isCyberpunk ? '' : 'text-gray-600'
          }`}
          style={isCyberpunk ? {
            color: CYBERPUNK_COLORS.cyan,
            fontFamily: 'monospace'
          } : {}}>
            {isCyberpunk ? 'TOTAL WORDS SPOKEN' : 'Total words spoken'}
          </div>
          <div className={`w-full rounded-full h-2 mt-2 ${
            isCyberpunk ? 'bg-gray-800' : 'bg-gray-200'
          }`}>
            <div 
              className={`h-2 rounded-full ${
                isCyberpunk ? '' : 'bg-gray-600'
              }`}
              style={isCyberpunk ? {
                backgroundColor: CYBERPUNK_COLORS.cyan,
                width: `${Math.min((scores?.word_count || 0) / 100 * 100, 100)}%`
              } : {
                width: `${Math.min((scores?.word_count || 0) / 100 * 100, 100)}%`
              }}
            />
          </div>
        </div>
      </div>

      {/* Audio Playback */}
      {audioBlob && (
        <div className="mb-6">
          <h3 className={`text-lg font-semibold mb-3 ${
            isCyberpunk ? '' : ''
          }`}
          style={isCyberpunk ? {
            ...themeStyles.textCyan,
            fontFamily: 'monospace'
          } : {}}>
            {isCyberpunk ? 'YOUR RECORDING' : 'Your Recording'}
          </h3>
          <AudioPlayer audioBlob={audioBlob} recordingTime={recordingTime} />
        </div>
      )}

      {/* AI Feedback - Prominent Display */}
      {scores?.feedback && (
        <div className={`mb-6 p-3 sm:p-6 rounded-lg border-2 ${
          isCyberpunk ? getCyberpunkCardBg(2).className : 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200'
        }`}
        style={isCyberpunk ? {
          ...getCyberpunkCardBg(2).style,
          ...themeStyles.glow
        } : {}}>
          <div className="flex items-start space-x-3">
            <span className="text-2xl">🤖</span>
            <div className="flex-1">
              <div className={`font-semibold mb-3 text-lg ${
                isCyberpunk ? '' : 'text-green-800'
              }`}
              style={isCyberpunk ? {
                ...themeStyles.textCyan,
                fontFamily: 'monospace'
              } : {}}>
                {isCyberpunk ? 'AI FEEDBACK' : 'AI Feedback'}
              </div>
              <p className={`leading-relaxed ${
                isCyberpunk ? '' : 'text-gray-700'
              }`}
              style={isCyberpunk ? {
                color: CYBERPUNK_COLORS.cyan,
                fontFamily: 'monospace'
              } : {}}>
                {scores.feedback}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Improved Transcript */}
      {scores?.improved_transcript && (
        <div className={`mb-6 rounded-lg p-3 sm:p-4 border-2 ${
          isCyberpunk ? getCyberpunkCardBg(0).className : 'bg-green-50 border-green-200'
        }`}
        style={isCyberpunk ? {
          ...getCyberpunkCardBg(0).style,
          ...themeStyles.glow
        } : {}}>
          <div className="flex items-start space-x-2 mb-3">
            <span className="text-lg">✨</span>
            <div>
              <h4 className={`font-semibold mb-2 ${
                isCyberpunk ? '' : 'text-green-800'
              }`}
              style={isCyberpunk ? {
                ...themeStyles.textCyan,
                fontFamily: 'monospace'
              } : {}}>
                {isCyberpunk ? 'IMPROVED VERSION' : 'Improved Version'}
              </h4>
              <p className={`text-sm mb-3 ${
                isCyberpunk ? '' : 'text-gray-600'
              }`}
              style={isCyberpunk ? {
                color: CYBERPUNK_COLORS.cyan,
                fontFamily: 'monospace'
              } : {}}>
                {isCyberpunk 
                  ? "HERE'S HOW YOUR RESPONSE COULD BE IMPROVED WITH BETTER GRAMMAR AND VOCABULARY:"
                  : "Here's how your response could be improved with better grammar and vocabulary:"}
              </p>
            </div>
          </div>
          <div className={`border rounded p-3 ${
            isCyberpunk ? 'border-cyan-400' : 'bg-white border-green-200'
          }`}
          style={isCyberpunk ? {
            backgroundColor: CYBERPUNK_COLORS.black,
            borderColor: CYBERPUNK_COLORS.cyan
          } : {}}>
            <p className={`leading-relaxed ${
              isCyberpunk ? '' : 'text-gray-800'
            }`}
            style={isCyberpunk ? {
              color: CYBERPUNK_COLORS.cyan,
              fontFamily: 'monospace'
            } : {}}>
              {scores.improved_transcript}
            </p>
          </div>
        </div>
      )}

      {/* Show Details Toggle */}
      <div className="mb-6">
        <button
          onClick={() => setShowDetailedFeedback(!showDetailedFeedback)}
          className={`text-sm ${
            isCyberpunk ? '' : 'text-blue-600 hover:text-blue-800'
          }`}
          style={isCyberpunk ? {
            color: CYBERPUNK_COLORS.cyan,
            fontFamily: 'monospace',
            ...themeStyles.textShadow
          } : {}}
        >
          {isCyberpunk 
            ? (showDetailedFeedback ? 'HIDE DETAILS' : 'SHOW DETAILS')
            : (showDetailedFeedback ? 'Hide Details' : 'Show Details')}
        </button>
      </div>

      {/* Detailed Feedback */}
      {showDetailedFeedback && (
        <div className={`mb-6 p-3 sm:p-4 rounded-lg border-2 ${
          isCyberpunk ? getCyberpunkCardBg(2).className : 'bg-blue-50'
        }`}
        style={isCyberpunk ? {
          ...getCyberpunkCardBg(2).style,
          ...themeStyles.glow
        } : {}}>
          <h4 className={`font-semibold mb-3 ${
            isCyberpunk ? '' : ''
          }`}
          style={isCyberpunk ? {
            ...themeStyles.textCyan,
            fontFamily: 'monospace'
          } : {}}>
            {isCyberpunk ? 'DETAILED ANALYSIS' : 'Detailed Analysis'}
          </h4>
          <div className="space-y-3 text-sm">
            <div>
              <span className={`font-medium ${
                isCyberpunk ? '' : ''
              }`}
              style={isCyberpunk ? {
                color: CYBERPUNK_COLORS.cyan,
                fontFamily: 'monospace'
              } : {}}>
                {isCyberpunk ? 'WORD COUNT ANALYSIS:' : 'Word Count Analysis:'}
              </span>
              <span className={`ml-2 ${
                isCyberpunk ? '' : 'text-gray-700'
              }`}
              style={isCyberpunk ? {
                color: CYBERPUNK_COLORS.cyan,
                fontFamily: 'monospace'
              } : {}}>
                {isCyberpunk 
                  ? `YOU SPOKE ${scores?.word_count || 0} WORDS. ${scores?.word_count >= 50 ? 'GREAT JOB MEETING THE MINIMUM REQUIREMENT!' : 'CONSIDER SPEAKING MORE TO MEET THE MINIMUM WORD REQUIREMENT.'}`
                  : `You spoke ${scores?.word_count || 0} words. ${scores?.word_count >= 50 ? 'Great job meeting the minimum requirement!' : 'Consider speaking more to meet the minimum word requirement.'}`}
              </span>
            </div>
            <div>
              <span className={`font-medium ${
                isCyberpunk ? '' : ''
              }`}
              style={isCyberpunk ? {
                color: CYBERPUNK_COLORS.cyan,
                fontFamily: 'monospace'
              } : {}}>
                {isCyberpunk ? 'GRAMMAR ANALYSIS:' : 'Grammar Analysis:'}
              </span>
              <span className={`ml-2 ${
                isCyberpunk ? '' : 'text-gray-700'
              }`}
              style={isCyberpunk ? {
                color: CYBERPUNK_COLORS.cyan,
                fontFamily: 'monospace'
              } : {}}>
                {scores?.grammar_mistakes === 0 
                  ? (isCyberpunk ? 'PERFECT GRAMMAR!' : 'Perfect grammar!')
                  : (isCyberpunk 
                      ? `FOUND ${scores?.grammar_mistakes || 0} GRAMMAR ${scores?.grammar_mistakes === 1 ? 'MISTAKE' : 'MISTAKES'}.`
                      : `Found ${scores?.grammar_mistakes || 0} grammar ${scores?.grammar_mistakes === 1 ? 'mistake' : 'mistakes'}.`)}
              </span>
              {scores?.grammar_corrections && scores.grammar_corrections.length > 0 && (
                <div className="mt-2 space-y-2">
                  {scores.grammar_corrections.map((correction, index) => (
                    <div key={index} className={`border rounded p-2 sm:p-3 ${
                      isCyberpunk ? getCyberpunkCardBg(1).className : 'bg-yellow-50 border-yellow-200'
                    }`}
                    style={isCyberpunk ? {
                      ...getCyberpunkCardBg(1).style
                    } : {}}>
                      <div className="flex items-start space-x-2">
                        <span className={`font-mono text-sm ${
                          isCyberpunk ? '' : 'text-red-600'
                        }`}
                        style={isCyberpunk ? {
                          color: CYBERPUNK_COLORS.red,
                          fontFamily: 'monospace'
                        } : {}}>✗</span>
                        <div className="flex-1">
                          <div className="text-sm">
                            <span className={`font-medium ${
                              isCyberpunk ? '' : 'text-red-600'
                            }`}
                            style={isCyberpunk ? {
                              color: CYBERPUNK_COLORS.red,
                              fontFamily: 'monospace'
                            } : {}}>
                              {correction.mistake}
                            </span>
                            <span className={`mx-2 ${
                              isCyberpunk ? '' : ''
                            }`}
                            style={isCyberpunk ? {
                              color: CYBERPUNK_COLORS.cyan,
                              fontFamily: 'monospace'
                            } : {}}>→</span>
                            <span className={`font-medium ${
                              isCyberpunk ? '' : 'text-green-600'
                            }`}
                            style={isCyberpunk ? {
                              color: CYBERPUNK_COLORS.cyan,
                              fontFamily: 'monospace'
                            } : {}}>
                              {correction.correction}
                            </span>
                          </div>
                          <div className={`text-xs mt-1 ${
                            isCyberpunk ? '' : 'text-blue-600'
                          }`}
                          style={isCyberpunk ? {
                            color: CYBERPUNK_COLORS.cyan,
                            fontFamily: 'monospace'
                          } : {}}>
                            <strong>{isCyberpunk ? 'EXPLANATION:' : 'Explanation:'}</strong> {correction.explanation}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <span className={`font-medium ${
                isCyberpunk ? '' : ''
              }`}
              style={isCyberpunk ? {
                color: CYBERPUNK_COLORS.cyan,
                fontFamily: 'monospace'
              } : {}}>
                {isCyberpunk ? 'VOCABULARY ANALYSIS:' : 'Vocabulary Analysis:'}
              </span>
              <span className={`ml-2 ${
                isCyberpunk ? '' : 'text-gray-700'
              }`}
              style={isCyberpunk ? {
                color: CYBERPUNK_COLORS.cyan,
                fontFamily: 'monospace'
              } : {}}>
                {scores?.vocabulary_mistakes === 0 
                  ? (isCyberpunk ? 'EXCELLENT VOCABULARY USAGE!' : 'Excellent vocabulary usage!')
                  : (isCyberpunk 
                      ? `FOUND ${scores?.vocabulary_mistakes || 0} VOCABULARY ${scores?.vocabulary_mistakes === 1 ? 'ISSUE' : 'ISSUES'}.`
                      : `Found ${scores?.vocabulary_mistakes || 0} vocabulary ${scores?.vocabulary_mistakes === 1 ? 'issue' : 'issues'}.`)}
              </span>
              {scores?.vocabulary_corrections && scores.vocabulary_corrections.length > 0 && (
                <div className="mt-2 space-y-2">
                  {scores.vocabulary_corrections.map((correction, index) => (
                    <div key={index} className={`border rounded p-2 sm:p-3 ${
                      isCyberpunk ? getCyberpunkCardBg(0).className : 'bg-purple-50 border-purple-200'
                    }`}
                    style={isCyberpunk ? {
                      ...getCyberpunkCardBg(0).style
                    } : {}}>
                      <div className="flex items-start space-x-2">
                        <span className={`font-mono text-sm ${
                          isCyberpunk ? '' : 'text-purple-600'
                        }`}
                        style={isCyberpunk ? {
                          color: CYBERPUNK_COLORS.cyan,
                          fontFamily: 'monospace'
                        } : {}}>📝</span>
                        <div className="flex-1">
                          <div className="text-sm">
                            <span className={`font-medium ${
                              isCyberpunk ? '' : 'text-purple-600'
                            }`}
                            style={isCyberpunk ? {
                              color: CYBERPUNK_COLORS.red,
                              fontFamily: 'monospace'
                            } : {}}>
                              {correction.mistake}
                            </span>
                            <span className={`mx-2 ${
                              isCyberpunk ? '' : ''
                            }`}
                            style={isCyberpunk ? {
                              color: CYBERPUNK_COLORS.cyan,
                              fontFamily: 'monospace'
                            } : {}}>→</span>
                            <span className={`font-medium ${
                              isCyberpunk ? '' : 'text-green-600'
                            }`}
                            style={isCyberpunk ? {
                              color: CYBERPUNK_COLORS.cyan,
                              fontFamily: 'monospace'
                            } : {}}>
                              {correction.correction}
                            </span>
                          </div>
                          <div className={`text-xs mt-1 ${
                            isCyberpunk ? '' : 'text-blue-600'
                          }`}
                          style={isCyberpunk ? {
                            color: CYBERPUNK_COLORS.cyan,
                            fontFamily: 'monospace'
                          } : {}}>
                            <strong>{isCyberpunk ? 'EXPLANATION:' : 'Explanation:'}</strong> {correction.explanation}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <span className={`font-medium ${
                isCyberpunk ? '' : ''
              }`}
              style={isCyberpunk ? {
                color: CYBERPUNK_COLORS.cyan,
                fontFamily: 'monospace'
              } : {}}>
                {isCyberpunk ? 'PRONUNCIATION ANALYSIS:' : 'Pronunciation Analysis:'}
              </span>
              <span className={`ml-2 ${
                isCyberpunk ? '' : 'text-gray-700'
              }`}
              style={isCyberpunk ? {
                color: CYBERPUNK_COLORS.cyan,
                fontFamily: 'monospace'
              } : {}}>
                {scores?.pronunciation_corrections && scores.pronunciation_corrections.length > 0 
                  ? (isCyberpunk 
                      ? `FOUND ${scores.pronunciation_corrections.length} PRONUNCIATION ${scores.pronunciation_corrections.length === 1 ? 'TIP' : 'TIPS'} TO HELP IMPROVE CLARITY.`
                      : `Found ${scores.pronunciation_corrections.length} pronunciation ${scores.pronunciation_corrections.length === 1 ? 'tip' : 'tips'} to help improve clarity.`)
                  : (isCyberpunk 
                      ? 'GREAT PRONUNCIATION! YOUR SPEECH WAS CLEAR AND EASY TO UNDERSTAND.'
                      : 'Great pronunciation! Your speech was clear and easy to understand.')}
              </span>
            </div>

            {/* Pronunciation Corrections */}
            {scores?.pronunciation_corrections && scores.pronunciation_corrections.length > 0 && (
              <div>
                <span className={`font-medium ${
                  isCyberpunk ? '' : ''
                }`}
                style={isCyberpunk ? {
                  color: CYBERPUNK_COLORS.cyan,
                  fontFamily: 'monospace'
                } : {}}>
                  {isCyberpunk ? 'PRONUNCIATION TIPS:' : 'Pronunciation Tips:'}
                </span>
                <div className="mt-2 space-y-2">
                  {scores.pronunciation_corrections.map((correction, index) => (
                    <div key={index} className={`border rounded p-2 sm:p-3 ${
                      isCyberpunk ? getCyberpunkCardBg(1).className : 'bg-orange-50 border-orange-200'
                    }`}
                    style={isCyberpunk ? {
                      ...getCyberpunkCardBg(1).style
                    } : {}}>
                      <div className="flex items-start space-x-2">
                        <span className={`font-mono text-sm ${
                          isCyberpunk ? '' : 'text-orange-600'
                        }`}
                        style={isCyberpunk ? {
                          color: CYBERPUNK_COLORS.yellow,
                          fontFamily: 'monospace'
                        } : {}}>🎯</span>
                        <div className="flex-1">
                          <div className="text-sm">
                            <span className={`font-medium ${
                              isCyberpunk ? '' : 'text-orange-700'
                            }`}
                            style={isCyberpunk ? {
                              color: CYBERPUNK_COLORS.red,
                              fontFamily: 'monospace'
                            } : {}}>
                              {correction.word}
                            </span>
                            <span className={`mx-2 ${
                              isCyberpunk ? '' : ''
                            }`}
                            style={isCyberpunk ? {
                              color: CYBERPUNK_COLORS.cyan,
                              fontFamily: 'monospace'
                            } : {}}>→</span>
                            <span className={`font-medium ${
                              isCyberpunk ? '' : 'text-green-700'
                            }`}
                            style={isCyberpunk ? {
                              color: CYBERPUNK_COLORS.cyan,
                              fontFamily: 'monospace'
                            } : {}}>
                              {correction.correction}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Language Use Suggestions */}
            {scores?.language_use_corrections && scores.language_use_corrections.length > 0 && (
              <div>
                <span className={`font-medium ${
                  isCyberpunk ? '' : ''
                }`}
                style={isCyberpunk ? {
                  color: CYBERPUNK_COLORS.cyan,
                  fontFamily: 'monospace'
                } : {}}>
                  {isCyberpunk ? 'LANGUAGE USE SUGGESTIONS:' : 'Language Use Suggestions:'}
                </span>
                <div className="mt-2 space-y-2">
                  {scores.language_use_corrections.map((item, index) => (
                    <div key={index} className={`border rounded p-2 sm:p-3 ${
                      isCyberpunk ? getCyberpunkCardBg(2).className : 'bg-blue-50 border-blue-200'
                    }`}
                    style={isCyberpunk ? {
                      ...getCyberpunkCardBg(2).style
                    } : {}}>
                      <div className="flex items-start space-x-2">
                        <span className={`font-mono text-sm ${
                          isCyberpunk ? '' : 'text-blue-600'
                        }`}
                        style={isCyberpunk ? {
                          color: CYBERPUNK_COLORS.cyan,
                          fontFamily: 'monospace'
                        } : {}}>💡</span>
                        <div className="flex-1">
                          <div className="text-sm">
                            <span className={`font-medium ${
                              isCyberpunk ? '' : 'text-blue-700'
                            }`}
                            style={isCyberpunk ? {
                              color: CYBERPUNK_COLORS.red,
                              fontFamily: 'monospace'
                            } : {}}>
                              {item.mistake}
                            </span>
                            <span className={`mx-2 ${
                              isCyberpunk ? '' : ''
                            }`}
                            style={isCyberpunk ? {
                              color: CYBERPUNK_COLORS.cyan,
                              fontFamily: 'monospace'
                            } : {}}>→</span>
                            <span className={`font-medium ${
                              isCyberpunk ? '' : 'text-green-700'
                            }`}
                            style={isCyberpunk ? {
                              color: CYBERPUNK_COLORS.cyan,
                              fontFamily: 'monospace'
                            } : {}}>
                              {item.suggestion}
                            </span>
                          </div>
                          {item.explanation && (
                            <div className={`text-xs mt-1 ${
                              isCyberpunk ? '' : 'text-blue-700'
                            }`}
                            style={isCyberpunk ? {
                              color: CYBERPUNK_COLORS.cyan,
                              fontFamily: 'monospace'
                            } : {}}>
                              <strong>{isCyberpunk ? 'WHY:' : 'Why:'}</strong> {item.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attempt Info */}
      <div className={`text-sm mb-3 ${
        isCyberpunk ? '' : 'text-gray-600'
      }`}
      style={isCyberpunk ? {
        color: CYBERPUNK_COLORS.cyan,
        fontFamily: 'monospace'
      } : {}}>
        {isCyberpunk 
          ? `ATTEMPT ${attemptNumber} OF ${maxAttempts}`
          : `Attempt ${attemptNumber} of ${maxAttempts}`}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
        {canReRecord && (
          <button
            onClick={onReRecord}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 min-h-[40px] text-base font-medium border-2 ${
              isCyberpunk ? 'border' : 'bg-yellow-600 text-white hover:bg-yellow-700'
            }`}
            style={isCyberpunk ? {
              backgroundColor: CYBERPUNK_COLORS.black,
              borderColor: CYBERPUNK_COLORS.yellow,
              color: CYBERPUNK_COLORS.yellow,
              fontFamily: 'monospace',
              ...themeStyles.glowYellow
            } : {}}
          >
            <span>🔄</span>
            <span>{isCyberpunk ? 'RE-RECORD' : 'Re-record'}</span>
          </button>
        )}
        <button
          onClick={onFinalSubmit}
          disabled={isSubmitting}
          className={`w-full sm:w-auto px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 min-h-[40px] text-base font-medium border-2 ${
            isCyberpunk 
              ? 'border'
              : isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
          style={isCyberpunk ? {
            backgroundColor: CYBERPUNK_COLORS.black,
            borderColor: !isSubmitting ? CYBERPUNK_COLORS.cyan : CYBERPUNK_COLORS.cyan,
            color: !isSubmitting ? CYBERPUNK_COLORS.cyan : CYBERPUNK_COLORS.cyan,
            fontFamily: 'monospace',
            ...(!isSubmitting ? themeStyles.glow : {})
          } : {}}
        >
          {isSubmitting ? (
            <>
              <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${
                isCyberpunk ? '' : 'border-white'
              }`}
              style={isCyberpunk ? {
                borderColor: CYBERPUNK_COLORS.cyan
              } : {}}></div>
              <span>{isCyberpunk ? 'SUBMITTING...' : 'Submitting...'}</span>
            </>
          ) : (
            <>
              <span>✅</span>
              <span>{isCyberpunk ? 'SUBMIT FINAL' : 'Submit Final'}</span>
            </>
          )}
        </button>
      </div>

      {/* Re-record Notice */}
      {!canReRecord && (
        <div className={`mt-4 p-2 sm:p-3 rounded-lg border-2 ${
          isCyberpunk ? getCyberpunkCardBg(1).className : 'bg-yellow-50 border-yellow-200'
        }`}
        style={isCyberpunk ? {
          ...getCyberpunkCardBg(1).style
        } : {}}>
          <p className={`text-sm ${
            isCyberpunk ? '' : 'text-yellow-800'
          }`}
          style={isCyberpunk ? {
            color: CYBERPUNK_COLORS.yellow,
            fontFamily: 'monospace',
            ...themeStyles.textShadowYellow
          } : {}}>
            <strong>{isCyberpunk ? 'MAXIMUM ATTEMPTS REACHED.' : 'Maximum attempts reached.'}</strong> {isCyberpunk 
              ? 'THIS IS YOUR FINAL ATTEMPT. CLICK "SUBMIT FINAL" TO COMPLETE THE TEST.'
              : 'This is your final attempt. Click "Submit Final" to complete the test.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default FeedbackDisplay;

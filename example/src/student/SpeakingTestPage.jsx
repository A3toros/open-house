import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import { useTheme } from '../hooks/useTheme';
import { getThemeStyles } from '../utils/themeUtils';
import { useAntiCheating } from '../hooks/useAntiCheating';
import { useNotification } from '../components/ui/Notification';
import SpeakingTestStudent from '../components/test/SpeakingTestStudent';
import TestResults from '../components/test/TestResults';
import Button from '../components/ui/Button';
import PerfectModal from '../components/ui/PerfectModal';
import { logger } from '../utils/logger';

// Seeded random number generator (mulberry32)
const mulberry32 = (a) => {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
};

// Function to select a random question deterministically
const selectRandomQuestion = (questions, testId, studentId) => {
  // If only one question, return it
  if (questions.length === 1) {
    return questions[0];
  }
  
  // Create deterministic seed from student ID and test ID
  const seedStr = `${studentId}:speaking:${testId}`;
  const seed = Array.from(seedStr).reduce((acc, c) => 
    ((acc << 5) - acc) + c.charCodeAt(0), 0) >>> 0;
  
  // Use seeded RNG for consistent selection
  const rng = mulberry32(seed);
  const randomIndex = Math.floor(rng() * questions.length);
  
  return questions[randomIndex];
};

const SpeakingTestPage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const api = useApi();
  const { showNotification } = useNotification();
  
  const [testData, setTestData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showExitModal, setShowExitModal] = useState(false);

  // Anti-cheating tracking
  const { startTracking, stopTracking, getCheatingData, clearData, isCheating, tabSwitches } = useAntiCheating(
    'speaking', 
    testId,
    user?.student_id || user?.id
  );

  useEffect(() => {
    loadTestData();
    checkCompletionStatus();
  }, [testId]);

  // Initialize anti-cheating tracking when test data is loaded
  useEffect(() => {
    if (testData && !isCompleted) {
      logger.debug('🛡️ Speaking test - initializing anti-cheating tracking');
      
      // Check for existing anti-cheating data for this test
      const studentId = user?.student_id || user?.id || 'unknown';
      const antiCheatingKey = `anti_cheating_${studentId}_speaking_${testId}`;
      const existingAntiCheatingData = localStorage.getItem(antiCheatingKey);
      
      logger.debug('🛡️ Checking for anti-cheating data with key:', antiCheatingKey);
      logger.debug('🛡️ Key format: anti_cheating_{studentId}_{testType}_{testId}');
      logger.debug('🛡️ Current test details:', { testType: 'speaking', testId, studentId });
      
      if (existingAntiCheatingData) {
        try {
          const parsedData = JSON.parse(existingAntiCheatingData);
          logger.debug('🛡️ Found existing anti-cheating data for THIS speaking test:', parsedData);
          logger.debug('🛡️ Visibility change times for this test:', parsedData.tabSwitches || 0);
          logger.debug('🛡️ Cheating status for this test:', parsedData.isCheating || false);
          
          // Show warning if student has been caught cheating in THIS test
          if (parsedData.isCheating) {
            logger.debug('⚠️ WARNING: Student has been flagged for cheating in THIS speaking test!');
            logger.debug('⚠️ Tab switches detected in this test:', parsedData.tabSwitches);
            
            // Show notification to user
            showNotification(
              `⚠️ Warning: Suspicious activity detected in this speaking test (${parsedData.tabSwitches} tab switches). Continued violations may result in test disqualification.`, 
              'warning'
            );
          }
        } catch (error) {
          logger.error('🛡️ Error parsing existing anti-cheating data:', error);
        }
      } else {
        logger.debug('🛡️ No existing anti-cheating data found for this speaking test - starting fresh');
      }
      
      // Start anti-cheating tracking
      startTracking();
      logger.debug('🛡️ Anti-cheating tracking started for speaking test');
    }
    
    // Cleanup on unmount
    return () => {
      if (testData) {
        logger.debug('🛡️ Cleaning up anti-cheating tracking for speaking test');
        stopTracking();
      }
    };
  }, [testData, isCompleted, testId, user?.student_id, user?.id, startTracking, stopTracking, showNotification]);

  const loadTestData = async () => {
    try {
      setIsLoading(true);
      
      // Load test data
      const testResponse = await api.getSpeakingTest(testId);
      if (testResponse.success) {
        setTestData(testResponse.test);
      } else {
        throw new Error(testResponse.message || 'Failed to load test');
      }

      // Load questions
      const questionsResponse = await api.getSpeakingTestQuestions(testId);
      if (questionsResponse.success) {
        const allQuestions = questionsResponse.questions;
        setQuestions(allQuestions);
        
        // Select random question for this student
        const studentId = user?.student_id || user?.id;
        const randomQuestion = selectRandomQuestion(allQuestions, testId, studentId);
        setSelectedQuestion(randomQuestion);
        
        logger.debug('🎯 Selected question for student:', {
          studentId,
          testId,
          totalQuestions: allQuestions.length,
          selectedQuestion: randomQuestion?.id,
          selectedPrompt: randomQuestion?.prompt?.substring(0, 50) + '...'
        });
      }

    } catch (error) {
      logger.error('Error loading test data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const checkCompletionStatus = () => {
    // Check if test is already completed using localStorage (following other tests pattern)
    const studentId = user?.student_id || user?.id;
    const completionKey = `test_completed_${studentId}_speaking_${testId}`;
    const completed = localStorage.getItem(completionKey) === 'true';
    
    if (completed) {
      setIsCompleted(true);
      // Try to get cached result
      const cachedResult = localStorage.getItem(`speaking_test_result_${testId}`);
      if (cachedResult) {
        setTestResult(JSON.parse(cachedResult));
      }
    }
  };

  const handleTestComplete = async (result) => {
    try {
      setIsCompleted(true);
      setTestResult(result);
      
      // Store result for caching
      localStorage.setItem(`speaking_test_result_${testId}`, JSON.stringify(result));
      
      // Force refresh of student cabinet
      window.dispatchEvent(new CustomEvent('testCompleted', { 
        detail: { testId, testType: 'speaking' } 
      }));
      
      // Navigate back to student cabinet after a delay (like other tests)
      setTimeout(() => {
        navigate('/student');
      }, 2000);
      
    } catch (error) {
      logger.error('Error handling test completion:', error);
    }
  };

  const handleExit = () => {
    logger.debug('🎓 Navigating back to cabinet from speaking test...');
    
    // OPTIMIZATION: Count cabinet navigation as a cheating attempt
    if (testData && user?.student_id) {
      logger.debug('🛡️ Cabinet navigation detected - counting as cheating attempt');
      
      // Manually increment the tab switch count
      const studentId = user?.student_id || user?.id || 'unknown';
      const antiCheatingKey = `anti_cheating_${studentId}_speaking_${testId}`;
      
      // Get current data
      const existingData = localStorage.getItem(antiCheatingKey);
      let currentTabSwitches = 0;
      let currentIsCheating = false;
      
      if (existingData) {
        try {
          const parsed = JSON.parse(existingData);
          currentTabSwitches = parsed.tabSwitches || 0;
          currentIsCheating = parsed.isCheating || false;
        } catch (error) {
          logger.error('🛡️ Error parsing existing anti-cheating data:', error);
        }
      }
      
      // Increment tab switch count
      const newTabSwitches = currentTabSwitches + 1;
      const newIsCheating = newTabSwitches >= 2; // 2+ switches = cheating
      
      logger.debug(`🛡️ Tab switch count: ${currentTabSwitches} → ${newTabSwitches} (cheating: ${newIsCheating})`);
      
      // Save updated data
      const updatedData = {
        tabSwitches: newTabSwitches,
        isCheating: newIsCheating,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(antiCheatingKey, JSON.stringify(updatedData));
      logger.debug('🛡️ Anti-cheating data updated for cabinet navigation:', updatedData);
    }
    
    navigate('/student');
  };

  const { theme, isCyberpunk, themeClasses } = useTheme();
  const themeStyles = getThemeStyles(theme);

  if (isLoading) {
    return (
      <div 
        className={`min-h-screen overflow-y-auto ${isCyberpunk ? 'bg-gradient-to-br from-black via-gray-900 to-purple-900' : 'bg-white'}`}
        style={isCyberpunk ? themeStyles.background : {}}
      >
        {/* Speaking Test Header */}
        <div className={`${themeClasses.headerBg} shadow-sm border-b ${themeClasses.headerBorder}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className={`text-2xl font-bold ${themeClasses.headerText}`}>Speaking Test</h1>
              </div>
              
              <Button
                variant="outline"
                onClick={() => setShowExitModal(true)}
              >
                Back to Cabinet
              </Button>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className={`inline-block animate-spin rounded-full h-8 w-8 border-b-2 ${isCyberpunk ? 'border-cyan-400' : 'border-blue-600'}`}></div>
              <p className={`${themeClasses.textSecondary} mt-4`}>Loading speaking test...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className={`min-h-screen overflow-y-auto ${isCyberpunk ? 'bg-gradient-to-br from-black via-gray-900 to-purple-900' : 'bg-white'}`}
        style={isCyberpunk ? themeStyles.background : {}}
      >
        {/* Speaking Test Header */}
        <div className={`${themeClasses.headerBg} shadow-sm border-b ${themeClasses.headerBorder}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className={`text-2xl font-bold ${themeClasses.headerText}`}>Speaking Test</h1>
              </div>
              
              <Button
                variant="outline"
                onClick={() => setShowExitModal(true)}
              >
                Back to Cabinet
              </Button>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className={`text-6xl mb-4 ${isCyberpunk ? 'text-red-400' : 'text-red-600'}`}>⚠️</div>
              <h2 className={`text-2xl font-bold ${themeClasses.text} mb-2`}>Error Loading Test</h2>
              <p className={`${themeClasses.textSecondary} mb-6`}>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isCompleted && testResult) {
    return (
      <div 
        className={`min-h-screen overflow-y-auto ${isCyberpunk ? 'bg-gradient-to-br from-black via-gray-900 to-purple-900' : 'bg-white'}`}
        style={isCyberpunk ? themeStyles.background : {}}
      >
        {/* Speaking Test Header */}
        <div className={`${themeClasses.headerBg} shadow-sm border-b ${themeClasses.headerBorder}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className={`text-2xl font-bold ${themeClasses.headerText}`}>Speaking Test Results</h1>
              </div>
              
              <Button
                variant="outline"
                onClick={() => setShowExitModal(true)}
              >
                Back to Cabinet
              </Button>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <TestResults
            testType="speaking"
            testData={testData}
            result={testResult}
            onRetake={() => {
              setIsCompleted(false);
              setTestResult(null);
              const studentId = JSON.parse(localStorage.getItem('userData') || '{}').student_id;
              localStorage.removeItem(`test_completed_${studentId}_speaking_${testId}`);
            }}
          />
        </div>
      </div>
    );
  }

  if (!testData || questions.length === 0) {
    return (
      <div 
        className={`min-h-screen overflow-y-auto ${isCyberpunk ? 'bg-gradient-to-br from-black via-gray-900 to-purple-900' : 'bg-white'}`}
        style={isCyberpunk ? themeStyles.background : {}}
      >
        {/* Speaking Test Header */}
        <div className={`${themeClasses.headerBg} shadow-sm border-b ${themeClasses.headerBorder}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className={`text-2xl font-bold ${themeClasses.headerText}`}>Speaking Test</h1>
              </div>
              
              <Button
                variant="outline"
                onClick={() => setShowExitModal(true)}
              >
                Back to Cabinet
              </Button>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className={`text-6xl mb-4 ${themeClasses.textSecondary}`}>📝</div>
              <h2 className={`text-2xl font-bold ${themeClasses.text} mb-2`}>No Test Data</h2>
              <p className={`${themeClasses.textSecondary} mb-6`}>Unable to load test information</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Use the selected question (randomly chosen for this student)
  const currentQuestion = selectedQuestion;

  return (
    <div className={`min-h-screen overflow-y-auto ${isCyberpunk ? 'bg-gradient-to-br from-black via-gray-900 to-purple-900' : 'bg-gray-50'}`}
      style={isCyberpunk ? themeStyles.background : {}}>
      {/* Exit Confirmation Modal */}
      <PerfectModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        title="Exit Speaking Test"
        size="small"
      >
        <div className="text-center">
          <p className="text-gray-600 mb-6">Are you sure you want to go back to cabinet?</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setShowExitModal(false)} variant="secondary">Cancel</Button>
            <Button onClick={() => { setShowExitModal(false); handleExit(); }} variant="primary">Go Back</Button>
          </div>
        </div>
      </PerfectModal>
      {/* Speaking Test Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Speaking Test</h1>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowExitModal(true)}
            >
              Back to Cabinet
            </Button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Question Selection Info for Multiple Questions */}
        {questions.length > 1 && selectedQuestion && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">i</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Question Selection
                </h3>
                <div className="mt-1 text-sm text-blue-700">
                  <p>
                    This test has {questions.length} questions. You have been assigned <strong>Question {selectedQuestion.question_number}</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <SpeakingTestStudent
          testData={{
            ...testData,
            test_id: parseInt(testId), // Add the test_id from URL params
            question_id: currentQuestion?.id,
            prompt: currentQuestion?.prompt,
            start_time: Date.now()
          }}
          onComplete={handleTestComplete}
          onExit={handleExit}
          onTestComplete={handleTestComplete}
        />
      </div>
    </div>
  );
};

export default SpeakingTestPage;

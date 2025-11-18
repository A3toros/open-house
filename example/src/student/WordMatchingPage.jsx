import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import WordMatchingStudent from '../components/test/WordMatchingStudent';
import TestResults from '../components/test/TestResults';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useNotification } from '../components/ui/Notification';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import { useTheme } from '../hooks/useTheme';
import { getThemeStyles } from '../utils/themeUtils';
import { getCachedData, setCachedData, CACHE_TTL } from '../utils/cacheUtils';
import { logger } from '../utils/logger';

const WordMatchingPage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { makeAuthenticatedRequest } = useApi();
  const { showNotification } = useNotification();
  const { theme, isCyberpunk, themeClasses } = useTheme();
  const themeStyles = getThemeStyles(theme);

  // State management
  const [testData, setTestData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  // Check if test is already completed
  const checkTestCompleted = useCallback(() => {
    if (!user?.student_id || !testId) return false;
    const completionKey = `test_completed_${user.student_id}_word_matching_${testId}`;
    const retestKey = `retest1_${user.student_id}_word_matching_${testId}`;
    const hasRetest = localStorage.getItem(retestKey) === 'true';
    if (hasRetest) return false; // allow entry during retest
    return localStorage.getItem(completionKey) === 'true';
  }, [user?.student_id, testId]);

  // Load test data
  const loadTestData = useCallback(async () => {
    if (!testId) {
      setError('Test ID is required');
      setIsLoading(false);
      return;
    }

    // Check if test is already completed
    if (checkTestCompleted()) {
      showNotification('This test has already been completed', 'warning');
      navigate('/student');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      const cacheKey = `word_matching_test_${testId}`;
      const cachedData = getCachedData(cacheKey);
      
      if (cachedData) {
        logger.debug('🎯 Word matching test loaded from cache:', cachedData);
        // Check if cached data has the processed format (with id field)
        if (cachedData.id) {
          let dataToUse = cachedData;
          // Normalize correctPairs to array
          let baseCorrectPairs = Array.isArray(dataToUse.correctPairs)
            ? dataToUse.correctPairs
            : dataToUse.correctPairs && typeof dataToUse.correctPairs === 'object'
              ? Object.keys(dataToUse.correctPairs)
                  .map(k => [Number(k), dataToUse.correctPairs[k]])
                  .sort((a, b) => a[0] - b[0])
                  .map(([, v]) => v)
              : null;

          if (Array.isArray(dataToUse.leftWords) && Array.isArray(dataToUse.rightWords) && Array.isArray(baseCorrectPairs)) {
            // Build index arrays
            const rightIndices = dataToUse.rightWords.map((_, idx) => idx);
            const leftIndices = dataToUse.leftWords.map((_, idx) => idx);
            // Shuffle both sides
            for (let i = rightIndices.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [rightIndices[i], rightIndices[j]] = [rightIndices[j], rightIndices[i]];
            }
            for (let i = leftIndices.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [leftIndices[i], leftIndices[j]] = [leftIndices[j], leftIndices[i]];
            }
            const shuffledRight = rightIndices.map(i => dataToUse.rightWords[i]);
            const shuffledLeft = leftIndices.map(i => dataToUse.leftWords[i]);
            const rightNewIndexOf = new Map(rightIndices.map((oldIdx, newIdx) => [oldIdx, newIdx]));
            // Remap pairs: for each new left index, map to new right index
            const remappedPairs = leftIndices.map(oldLeftIdx => {
              const oldRightIdx = baseCorrectPairs[oldLeftIdx];
              return rightNewIndexOf.get(oldRightIdx);
            });
            dataToUse = {
              ...dataToUse,
              leftWords: shuffledLeft,
              rightWords: shuffledRight,
              correctPairs: remappedPairs
            };
          }
          setTestData(dataToUse);
        } else {
          // Process cached data to match new format
          const processedCachedData = {
            id: cachedData.test_id,
            test_id: cachedData.test_id,
            test_name: cachedData.test_name,
            teacher_id: cachedData.teacher_id,
            subject_id: cachedData.subject_id,
            num_questions: cachedData.num_questions,
            interaction_type: cachedData.interaction_type,
            passing_score: cachedData.passing_score,
            allowed_time: cachedData.allowed_time,
            created_at: cachedData.created_at,
            updated_at: cachedData.updated_at,
            leftWords: cachedData.leftWords,
            rightWords: cachedData.rightWords,
            correctPairs: cachedData.correctPairs,
            originalPairs: cachedData.originalPairs
          };
          let dataToUse = processedCachedData;
          // Normalize correctPairs to array
          let baseCorrectPairs = Array.isArray(dataToUse.correctPairs)
            ? dataToUse.correctPairs
            : dataToUse.correctPairs && typeof dataToUse.correctPairs === 'object'
              ? Object.keys(dataToUse.correctPairs)
                  .map(k => [Number(k), dataToUse.correctPairs[k]])
                  .sort((a, b) => a[0] - b[0])
                  .map(([, v]) => v)
              : null;
          if (Array.isArray(dataToUse.leftWords) && Array.isArray(dataToUse.rightWords) && Array.isArray(baseCorrectPairs)) {
            const rightIndices = dataToUse.rightWords.map((_, idx) => idx);
            const leftIndices = dataToUse.leftWords.map((_, idx) => idx);
            for (let i = rightIndices.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [rightIndices[i], rightIndices[j]] = [rightIndices[j], rightIndices[i]];
            }
            for (let i = leftIndices.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [leftIndices[i], leftIndices[j]] = [leftIndices[j], leftIndices[i]];
            }
            const shuffledRight = rightIndices.map(i => dataToUse.rightWords[i]);
            const shuffledLeft = leftIndices.map(i => dataToUse.leftWords[i]);
            const rightNewIndexOf = new Map(rightIndices.map((oldIdx, newIdx) => [oldIdx, newIdx]));
            const remappedPairs = leftIndices.map(oldLeftIdx => {
              const oldRightIdx = baseCorrectPairs[oldLeftIdx];
              return rightNewIndexOf.get(oldRightIdx);
            });
            dataToUse = { ...dataToUse, leftWords: shuffledLeft, rightWords: shuffledRight, correctPairs: remappedPairs };
          }
          setTestData(dataToUse);
        }
        setIsLoading(false);
        return;
      }

      // Fetch from API if not in cache
      const response = await makeAuthenticatedRequest(`/.netlify/functions/get-word-matching-test?test_id=${testId}`);
      const result = await response.json();

      if (result.success) {
        // Process test data to match other test patterns (like MatchingTestPage)
        const processedTestData = {
          id: result.data.test_id,
          test_id: result.data.test_id,
          test_name: result.data.test_name,
          teacher_id: result.data.teacher_id,
          subject_id: result.data.subject_id,
          num_questions: result.data.num_questions,
          interaction_type: result.data.interaction_type,
          passing_score: result.data.passing_score,
          allowed_time: result.data.allowed_time,
          created_at: result.data.created_at,
          updated_at: result.data.updated_at,
          leftWords: result.data.leftWords,
          rightWords: result.data.rightWords,
          correctPairs: result.data.correctPairs,
          originalPairs: result.data.originalPairs
        };
        
        let dataToUse = processedTestData;
        // Normalize correctPairs to array (API may send object)
        let baseCorrectPairs = Array.isArray(dataToUse.correctPairs)
          ? dataToUse.correctPairs
          : dataToUse.correctPairs && typeof dataToUse.correctPairs === 'object'
            ? Object.keys(dataToUse.correctPairs)
                .map(k => [Number(k), dataToUse.correctPairs[k]])
                .sort((a, b) => a[0] - b[0])
                .map(([, v]) => v)
            : null;
        if (Array.isArray(dataToUse.leftWords) && Array.isArray(dataToUse.rightWords) && Array.isArray(baseCorrectPairs)) {
          // Shuffle both columns
          const rightIndices = dataToUse.rightWords.map((_, idx) => idx);
          const leftIndices = dataToUse.leftWords.map((_, idx) => idx);
          for (let i = rightIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [rightIndices[i], rightIndices[j]] = [rightIndices[j], rightIndices[i]];
          }
          for (let i = leftIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [leftIndices[i], leftIndices[j]] = [leftIndices[j], leftIndices[i]];
          }
          const shuffledRight = rightIndices.map(i => dataToUse.rightWords[i]);
          const shuffledLeft = leftIndices.map(i => dataToUse.leftWords[i]);
          const rightNewIndexOf = new Map(rightIndices.map((oldIdx, newIdx) => [oldIdx, newIdx]));
          const remappedPairs = leftIndices.map(oldLeftIdx => {
            const oldRightIdx = baseCorrectPairs[oldLeftIdx];
            return rightNewIndexOf.get(oldRightIdx);
          });
          dataToUse = { 
            ...dataToUse, 
            leftWords: shuffledLeft, 
            rightWords: shuffledRight, 
            correctPairs: remappedPairs 
          };
        }
        setTestData(dataToUse);
        // Cache the processed (shuffled) test data
        setCachedData(cacheKey, dataToUse, CACHE_TTL.word_matching_test);
        logger.debug('🎯 Word matching test loaded from API and cached:', processedTestData);
      } else {
        throw new Error(result.message || 'Failed to load test');
      }
    } catch (error) {
      logger.error('Error loading word matching test:', error);
      setError(error.message);
      showNotification('Failed to load test: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [testId, checkTestCompleted, makeAuthenticatedRequest, showNotification, navigate]);

  // Handle test completion
  const handleTestComplete = useCallback(async (result) => {
    logger.debug('Test completed:', result);
    showNotification('Test completed successfully!', 'success');
    
    // Use the result data from the component directly (like regular tests)
    // Result can be either a number (score) or an object with score and cheating data
    const score = typeof result === 'object' ? (parseInt(result.score) || 0) : (parseInt(result) || 0);
    const caughtCheating = typeof result === 'object' ? (result.caught_cheating || false) : false;
    const visibilityChangeTimes = typeof result === 'object' ? (result.visibility_change_times || 0) : 0;
    const maxScore = testData?.num_questions || 0;
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    
    const testResultsData = {
      showResults: true,
      testInfo: {
        test_name: testData?.test_name || 'Test',
        id: testData?.id,
        test_id: testData?.id
      },
      testType: 'word_matching',
      score: score,
      totalQuestions: maxScore,
      percentage: percentage,
      passed: percentage >= 60,
      questionAnalysis: Array.isArray(testData?.correctPairs) ? testData.correctPairs.map((pair, index) => ({
        questionNumber: index + 1,
        isCorrect: index < score,
        userAnswer: index < score ? `${pair.left} → ${pair.right}` : 'Not answered',
        correctAnswer: `${pair.left} → ${pair.right}`
      })) : Array.from({ length: maxScore }, (_, index) => ({
        questionNumber: index + 1,
        isCorrect: index < score,
        userAnswer: index < score ? 'Matched' : 'Not answered',
        correctAnswer: 'Match required'
      })),
      timestamp: new Date().toISOString(),
      caught_cheating: caughtCheating,
      visibility_change_times: visibilityChangeTimes
    };
    
    logger.debug('🎯 Using test results data:', testResultsData);
    setTestResults(testResultsData);
    setShowResults(true);
  }, [testData, showNotification]);

  // Handle back to cabinet
  const handleBackToCabinet = useCallback(() => {
    navigate('/student');
  }, [navigate]);

  // Load test data on mount
  useEffect(() => {
    loadTestData();
  }, [loadTestData]);

  // Show loading state
  if (isLoading) {
    return (
      <div 
        className="flex justify-center items-center min-h-screen bg-gradient-to-br from-black via-gray-900 to-purple-900"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255, 215, 0, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(0, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 40% 20%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)'
        }}
      >
        <Card className="p-8 text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading word matching test...</p>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div 
        className="flex justify-center items-center min-h-screen bg-gradient-to-br from-black via-gray-900 to-purple-900"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255, 215, 0, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(0, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 40% 20%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)'
        }}
      >
        <Card className="p-8 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-xl font-semibold mb-2">Error Loading Test</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/student')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Back to Cabinet
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // Show test not found
  if (!testData) {
    return (
      <div 
        className="flex justify-center items-center min-h-screen bg-gradient-to-br from-black via-gray-900 to-purple-900"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255, 215, 0, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(0, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 40% 20%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)'
        }}
      >
        <Card className="p-8 text-center">
          <div className="text-gray-600 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-xl font-semibold mb-2">Test Not Found</h2>
            <p className="text-gray-600 mb-4">The requested test could not be found.</p>
            <button
              onClick={() => navigate('/student')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Back to Cabinet
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // Show test results if available
  if (showResults && testResults) {
    return (
      <div 
        className="bg-gradient-to-br from-black via-gray-900 to-purple-900 overflow-y-auto min-h-screen"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255, 215, 0, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(0, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 40% 20%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)'
        }}
      >
        <TestResults
          testResults={testResults}
          onBackToCabinet={() => {
            setTestResults(null);
            setShowResults(false);
            navigate('/student');
          }}
          onRetakeTest={(testType, testId) => {
            // Do not clear completion keys; rely on backend retest availability
            setTestResults(null);
            setShowResults(false);
            loadTestData();
          }}
          isLoading={false}
          caught_cheating={testResults.caught_cheating || false}
          visibility_change_times={testResults.visibility_change_times || 0}
        />
      </div>
    );
  }

  // Show the word matching test
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`min-h-screen py-8 ${isCyberpunk ? 'bg-gradient-to-br from-black via-gray-900 to-purple-900' : 'bg-white'}`}
      style={isCyberpunk ? themeStyles.background : {}}
    >
      <WordMatchingStudent 
        testData={testData} 
        onTestComplete={handleTestComplete}
        onBackToCabinet={handleBackToCabinet}
      />
    </motion.div>
  );
};

export default WordMatchingPage;

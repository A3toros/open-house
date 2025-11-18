import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { getThemeStyles, CYBERPUNK_COLORS } from '../../utils/themeUtils';
import AudioRecorder from './AudioRecorder';
import FeedbackDisplay from './FeedbackDisplay';
import TestResults from './TestResults';
import Button from '../ui/Button';
import PerfectModal from '../ui/PerfectModal';
import useInterceptBackNavigation from '../../hooks/useInterceptBackNavigation';
import { getCachedData, setCachedData, CACHE_TTL } from '../../utils/cacheUtils';

const SpeakingTestStudent = ({ testData, onComplete, onExit, onTestComplete }) => {
  const [currentStep, setCurrentStep] = useState('recording'); // permission, recording, processing, feedback, completed
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [scores, setScores] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [error, setError] = useState(null);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [maxAttempts] = useState(testData.max_attempts || 3);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false); // NEW: Flag to prevent duplicate API calls
  const [isBackInterceptEnabled, setBackInterceptEnabled] = useState(true);
  const [audioMimeType, setAudioMimeType] = useState('audio/webm');
  const pendingNavigationRef = useRef(null);
  
  // Theme hook - must be at component level
  const { theme, isCyberpunk, themeClasses } = useTheme();
  const themeStyles = getThemeStyles(theme);
  
  // iOS detection function
  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  };
  
  // Progress tracking (like other tests)
  const [testProgress, setTestProgress] = useState(0);
  const [testStartTime, setTestStartTime] = useState(null);
  
  const api = useApi();
  const { user } = useAuth();
  const { makeAuthenticatedRequest } = api;
  const recordingRef = useRef(null);

  useInterceptBackNavigation(
    isBackInterceptEnabled,
    useCallback(({ confirm, cancel }) => {
      console.log('🎯 SpeakingTestStudent: Browser back button intercepted during test!');
      console.log('🎯 SpeakingTestStudent: isBackInterceptEnabled:', isBackInterceptEnabled);
      console.log('🎯 SpeakingTestStudent: Setting pending navigation and showing modal');
      pendingNavigationRef.current = { confirm, cancel };
      setShowExitModal(true);
    }, [isBackInterceptEnabled])
  );

  useEffect(() => {
    if (currentStep !== 'completed') {
      setBackInterceptEnabled(true);
    } else {
      setBackInterceptEnabled(false);
      pendingNavigationRef.current = null;
    }
  }, [currentStep]);
  
  // Load attempts from localStorage on component mount
  useEffect(() => {
    if (testData?.test_id && user?.student_id) {
      const attemptsKey = `speaking_attempts_${user.student_id}_${testData.test_id}`;
      const savedAttempts = localStorage.getItem(attemptsKey);
      if (savedAttempts) {
        const attempts = parseInt(savedAttempts, 10);
        if (attempts > 0 && attempts <= maxAttempts) {
          setAttemptNumber(attempts);
          console.log('🔄 Loaded attempts from localStorage:', attempts);
        }
      }
    }
  }, [testData, user, maxAttempts]);

  // Start test timer when component mounts (like other tests)
  useEffect(() => {
    if (testData && !testStartTime) {
      const startTime = new Date();
      setTestStartTime(startTime);
      console.log('⏱️ Speaking test timer started at:', startTime.toISOString());
    }
  }, [testData, testStartTime]);
  
  // Calculate progress (like other tests)
  useEffect(() => {
    let progress = 0;
    if (currentStep === 'recording') progress = 25;
    else if (currentStep === 'processing') progress = 50;
    else if (currentStep === 'feedback') progress = 75;
    else if (currentStep === 'completed') progress = 100;
    
    setTestProgress(progress);
  }, [currentStep]);


  // Check microphone permission status without automatically requesting it
  useEffect(() => {
    const checkPermissionStatus = async () => {
      try {
        // Check if we're in a secure context (required for iOS)
        if (!window.isSecureContext && !window.location.hostname.includes('localhost')) {
          setError('Microphone access requires HTTPS. Please use a secure connection.');
          return;
        }
        
        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError('Microphone access is not supported in this browser. Please use a modern browser like Chrome, Safari, or Firefox.');
          return;
        }
        
        // Check permission status without requesting it
        if (navigator.permissions) {
          try {
            const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
            if (permissionStatus.state === 'granted') {
              setHasMicPermission(true);
              console.log('🎤 Microphone permission already granted');
            } else {
              console.log('🎤 Microphone permission not yet granted - user will need to click record button');
            }
          } catch (err) {
            console.log('🎤 Could not check microphone permission status:', err);
          }
        }
      } catch (err) {
        console.error('🎤 Error checking microphone permission:', err);
      }
    };
    
    checkPermissionStatus();
  }, []);

  // Request microphone permission with forced popup
  const requestMicPermission = async () => {
    try {
      console.log('🎤 Requesting microphone permission...');
      
      // Check if we're in a secure context
      if (!window.isSecureContext) {
        setError('Microphone access requires HTTPS or localhost. Please use a secure connection.');
        return;
      }
      
      // This should trigger the browser's native permission popup
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      console.log('🎤 Microphone permission granted!');
      setHasMicPermission(true);
      setCurrentStep('recording');
      
      // Stop the stream immediately - we just wanted permission
      stream.getTracks().forEach(track => track.stop());
      
    } catch (err) {
      console.error('🎤 Microphone permission denied:', err);
      
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access in your browser and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else if (err.name === 'NotSupportedError') {
        setError('Microphone access is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Edge.');
      } else {
        setError(`Microphone access failed: ${err.message}`);
      }
    }
  };


  // Auto-save progress every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (audioBlob && currentStep === 'recording') {
        saveProgress();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [audioBlob, currentStep]);

  const saveProgress = useCallback(async () => {
    try {
      const progressData = {
        test_id: testData.test_id,
        audio_blob: audioBlob ? await blobToBase64(audioBlob) : null,
        audio_mime_type: audioBlob ? audioBlob.type || 'audio/webm' : 'audio/webm',
        attempt_number: attemptNumber,
        step: currentStep,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem(`speaking_progress_${testData.test_id}`, JSON.stringify(progressData));
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }, [testData.test_id, audioBlob, attemptNumber, currentStep]);

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Extract just the base64 part, not the data URL
        const result = reader.result;
        const base64 = result.split(',')[1]; // Remove "data:audio/webm;base64," prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Save attempts to localStorage
  const saveAttemptsToStorage = useCallback((attempts) => {
    if (testData?.test_id && user?.student_id) {
      const attemptsKey = `speaking_attempts_${user.student_id}_${testData.test_id}`;
      localStorage.setItem(attemptsKey, attempts.toString());
      console.log('💾 Saved attempts to localStorage:', attempts);
    }
  }, [testData, user]);

  // Save speaking test data to cache (survives page reloads)
  const saveSpeakingTestData = useCallback(async (audioBlob, transcript, scores, recordingTime, currentStep, mimeType) => {
    if (testData?.test_id && user?.student_id) {
      try {
        const { setCachedData, CACHE_TTL } = await import('../../utils/cacheUtils');
        const cacheKey = `speaking_test_data_${user.student_id}_${testData.test_id}`;
        
        // Convert audio blob to base64 for caching
        const audioBase64 = audioBlob ? await blobToBase64(audioBlob) : null;
        
        const cacheData = {
          audioBlob: audioBase64,
          audioMimeType: mimeType || 'audio/webm',
          transcript,
          scores,
          recordingTime,
          currentStep,
          timestamp: Date.now()
        };
        
        setCachedData(cacheKey, cacheData, CACHE_TTL.speaking_test_data);
        console.log('💾 Saved speaking test data to cache:', cacheKey);
      } catch (error) {
        console.error('Failed to save speaking test data to cache:', error);
      }
    }
  }, [testData, user]);

  // Load speaking test data from cache
  const loadSpeakingTestData = useCallback(async () => {
    if (testData?.test_id && user?.student_id) {
      try {
        const { getCachedData } = await import('../../utils/cacheUtils');
        const cacheKey = `speaking_test_data_${user.student_id}_${testData.test_id}`;
        const cachedData = getCachedData(cacheKey);
        
        if (cachedData) {
          console.log('💾 Loaded speaking test data from cache:', cachedData);
          
          // Restore audio blob from base64
          if (cachedData.audioBlob) {
            const mimeType = cachedData.audioMimeType || 'audio/webm';
            const audioBlob = new Blob([Uint8Array.from(atob(cachedData.audioBlob), c => c.charCodeAt(0))], { type: mimeType });
            setAudioBlob(audioBlob);
            setAudioMimeType(mimeType);
          }
          
          // Restore other data
          if (cachedData.transcript) setTranscript(cachedData.transcript);
          if (cachedData.scores) setScores(cachedData.scores);
          if (cachedData.recordingTime) setRecordingTime(cachedData.recordingTime);
          if (cachedData.currentStep) setCurrentStep(cachedData.currentStep);
          if (cachedData.audioMimeType) setAudioMimeType(cachedData.audioMimeType);
          
          return true; // Data was loaded
        }
      } catch (error) {
        console.error('Failed to load speaking test data from cache:', error);
      }
    }
    return false; // No data was loaded
  }, [testData, user]);

  // Load speaking test data from cache on component mount, but clear if retest
  useEffect(() => {
    if (testData?.test_id && user?.student_id) {
      try {
        const studentId = user.student_id;
        const retestAssignKey = `retest_assignment_id_${studentId}_speaking_${testData.test_id}`;
        const inProgressKey = `retest_in_progress_${studentId}_speaking_${testData.test_id}`;
        const isRetest = !!localStorage.getItem(retestAssignKey) || !!localStorage.getItem(inProgressKey);
        if (isRetest) {
          // Clear stored per-test data so previous attempt UI is not shown
          const cacheKey = `speaking_test_data_${studentId}_${testData.test_id}`;
          const antiCheatKey = `anti_cheating_${studentId}_speaking_${testData.test_id}`;
          const progressKey = `speaking_progress_${testData.test_id}`;
          localStorage.removeItem(cacheKey);
          localStorage.removeItem(antiCheatKey);
          localStorage.removeItem(progressKey);
          console.log('🧹 Cleared speaking per-test cache for retest start:', { cacheKey, antiCheatKey, progressKey });
        }
      } catch (_) {}
      loadSpeakingTestData();
    }
  }, [testData, user, loadSpeakingTestData]);

  // Save speaking test data to cache whenever state changes
  useEffect(() => {
    if (testData?.test_id && user?.student_id && (audioBlob || transcript || scores)) {
      saveSpeakingTestData(audioBlob, transcript, scores, recordingTime, currentStep, audioMimeType);
    }
  }, [audioBlob, transcript, scores, recordingTime, currentStep, testData, user, saveSpeakingTestData, audioMimeType]);

  const handleRecordingComplete = useCallback(async (audioBlobData, recordingDuration) => {
    // Prevent duplicate processing
    if (isProcessing) {
      console.log('🎤 Already processing, skipping duplicate call');
      return;
    }
    
    console.log('🎤 Recording completed, duration:', recordingDuration);
    setIsProcessing(true); // Set flag to prevent duplicate calls
    setAudioBlob(audioBlobData);
    setAudioMimeType(audioBlobData?.type || 'audio/webm');
    setRecordingTime(recordingDuration);
    setCurrentStep('processing');
    setError(null);

    try {
      // Convert blob to base64 for API
      const audioBase64 = await blobToBase64(audioBlobData);
      
      // Calculate timing
      const endTime = new Date();
      const timeTaken = testData.start_time ? Math.round((endTime - testData.start_time) / 1000) : 0;
      const startedAt = testData.start_time ? new Date(testData.start_time).toISOString() : endTime.toISOString();
      
      // Get retest assignment ID from localStorage (following other tests pattern)
      const studentId = user.student_id;
      const retestAssignKey = `retest_assignment_id_${studentId}_speaking_${testData.test_id}`;
      const retestAssignmentId = localStorage.getItem(retestAssignKey);
      
      // Prepare submission data (following other tests pattern)
      const submissionData = {
        test_id: testData.test_id,
        test_name: testData.test_name,
        teacher_id: testData.teacher_id || null,
        subject_id: testData.subject_id || null,
        student_id: studentId,
        question_id: testData.question_id || 1,
        audio_blob: audioBase64,
        audio_mime_type: audioBlobData?.type || 'audio/webm',
        audio_duration: recordingDuration, // Use the actual recording duration parameter
        time_taken: timeTaken,
        started_at: startedAt,
        submitted_at: endTime.toISOString(),
        caught_cheating: false,
        visibility_change_times: 0,
        is_completed: true,
        retest_assignment_id: retestAssignmentId ? Number(retestAssignmentId) : null,
        parent_test_id: testData.test_id
      };
      
      console.log('🎤 Submitting speaking test:', submissionData);
      
      // Process audio immediately with real AI (like other tests do)
      console.log('🎤 Processing audio with AI...');
      
      try {
        // Send audio to backend for AI processing (feedback only)
        const response = await makeAuthenticatedRequest('/.netlify/functions/process-speaking-audio-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            test_id: testData.test_id,
            question_id: testData.question_id || 1,
            audio_blob: audioBase64,
            audio_mime_type: audioBlobData?.type || 'audio/webm'
          })
        });
        
        const result = await response.json();
      
      if (result.success) {
        // Set real AI results - map the AI response to the expected format
        console.log('🎤 AI Analysis Result:', result);
        setTranscript(result.transcript);
        
        // Verify word count
        const actualWordCount = result.transcript ? result.transcript.split(/\s+/).filter(word => word.length > 0).length : 0;
        console.log('🎤 Word Count Verification:', {
          aiCount: result.word_count,
          actualCount: actualWordCount,
          transcript: result.transcript
        });
        
        // Use the actual word count instead of AI count for display
        const displayWordCount = actualWordCount;
        
        const mappedScores = {
          overall_score: result.overall_score,
          word_count: displayWordCount, // Use actual word count for display
          // Use AI's actual scores instead of calculating them
          grammar_score: result.grammar_score,
          vocabulary_score: result.vocabulary_score,
          pronunciation_score: result.pronunciation_score,
          fluency_score: result.fluency_score,
          content_score: result.content_score,
          grammar_mistakes: result.grammar_mistakes,
          vocabulary_mistakes: result.vocabulary_mistakes,
          feedback: result.feedback,
          // Add improved transcript for display
          improved_transcript: result.improved_transcript,
          // Add detailed corrections
          grammar_corrections: result.grammar_corrections || [],
          vocabulary_corrections: result.vocabulary_corrections || [],
          language_use_corrections: result.language_use_corrections || [],
          pronunciation_corrections: result.pronunciation_corrections || [], // NEW: Enhanced pronunciation feedback
          // Include full AI feedback object for persistence on final submit
          ai_feedback: result.ai_feedback || null
        };
        
        console.log('🎤 Mapped Scores:', mappedScores);
        console.log('🎤 Individual scores check:', {
          grammar_score: result.grammar_score,
          vocabulary_score: result.vocabulary_score,
          pronunciation_score: result.pronunciation_score,
          fluency_score: result.fluency_score,
          content_score: result.content_score
        });
        setScores(mappedScores);
        setCurrentStep('feedback');
      } else {
        throw new Error(result.message || result.error || 'Failed to process audio with AI');
      }
      
        // Clear progress from localStorage
        localStorage.removeItem(`speaking_progress_${testData.test_id}`);
      } catch (error) {
        console.error('Speaking test submission error:', error);
        
        // Handle authentication errors specifically
        if (error.message.includes('No valid authentication token found')) {
          setError('Your session has expired. Please refresh the page and try again.');
          // Optionally redirect to login or refresh the page
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } else {
          setError(error.message);
        }
        setCurrentStep('recording');
      }
    } catch (error) {
      console.error('Speaking test submission error:', error);
      setError(error.message);
      setCurrentStep('recording');
    } finally {
      setIsProcessing(false); // Clear flag when processing completes or fails
    }
  }, [testData, user, makeAuthenticatedRequest, attemptNumber, saveAttemptsToStorage, isProcessing]);

  // Recovery effect to handle page reload during processing
  useEffect(() => {
    if (currentStep === 'processing' && !transcript && !scores) {
      console.log('🔁 Detected stuck "processing" state on reload. Attempting recovery...');
      if (audioBlob) {
        console.log('🔁 Resuming processing from cached audio blob...');
        handleRecordingComplete(audioBlob, recordingTime);
      } else {
        console.log('🔁 No cached audio blob found. Resetting to recording step.');
        setCurrentStep('recording');
      }
    }
  }, [currentStep, transcript, scores, audioBlob, recordingTime, handleRecordingComplete]);

  const handleReRecord = useCallback(() => {
    if (attemptNumber < maxAttempts) {
      setAudioBlob(null);
      setTranscript('');
      setScores(null);
      setError(null);
      setIsProcessing(false); // Reset processing flag for new attempt
      setAudioMimeType('audio/webm');
      
      // Increment attempt when student decides to re-record after seeing results
      const newAttempt = attemptNumber + 1;
      setAttemptNumber(newAttempt);
      saveAttemptsToStorage(newAttempt);
      
      setCurrentStep('recording');
    } else {
      setError('Maximum attempts reached');
    }
  }, [attemptNumber, maxAttempts, saveAttemptsToStorage]);

  const handleSubmitTest = useCallback(async () => {
    if (!transcript || !scores) return;
    
    setIsSubmitting(true);
    
    try {
      // Calculate timing
      const endTime = new Date();
      const timeTaken = testData.start_time ? Math.round((endTime - testData.start_time) / 1000) : 0;
      const startedAt = testData.start_time ? new Date(testData.start_time).toISOString() : endTime.toISOString();
      
      // Get retest assignment ID from localStorage (following other tests pattern)
      const studentId = user.student_id;
      const retestAssignKey = `retest_assignment_id_${studentId}_speaking_${testData.test_id}`;
      const retestAssignmentId = localStorage.getItem(retestAssignKey);
      
      // Get current academic period ID from academic calendar service
      const { academicCalendarService } = await import('../../services/AcademicCalendarService');
      await academicCalendarService.loadAcademicCalendar();
      const currentTerm = academicCalendarService.getCurrentTerm();
      const academic_period_id = currentTerm?.id;
      
      if (!academic_period_id) {
        throw new Error('No current academic period found');
      }

      // Prepare final submission data (AI processing already done)
      const finalSubmissionData = {
        test_id: testData.test_id,
        test_name: testData.test_name,
        teacher_id: testData.teacher_id || null,
        subject_id: testData.subject_id || null,
        student_id: studentId,
        academic_period_id: academic_period_id,
        question_id: testData.question_id || 1,
        audio_blob: audioBlob ? await blobToBase64(audioBlob) : null,
        audio_duration: audioBlob?.duration || 0,
        time_taken: timeTaken,
        started_at: startedAt,
        submitted_at: endTime.toISOString(),
        caught_cheating: false,
        visibility_change_times: 0,
        is_completed: true,
        retest_assignment_id: retestAssignmentId ? Number(retestAssignmentId) : null,
        parent_test_id: testData.test_id,
        audio_mime_type: audioMimeType,
        // Include already processed results
        transcript: transcript,
        scores: scores,
        final_submission: true // Flag to indicate this is the final submission
      };
      
      console.log('🎤 Final submission:', finalSubmissionData);
      
      // Submit final results to backend
      console.log('🎤 Making final submission request...');
      const response = await makeAuthenticatedRequest('/.netlify/functions/submit-speaking-test-final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalSubmissionData)
      });
      
      console.log('🎤 Final submission response status:', response.status);
      const result = await response.json();
      console.log('🎤 Final submission result:', result);
      
      if (result.success) {
        // Mark test as completed in localStorage (following other tests pattern)
        if (user?.student_id) {
          const completionKey = `test_completed_${user.student_id}_speaking_${testData.test_id}`;
          localStorage.setItem(completionKey, 'true');
          console.log('✅ Speaking test marked as completed in localStorage:', completionKey);

          // Clear in-progress retest lock key on successful submit
          const inProgressKey = `retest_in_progress_${user.student_id}_speaking_${testData.test_id}`;
          localStorage.removeItem(inProgressKey);
          console.log('🗑️ Cleared in-progress retest lock:', inProgressKey);
          
        // Clear attempts from localStorage upon successful submission
        const attemptsKey = `speaking_attempts_${user.student_id}_${testData.test_id}`;
        localStorage.removeItem(attemptsKey);
        console.log('🗑️ Cleared attempts from localStorage upon submission');
        
        // Clear speaking test data from cache upon successful submission
        const { clearTestData } = await import('../../utils/cacheUtils');
        clearTestData(user.student_id, 'speaking_test_data', testData.test_id);
        console.log('🗑️ Cleared speaking test data from cache upon submission');
        
        // Clear anti-cheating state (mirror other tests)
        try {
          const antiCheatKey = `anti_cheating_${user.student_id}_speaking_${testData.test_id}`;
          localStorage.removeItem(antiCheatKey);
          console.log('🗑️ Cleared anti-cheating key:', antiCheatKey);
        } catch (_) {}
        }
        
        // Cache the test results immediately after successful submission (like other tests)
        console.log('🎤 Caching speaking test results after submission...');
        const studentIdCache = user?.student_id || user?.id || 'unknown';
        const cacheKey = `student_results_table_${studentIdCache}`;
        const { setCachedData, getCachedData, CACHE_TTL, clearTestData } = await import('../../utils/cacheUtils');

        // Build the new result row
        const newRow = {
          id: Date.now(),
          test_id: testData.test_id,
          test_type: 'speaking',
          test_name: testData.test_name,
          score: Math.round(scores.overall_score / 10),
          max_score: 10,
          percentage: scores.overall_score,
          caught_cheating: false,
          visibility_change_times: 0,
          is_completed: true,
          submitted_at: new Date().toISOString(),
          subject: 'Listening and Speaking',
          teacher_name: testData.teacher_name || 'Unknown'
        };

        // Merge with existing cached results instead of overwriting
        let merged = { success: true, results: [], count: 0 };
        try {
          const existing = getCachedData(cacheKey);
          if (existing && Array.isArray(existing.results)) {
            merged.results = existing.results.slice();
          }
        } catch (_) {}
        merged.results.unshift(newRow);
        merged.count = merged.results.length;

        setCachedData(cacheKey, merged, CACHE_TTL.student_results_table);
        console.log('🎤 Speaking test results cached (merged) with key:', cacheKey);
        
        // Clear test data from cache (like other tests)
        if (user?.student_id) {
          clearTestData(user.student_id, 'speaking', testData.test_id);
        }
        
        // Check if this is a retest and handle retest_attempt keys (following other tests pattern)
        const isRetest = !!retestAssignmentId;
        if (isRetest && user?.student_id) {
          // Get max attempts from active tests cache or default to 3
          let maxAttempts = 3;
          try {
            const activeTestsCache = localStorage.getItem(`student_active_tests_${user.student_id}`);
            if (activeTestsCache) {
              const activeTests = JSON.parse(activeTestsCache);
              const test = activeTests?.tests?.find(t =>
                t.test_id === testData.test_id && t.test_type === 'speaking'
              );
              if (test) {
                maxAttempts = test.retest_attempts_left || test.max_attempts || 3;
              }
            }
          } catch (e) {
            console.error('Error checking active tests cache:', e);
          }

          // Calculate percentage from overall_score (0-100 scale)
          const percentage = scores?.overall_score ?? 0;
          const passed = percentage >= 50;

          if (passed) {
            // Student passed - mark last attempt
            const lastSlotKey = `retest_attempt${maxAttempts}_${user.student_id}_speaking_${testData.test_id}`;
            localStorage.setItem(lastSlotKey, 'true');
            console.log('🎓 Passed retest, marking last-slot key:', lastSlotKey);

            // Count actual attempts used after marking this attempt
            let usedAttempts = 0;
            for (let i = 1; i <= 10; i++) {
              const key = `retest_attempt${i}_${user.student_id}_speaking_${testData.test_id}`;
              if (localStorage.getItem(key) === 'true') {
                usedAttempts++;
              }
            }

            // Mark retest as completed (student passed)
            const completionKey = `test_completed_${user.student_id}_speaking_${testData.test_id}`;
            localStorage.setItem(completionKey, 'true');
            console.log('🎓 Marked retest as completed (student passed):', completionKey);

            // Set retest_attempts metadata so button logic can check if attempts are exhausted
          const attemptsMetaKey = `retest_attempts_${user.student_id}_speaking_${testData.test_id}`;
            localStorage.setItem(attemptsMetaKey, JSON.stringify({ used: usedAttempts, max: maxAttempts }));
            console.log('🎓 Set retest attempts metadata (student passed):', attemptsMetaKey, { used: usedAttempts, max: maxAttempts });
          } else {
            // Find the next attempt number
            let nextAttemptNumber = 1;
            for (let i = 1; i <= 10; i++) {
              const key = `retest_attempt${i}_${user.student_id}_speaking_${testData.test_id}`;
              if (localStorage.getItem(key) !== 'true') {
                nextAttemptNumber = i;
                break;
              }
            }
            // Mark this specific attempt as completed
            const attemptKey = `retest_attempt${nextAttemptNumber}_${user.student_id}_speaking_${testData.test_id}`;
            localStorage.setItem(attemptKey, 'true');
            console.log('🎓 Marked retest attempt as completed:', attemptKey);

            // Count actual attempts used after marking this attempt
            let usedAttempts = 0;
            for (let i = 1; i <= 10; i++) {
              const key = `retest_attempt${i}_${user.student_id}_speaking_${testData.test_id}`;
              if (localStorage.getItem(key) === 'true') {
                usedAttempts++;
              }
            }

            // Mark retest as completed (attempts exhausted OR passed) - right after writing retest_attempt key
            const attemptsLeft = maxAttempts - usedAttempts;
            const shouldComplete = attemptsLeft <= 0 || passed;
            console.log('🎓 Retest completion check:', { usedAttempts, maxAttempts, attemptsLeft, passed, shouldComplete });
            if (shouldComplete) {
              const completionKey = `test_completed_${user.student_id}_speaking_${testData.test_id}`;
              localStorage.setItem(completionKey, 'true');
              console.log('🎓 Marked retest as completed (attempts exhausted or passed):', completionKey);

              // Set retest_attempts metadata so button logic can check if attempts are exhausted
              const attemptsMetaKey = `retest_attempts_${user.student_id}_speaking_${testData.test_id}`;
              localStorage.setItem(attemptsMetaKey, JSON.stringify({ used: usedAttempts, max: maxAttempts }));
              console.log('🎓 Set retest attempts metadata (attempts exhausted):', attemptsMetaKey, { used: usedAttempts, max: maxAttempts });
            }
          }
        } else {
          // Regular test - mark as completed (already done above)
        }

        // Clear retest keys after successful submission
        if (user?.student_id) {
          const retestKey = `retest1_${user.student_id}_speaking_${testData.test_id}`;
          const retestAssignKeyFinal = `retest_assignment_id_${user.student_id}_speaking_${testData.test_id}`;
          localStorage.removeItem(retestKey);
          localStorage.removeItem(retestAssignKeyFinal);
        }

        // Skip results page for speaking (mirror drawing behavior) and return to cabinet
        try {
          if (onTestComplete) {
            onTestComplete(scores.overall_score);
          }
          if (typeof onExit === 'function') {
            onExit();
          }
        } catch (_) {}
        return;
      } else {
        throw new Error(result.message || 'Failed to submit speaking test');
      }
    } catch (error) {
      console.error('Speaking test submission error:', error);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [testData, user, makeAuthenticatedRequest, transcript, scores, audioBlob, attemptNumber, onComplete]);

  const handleFinalSubmit = useCallback(() => {
    setCurrentStep('completed');
    onComplete({
      test_id: testData.test_id,
      transcript,
      scores,
      attempt_number: attemptNumber
    });
  }, [testData.test_id, transcript, scores, attemptNumber, onComplete]);

  const handleExitConfirm = useCallback(() => {
    console.log('🎯 SpeakingTestStudent: handleExitConfirm called');
    console.log('🎯 SpeakingTestStudent: Current location:', window.location.href);
    console.log('🎯 SpeakingTestStudent: Current history state:', window.history.state);
    
    setShowExitModal(false);
    const pending = pendingNavigationRef.current;
    console.log('🎯 SpeakingTestStudent: Pending navigation:', pending);
    pendingNavigationRef.current = null;

    // Record navigation back to cabinet as a visibility change (like original implementation)
    if (testData?.test_id && user?.student_id) {
      const studentId = user?.student_id || user?.id || 'unknown';
      const cacheKey = `anti_cheating_${studentId}_speaking_${testData.test_id}`;
      
      // Get current anti-cheating data
      const existingData = getCachedData(cacheKey) || { tabSwitches: 0, isCheating: false };
      const currentTabSwitches = existingData.tabSwitches || 0;
      
      // Increment tab switch count (navigation back to cabinet counts as a visibility change)
      const newTabSwitches = currentTabSwitches + 1;
      const newIsCheating = newTabSwitches >= 2; // 2+ switches = cheating
      
      console.log('🎯 SpeakingTestStudent: Tab switch count:', currentTabSwitches, '->', newTabSwitches);
      
      // Save updated data to localStorage (same format as useAntiCheating hook)
      setCachedData(cacheKey, { 
        tabSwitches: newTabSwitches, 
        isCheating: newIsCheating 
      }, CACHE_TTL.anti_cheating);
    }

    // Disable intercept first
    console.log('🎯 SpeakingTestStudent: Disabling intercept');
    setBackInterceptEnabled(false);
    
    // Clean up intercept history state
    if (pending) {
      console.log('🎯 SpeakingTestStudent: Cleaning up intercept history state');
      try {
        const currentState = window.history.state;
        console.log('🎯 SpeakingTestStudent: Current history state before cleanup:', currentState);
        if (currentState && currentState.__intercept) {
          const prevState = currentState.prevState ?? null;
          console.log('🎯 SpeakingTestStudent: Restoring previous state:', prevState);
          window.history.replaceState(prevState, document.title, window.location.href);
          console.log('🎯 SpeakingTestStudent: History state after cleanup:', window.history.state);
        }
      } catch (error) {
        console.warn('🎯 SpeakingTestStudent: Failed to restore history state:', error);
      }
    }

    // Navigate to cabinet - use window.location.href like StudentTests does
    console.log('🎯 SpeakingTestStudent: Scheduling navigation in 100ms');
    setTimeout(() => {
      console.log('🎯 SpeakingTestStudent: Executing navigation to /student');
      console.log('🎯 SpeakingTestStudent: Current location before navigation:', window.location.href);
      // Force full page navigation to bypass React Router history issues
      window.location.href = '/student';
      console.log('🎯 SpeakingTestStudent: window.location.href set to /student');
    }, 100);
  }, [onExit, testData, user?.student_id, user?.id]);

  const handleExitCancel = useCallback(() => {
    const pending = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    if (pending?.cancel) {
      pending.cancel();
    }
    setShowExitModal(false);
    if (currentStep !== 'completed') {
      setBackInterceptEnabled(true);
    }
  }, [currentStep]);

  const renderCurrentStep = () => {
    switch (currentStep) {
        
      case 'recording':
        return (
          <div className="speaking-test-recording">
            <h2 
              className={`text-2xl font-bold mb-4 text-center ${themeClasses.text} ${
                isCyberpunk ? 'tracking-wider' : ''
              }`}
              style={isCyberpunk ? { 
                fontFamily: 'monospace',
                textShadow: '0 0 10px rgba(0, 255, 255, 0.5), 0 0 20px rgba(0, 255, 255, 0.3)'
              } : {}}
            >
              {isCyberpunk
                ? testData.test_name.toUpperCase()
                : testData.test_name}
            </h2>
            <div className="mb-6 text-center">
              <h3 className={`text-lg font-semibold mb-2 ${
                isCyberpunk ? '' : themeClasses.text
              }`}
              style={isCyberpunk ? {
                ...themeStyles.textCyan,
                fontFamily: 'monospace'
              } : {}}>
                {isCyberpunk ? 'INSTRUCTIONS:' : 'Instructions:'}
              </h3>
              <p className={`mb-4 ${
                isCyberpunk ? '' : themeClasses.textSecondary
              }`}
              style={isCyberpunk ? {
                color: CYBERPUNK_COLORS.cyan,
                fontFamily: 'monospace',
                ...themeStyles.textShadow
              } : {}}>
                {testData.prompt}
              </p>
              <div className={`${isCyberpunk ? 'bg-cyan-400/10 border border-cyan-400/30' : 'bg-blue-50 border border-blue-200'} p-3 sm:p-4 rounded-lg`}>
                <p className={`text-sm ${isCyberpunk ? 'text-cyan-300' : 'text-blue-800'}`}>
                  <strong>Requirements:</strong> Minimum {testData.min_words || 50} words, 
                  0-{testData.max_duration || 600} seconds duration
                </p>
              </div>
            </div>
            
            <AudioRecorder
              ref={recordingRef}
              onRecordingComplete={handleRecordingComplete}
              minDuration={0}
              maxDuration={testData.max_duration || 600}
              minWords={testData.min_words || 50}
              maxAttempts={maxAttempts}
              currentAttempt={attemptNumber}
            />
            
            {error && (
              <div className="mt-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}
          </div>
        );

      case 'processing':
        return (
          <div className={`transcription-status ${themeClasses.cardBg} rounded-lg shadow-lg p-4 sm:p-8 text-center ${themeClasses.cardBorder} border`}>
            <div className="mb-6">
              <div className={`text-6xl mb-4 ${themeClasses.textSecondary}`}>⏳</div>
              <h3 className={`text-2xl font-semibold mb-2 ${themeClasses.text}`}>Processing Your Speech</h3>
              <p className={`text-lg ${isCyberpunk ? 'text-cyan-400' : 'text-blue-600'}`}>Please wait while we process your audio...</p>
            </div>
            <div className="inline-flex space-x-1">
              <div className={`w-2 h-2 rounded-full animate-bounce ${isCyberpunk ? 'bg-cyan-400' : 'bg-blue-600'}`}></div>
              <div className={`w-2 h-2 rounded-full animate-bounce ${isCyberpunk ? 'bg-cyan-400' : 'bg-blue-600'}`} style={{ animationDelay: '0.1s' }}></div>
              <div className={`w-2 h-2 rounded-full animate-bounce ${isCyberpunk ? 'bg-cyan-400' : 'bg-blue-600'}`} style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        );

      case 'feedback':
        console.log('🎤 Rendering feedback step with Submit Final button');
        return (
          <FeedbackDisplay
            transcript={transcript}
            scores={scores}
            audioBlob={audioBlob}
            recordingTime={recordingTime}
            onReRecord={handleReRecord}
            onFinalSubmit={() => setShowSubmitModal(true)}
            canReRecord={attemptNumber < maxAttempts}
            attemptNumber={attemptNumber}
            maxAttempts={maxAttempts}
            isSubmitting={isSubmitting}
          />
        );

      case 'completed':
        // Use the same TestResults component as other tests
        const testResultsData = {
          showResults: true,
          testInfo: {
            test_name: testData?.test_name || 'Speaking Test',
            id: testData?.test_id,
            test_id: testData?.test_id
          },
          testType: 'speaking',
          score: scores?.overall_score || 0,
          totalQuestions: 1,
          percentage: scores?.overall_score || 0,
          passed: (scores?.overall_score || 0) >= 50,
          questionAnalysis: [{
            questionNumber: 1,
            userAnswer: transcript,
            correctAnswer: 'Speaking test completed',
            isCorrect: true,
            score: scores?.overall_score || 0,
            maxScore: 100,
            feedback: `Word Count: ${scores?.word_count || 0}, Grammar: ${scores?.grammar_score || 0}/40, Vocabulary: ${scores?.vocab_score || 0}/30`
          }],
          timestamp: new Date().toISOString(),
          caught_cheating: false,
          visibility_change_times: 0
        };
        
        return (
          <div className="speaking-test-completed">
            <TestResults
              testResults={testResultsData}
              onBackToCabinet={() => {
                pendingNavigationRef.current = null;
                setShowExitModal(true);
              }}
              onRetakeTest={() => {
                setCurrentStep('recording');
                setTranscript('');
                setScores(null);
                setAudioBlob(null);
                setAudioMimeType('audio/webm');
                setAttemptNumber(1);
              }}
              isLoading={false}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Submit Confirmation Modal */}
      <PerfectModal
        isOpen={showSubmitModal && !isSubmitting}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Speaking Test"
        size="small"
      >
        <div className="text-center">
          <p className={`${themeClasses.textSecondary} mb-6`}>
            Are you sure you want to submit? 
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setShowSubmitModal(false)} variant="secondary">Cancel</Button>
            <Button 
              onClick={() => { setShowSubmitModal(false); handleSubmitTest(); }} 
              variant="primary"
              className={isCyberpunk ? '' : ''}
              style={isCyberpunk ? {
                backgroundColor: CYBERPUNK_COLORS.black,
                borderColor: CYBERPUNK_COLORS.cyan,
                color: CYBERPUNK_COLORS.cyan,
                fontFamily: 'monospace',
                borderWidth: '2px',
                ...themeStyles.glow
              } : {}}
            >
              {isCyberpunk ? 'SUBMIT' : 'Submit'}
            </Button>
          </div>
        </div>
      </PerfectModal>

      {/* Exit Confirmation Modal */}
      <PerfectModal
        isOpen={showExitModal}
        onClose={handleExitCancel}
        title="Exit Speaking Test"
        size="small"
      >
        <div className="text-center">
          <p className={`${themeClasses.textSecondary} mb-6`}>Are you sure you want to go back to cabinet?</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleExitCancel} variant="secondary">Cancel</Button>
            <Button 
              onClick={(e) => {
                console.log('🎯 SpeakingTestStudent: Go Back button clicked in modal');
                console.log('🎯 SpeakingTestStudent: Button click event:', e);
                handleExitConfirm();
              }} 
              variant="primary"
            >
              Go Back
            </Button>
          </div>
        </div>
      </PerfectModal>
      
      {/* Test Content */}
      <div className={`${themeClasses.cardBg} rounded-lg shadow-sm p-3 sm:p-6 ${themeClasses.cardBorder} border`}>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        
        {renderCurrentStep()}
      </div>
    </div>
  );
};

export default SpeakingTestStudent;

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Stage, Layer, Rect, Text, Group, Line } from 'react-konva';
import Konva from 'konva';

import Button from '../ui/Button';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';
import PerfectModal from '../ui/PerfectModal';
import ProgressTracker from './ProgressTracker';
import { useNotification } from '../ui/Notification';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { useTheme } from '../../hooks/useTheme';
import { getThemeStyles, getCyberpunkCardBg, CYBERPUNK_COLORS, colorToRgba } from '../../utils/themeUtils';
import { useTestProgress } from '../../hooks/useTestProgress';
import { useAntiCheating } from '../../hooks/useAntiCheating';
import { getCachedData, setCachedData, clearTestData, CACHE_TTL } from '../../utils/cacheUtils';
import useInterceptBackNavigation from '../../hooks/useInterceptBackNavigation';

const WordMatchingStudent = ({ testData, onTestComplete, onBackToCabinet }) => {
  const { user } = useAuth();
  const { makeAuthenticatedRequest } = useApi();
  const { showNotification } = useNotification();
  
  // Theme hook - must be at component level
  const { theme, isCyberpunk, themeClasses } = useTheme();
  const themeStyles = getThemeStyles(theme);
  
  // Responsive sizing hook
  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  
  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  
  const { startTracking, stopTracking, getCheatingData, clearData } = useAntiCheating(
    'word_matching',
    testData?.id,
    user?.student_id || user?.id
  );

  // State management
  const [displayData, setDisplayData] = useState(null);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [selectedWord, setSelectedWord] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timerKeyRef = useRef(null);
  const lastTickRef = useRef(null);
  const timerInitializedRef = useRef(false);
  
  // Container ref for actual width
  const containerRef = useRef(null);
  const [canvasWidth, setCanvasWidth] = useState(800);
  
  // Responsive breakpoints
  const BREAKPOINTS = {
    VERY_SMALL: 400,
    MOBILE: 600,
    TABLET: 900
  };
  
  // Abstract sizing scale
  const SCALE = {
    VERY_SMALL: 0.6,
    MOBILE: 0.8,
    TABLET: 0.9,
    DESKTOP: 1.0
  };
  
  // Base dimensions (desktop reference)
  const BASE = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 400,
    BLOCK_WIDTH: 140,
    BLOCK_HEIGHT: 50,
    BLOCK_SPACING: 80, // Reduced spacing for tighter layout
    MARGIN: 50,
    PADDING: 20
  };
  
  // Determine screen size category
  const isVerySmall = screenSize.width < BREAKPOINTS.VERY_SMALL;
  const isMobile = screenSize.width >= BREAKPOINTS.VERY_SMALL && screenSize.width < BREAKPOINTS.MOBILE;
  const isTablet = screenSize.width >= BREAKPOINTS.MOBILE && screenSize.width < BREAKPOINTS.TABLET;
  const isDesktop = screenSize.width >= BREAKPOINTS.TABLET;
  
  // Get current scale factor
  const scale = isVerySmall ? SCALE.VERY_SMALL : 
                isMobile ? SCALE.MOBILE : 
                isTablet ? SCALE.TABLET : SCALE.DESKTOP;
  
  // Update canvas width when container is available
  useEffect(() => {
    const updateCanvasWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        console.log('🎯 Container width detected:', width);
        if (width > 0) {
          setCanvasWidth(width);
        }
      }
    };

    // Initial check
    updateCanvasWidth();

    // Use multiple attempts for mobile devices
    const timeoutIds = [
      setTimeout(updateCanvasWidth, 50),
      setTimeout(updateCanvasWidth, 100),
      setTimeout(updateCanvasWidth, 200),
      setTimeout(updateCanvasWidth, 500)
    ];

    // Also listen for resize events
    window.addEventListener('resize', updateCanvasWidth);

    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
      window.removeEventListener('resize', updateCanvasWidth);
    };
  }, [displayData]); // Re-run when displayData changes
  
  // Responsive block dimensions
  const blockWidth = BASE.BLOCK_WIDTH * scale;
  const blockHeight = BASE.BLOCK_HEIGHT * scale;
  const blockSpacing = BASE.BLOCK_SPACING * scale;
  
  // Responsive positioning
  const margin = BASE.MARGIN * scale;
  const minGap = 60 * scale; // Minimum gap between left and right blocks
  const leftBlockX = margin;
  
  // Debug logging for mobile issues
  console.log('🎯 Mobile Debug:', {
    screenWidth: screenSize.width,
    containerWidth: containerRef.current?.clientWidth,
    canvasWidth,
    scale,
    blockWidth,
    margin,
    leftBlockX,
    displayDataLoaded: !!displayData
  });
  
  // Check if blocks can fit side by side
  const minRequiredWidth = leftBlockX + blockWidth + 20 + blockWidth + margin;
  const canFitSideBySide = minRequiredWidth <= canvasWidth;
  
  // Keep right blocks inside canvas - constrained by parent container
  // Ensure right blocks never go outside the canvas
  let rightBlockX;
  let actualBlockWidth = blockWidth;
  let actualBlockHeight = blockHeight;
  
  if (canFitSideBySide) {
    // Normal side-by-side layout
    rightBlockX = Math.min(
      Math.max(
        leftBlockX + blockWidth + 20, // Minimum gap from left block
        canvasWidth - blockWidth - margin // Right edge with margin
      ),
      canvasWidth - blockWidth - margin // Never exceed right edge
    );
  } else {
    // Very small screen - make blocks smaller and ensure they fit
    const availableWidth = canvasWidth - margin * 2;
    const maxBlockWidth = Math.floor((availableWidth - 20) / 2); // Split available width between two blocks
    actualBlockWidth = Math.max(60, maxBlockWidth); // Minimum 60px width
    actualBlockHeight = Math.max(30, actualBlockHeight * (actualBlockWidth / blockWidth)); // Scale height proportionally
    
    rightBlockX = leftBlockX + actualBlockWidth + 20;
    
    console.log('🎯 Very small screen - adjusted block size:', {
      availableWidth,
      maxBlockWidth,
      actualBlockWidth,
      actualBlockHeight
    });
  }
  
  console.log('🎯 Right Block Position:', {
    rightBlockX,
    rightBlockRightEdge: rightBlockX + actualBlockWidth,
    canvasWidth,
    fits: (rightBlockX + actualBlockWidth) <= canvasWidth,
    canFitSideBySide,
    minRequiredWidth
  });
  
  const blockStartY = margin;
  
  // Abstract font sizes
  const FONT_SIZES = {
    DRAGGED_WORD: Math.max(8, 14 * scale),
    ORIGINAL_WORD: Math.max(10, 16 * scale),
    LEFT_WORD: Math.max(10, 14 * scale)
  };
  
  // Abstract stroke width
  const STROKE_WIDTH = Math.max(1, 3 * scale);
  
  // Calculate dynamic block height based on content
  const calculateBlockHeight = useCallback((text, fontSize, blockWidth) => {
    if (!text) return actualBlockHeight;
    
    // More precise text height calculation
    const avgCharWidth = fontSize * 0.55; // More accurate character width estimation
    const maxCharsPerLine = Math.floor(blockWidth / avgCharWidth);
    const lines = Math.ceil(text.length / maxCharsPerLine);
    const lineHeight = fontSize * 1.1; // Tighter line height
    const verticalPadding = 12 * scale; // Reduced padding - just enough for comfort
    
    // Calculate exact height needed for content
    const contentHeight = (lines * lineHeight) + verticalPadding;
    
    // Use minimum height only if content is very short
    const minHeight = Math.max(actualBlockHeight * 0.8, 30 * scale); // Smaller minimum
    
    return Math.max(minHeight, contentHeight);
  }, [actualBlockHeight, scale]);
  
  // Calculate dynamic canvas height based on actual content
  const calculateCanvasHeight = useCallback(() => {
    if (!displayData?.leftWords || !displayData?.rightWords) {
      return BASE.CANVAS_HEIGHT * scale;
    }
    
    // Calculate total height needed for all blocks
    let totalHeight = margin * 2; // Top and bottom margins
    
    // Calculate height for each row of blocks
    for (let i = 0; i < displayData.leftWords.length; i++) {
      const leftWord = displayData.leftWords[i];
      const rightWord = displayData.rightWords[i];
      
      const leftHeight = calculateBlockHeight(leftWord, FONT_SIZES.LEFT_WORD, actualBlockWidth);
      const rightHeight = calculateBlockHeight(rightWord, FONT_SIZES.ORIGINAL_WORD, actualBlockWidth);
      const rowHeight = Math.max(leftHeight, rightHeight);
      
      totalHeight += rowHeight;
      
      // Add spacing between rows (except for the last row)
      if (i < displayData.leftWords.length - 1) {
        totalHeight += 20 * scale; // Padding between blocks
      }
    }
    
    // Ensure minimum height
    const minHeight = BASE.CANVAS_HEIGHT * scale;
    return Math.max(minHeight, totalHeight);
  }, [displayData, calculateBlockHeight, FONT_SIZES, actualBlockWidth, margin, scale]);
  
  const canvasHeight = calculateCanvasHeight();
  
  // Calculate dynamic spacing between blocks based on content
  const calculateBlockSpacing = useCallback((leftWords, rightWords) => {
    if (!leftWords || !rightWords) return blockSpacing;
    
    // Calculate the maximum height needed for each row
    const maxHeights = leftWords.map((leftWord, index) => {
      const rightWord = rightWords[index];
      const leftHeight = calculateBlockHeight(leftWord, FONT_SIZES.LEFT_WORD, actualBlockWidth);
      const rightHeight = calculateBlockHeight(rightWord, FONT_SIZES.ORIGINAL_WORD, actualBlockWidth);
      return Math.max(leftHeight, rightHeight);
    });
    
    // Use the maximum height plus padding for spacing
    const maxHeight = Math.max(...maxHeights);
    const padding = 20 * scale; // Padding between blocks
    
    return maxHeight + padding;
  }, [blockSpacing, calculateBlockHeight, FONT_SIZES, actualBlockWidth, scale]);
  
  // Calculate cumulative Y positions for each block row
  const calculateBlockPositions = useCallback(() => {
    if (!displayData?.leftWords || !displayData?.rightWords) {
      return [];
    }
    
    const positions = [];
    let currentY = margin;
    
    for (let i = 0; i < displayData.leftWords.length; i++) {
      const leftWord = displayData.leftWords[i];
      const rightWord = displayData.rightWords[i];
      
      const leftHeight = calculateBlockHeight(leftWord, FONT_SIZES.LEFT_WORD, actualBlockWidth);
      const rightHeight = calculateBlockHeight(rightWord, FONT_SIZES.ORIGINAL_WORD, actualBlockWidth);
      const rowHeight = Math.max(leftHeight, rightHeight);
      
      positions.push({
        y: currentY,
        leftHeight,
        rightHeight,
        rowHeight
      });
      
      // Move to next row position
      currentY += rowHeight + (20 * scale); // Add padding between rows
    }
    
    return positions;
  }, [displayData, calculateBlockHeight, FONT_SIZES, actualBlockWidth, margin, scale]);
  
  const blockPositions = calculateBlockPositions();
  const [studentArrows, setStudentArrows] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [testStartTime, setTestStartTime] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showBackModal, setShowBackModal] = useState(false);
  const [isBackInterceptEnabled, setBackInterceptEnabled] = useState(true);
  const pendingNavigationRef = useRef(null);

  useInterceptBackNavigation(
    isBackInterceptEnabled,
    useCallback(({ confirm, cancel }) => {
      console.log('🎯 WordMatchingStudent: Browser back button intercepted during test!');
      console.log('🎯 WordMatchingStudent: isBackInterceptEnabled:', isBackInterceptEnabled);
      console.log('🎯 WordMatchingStudent: Setting pending navigation and showing modal');
      pendingNavigationRef.current = { confirm, cancel };
      setShowBackModal(true);
    }, [isBackInterceptEnabled])
  );

  // Initialize test data
  useEffect(() => {
    if (testData) {
      console.log('🎯 WordMatchingStudent: Initializing test data:', testData);
      console.log('🎯 Interaction type:', testData.interaction_type);
      console.log('🎯 Left words:', testData.leftWords);
      console.log('🎯 Right words:', testData.rightWords);
      console.log('🎯 Correct pairs:', testData.correctPairs);
      
      // Validate data structure
      if (!Array.isArray(testData.leftWords) || !Array.isArray(testData.rightWords)) {
        console.error('🎯 Invalid data structure - leftWords or rightWords not arrays:', {
          leftWords: testData.leftWords,
          rightWords: testData.rightWords
        });
        return;
      }
      
      setDisplayData(testData);
      
      // Restore progress if available
      if (user?.student_id) {
        const progressKey = `test_progress_${user.student_id}_word_matching_${testData.id}`;
        const savedProgress = getCachedData(progressKey);
        if (savedProgress) {
          setStudentAnswers(savedProgress.answers || {});
          setStudentArrows(savedProgress.arrows || []);
          setTestStartTime(new Date(savedProgress.startTime));
          console.log('🎯 Test progress restored:', savedProgress);
        } else {
          setTestStartTime(new Date());
        }
      } else {
        setTestStartTime(new Date());
      }
      
      // Start anti-cheating tracking
      if (testData?.id && (user?.student_id || user?.id)) {
        startTracking();
      }
      
      // Initialize timer from allowed_time with persistent cache
      const allowedSeconds = Number(testData?.allowed_time || 0);
      const studentIdTimerInit = user?.student_id || user?.id || 'unknown';
      timerKeyRef.current = `test_timer_${studentIdTimerInit}_word_matching_${testData.id}`;
      timerInitializedRef.current = false; // Reset for new test
      if (allowedSeconds > 0) {
        try {
          const cached = localStorage.getItem(timerKeyRef.current);
          const now = Date.now();
          if (cached) {
            const parsed = JSON.parse(cached);
            const drift = Math.floor((now - new Date(parsed.lastTickAt).getTime()) / 1000);
            const remaining = Math.max(0, Number(parsed.remainingSeconds || allowedSeconds) - Math.max(0, drift));
            setTimeRemaining(remaining);
            lastTickRef.current = now;
            console.log('⏱️ Timer initialized from cache:', { remaining, allowedSeconds });
          } else {
            setTimeRemaining(allowedSeconds);
            lastTickRef.current = now;
            localStorage.setItem(timerKeyRef.current, JSON.stringify({
              remainingSeconds: allowedSeconds,
              lastTickAt: new Date(now).toISOString(),
              startedAt: new Date(now).toISOString()
            }));
            console.log('⏱️ Timer initialized fresh:', { allowedSeconds });
          }
          timerInitializedRef.current = true;
        } catch (e) {
          console.error('Timer cache init error:', e);
          setTimeRemaining(allowedSeconds);
          timerInitializedRef.current = true;
        }
      } else {
        setTimeRemaining(0);
        timerInitializedRef.current = true;
      }
    }
  }, [testData, user?.student_id, user?.id, startTracking]);

  // Auto-save progress
  useEffect(() => {
    if (displayData && testStartTime && user?.student_id) {
      const interval = setInterval(() => {
        const progressData = {
          answers: studentAnswers,
          arrows: studentArrows,
          startTime: testStartTime.toISOString()
        };
        const progressKey = `test_progress_${user.student_id}_word_matching_${testData.id}`;
        setCachedData(progressKey, progressData, CACHE_TTL.test_progress);
        console.log('🎯 Progress auto-saved');
      }, 30000); // Save every 30 seconds

      return () => clearInterval(interval);
    }
  }, [displayData, studentAnswers, studentArrows, testStartTime, user?.student_id, testData?.id]);


  // Handle word click for arrow mode
  const handleWordClick = useCallback((side, index) => {
    console.log('🎯 handleWordClick called:', { side, index, interactionType: testData?.interaction_type, selectedWord });
    
    if (testData?.interaction_type !== 'arrow') {
      console.log('🎯 Not arrow mode, ignoring click');
      return;
    }

    if (selectedWord) {
      if (selectedWord.side === side && selectedWord.index === index) {
        // Deselect if clicking the same word
        console.log('🎯 Deselecting word');
        setSelectedWord(null);
      } else if (selectedWord.side !== side) {
        // Create arrow connection
        console.log('🎯 Creating arrow connection:', { startWord: selectedWord, endWord: { side, index } });
        const newArrow = {
          id: Date.now().toString(),
          startWord: selectedWord,
          endWord: { side, index },
          color: '#3B82F6'
        };
        setStudentArrows(prev => {
          const newArrows = [...prev, newArrow];
          console.log('🎯 Updated arrows:', newArrows);
          return newArrows;
        });
        setStudentAnswers(prev => {
          const newAnswers = {
            ...prev,
            [selectedWord.index]: index
          };
          console.log('🎯 Updated answers:', newAnswers);
          return newAnswers;
        });
        setSelectedWord(null);
      }
    } else {
      // Select word
      console.log('🎯 Selecting word:', { side, index });
      setSelectedWord({ side, index });
    }
  }, [selectedWord, testData?.interaction_type]);

  // Handle drag end for drag mode
  const handleDragEnd = useCallback((leftIndex, rightIndex) => {
    if (testData.interaction_type !== 'drag') return;

    setStudentAnswers(prev => ({
      ...prev,
      [leftIndex]: rightIndex
    }));
  }, [testData?.interaction_type]);

  // Handle reset
  const handleReset = useCallback(() => {
    setShowResetModal(true);
  }, []);

  // Confirm reset
  const confirmReset = useCallback(() => {
    setStudentAnswers({});
    setStudentArrows([]);
    setSelectedWord(null);
    setShowResetModal(false);
  }, []);

  // Handle back to cabinet
  const handleBackToCabinet = useCallback(() => {
    pendingNavigationRef.current = null;
    setShowBackModal(true);
  }, []);

  // Confirm back to cabinet
  const confirmBackToCabinet = useCallback(() => {
    console.log('🎯 WordMatchingStudent: confirmBackToCabinet called');
    console.log('🎯 WordMatchingStudent: Current location:', window.location.href);
    console.log('🎯 WordMatchingStudent: Current history state:', window.history.state);
    
    setShowBackModal(false);
    const pending = pendingNavigationRef.current;
    console.log('🎯 WordMatchingStudent: Pending navigation:', pending);
    pendingNavigationRef.current = null;

    // Record navigation back to cabinet as a visibility change (like original implementation)
    if (testData?.id && user?.student_id) {
      const studentId = user?.student_id || user?.id || 'unknown';
      const cacheKey = `anti_cheating_${studentId}_word_matching_${testData.id}`;
      
      // Get current anti-cheating data
      const existingData = getCachedData(cacheKey) || { tabSwitches: 0, isCheating: false };
      const currentTabSwitches = existingData.tabSwitches || 0;
      
      // Increment tab switch count (navigation back to cabinet counts as a visibility change)
      const newTabSwitches = currentTabSwitches + 1;
      const newIsCheating = newTabSwitches >= 2; // 2+ switches = cheating
      
      console.log('🎯 WordMatchingStudent: Tab switch count:', currentTabSwitches, '->', newTabSwitches);
      
      // Save updated data to localStorage (same format as useAntiCheating hook)
      setCachedData(cacheKey, { 
        tabSwitches: newTabSwitches, 
        isCheating: newIsCheating 
      }, CACHE_TTL.anti_cheating);
    }

    // Disable intercept first
    console.log('🎯 WordMatchingStudent: Disabling intercept');
    setBackInterceptEnabled(false);
    
    // Clean up intercept history state
    if (pending) {
      console.log('🎯 WordMatchingStudent: Cleaning up intercept history state');
      try {
        const currentState = window.history.state;
        console.log('🎯 WordMatchingStudent: Current history state before cleanup:', currentState);
        if (currentState && currentState.__intercept) {
          const prevState = currentState.prevState ?? null;
          console.log('🎯 WordMatchingStudent: Restoring previous state:', prevState);
          window.history.replaceState(prevState, document.title, window.location.href);
          console.log('🎯 WordMatchingStudent: History state after cleanup:', window.history.state);
        }
      } catch (error) {
        console.warn('🎯 WordMatchingStudent: Failed to restore history state:', error);
      }
    }

    // Navigate to cabinet - use window.location.href like StudentTests does
    console.log('🎯 WordMatchingStudent: Scheduling navigation in 100ms');
    setTimeout(() => {
      console.log('🎯 WordMatchingStudent: Executing navigation to /student');
      console.log('🎯 WordMatchingStudent: Current location before navigation:', window.location.href);
      // Force full page navigation to bypass React Router history issues
      window.location.href = '/student';
      console.log('🎯 WordMatchingStudent: window.location.href set to /student');
    }, 100);
  }, [onBackToCabinet, testData, user?.student_id, user?.id]);

  const cancelBackToCabinet = useCallback(() => {
    const pending = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    if (pending?.cancel) {
      pending.cancel();
    }
    setShowBackModal(false);
  }, []);

  // Submit test
  const handleSubmitTest = useCallback(async () => {
    if (!displayData) return;
    
    setIsSubmitting(true);
    
    try {
      // Calculate score based on interaction type
      const totalPairs = displayData?.leftWords?.length || 0;
      let correctMatches = 0;
      let finalAnswers = {};
      
      if (testData.interaction_type === 'drag') {
        // Drag mode scoring
        Object.entries(studentAnswers).forEach(([leftDisplayIndex, rightDisplayIndex]) => {
          const expectedRightIndex = displayData?.correctPairs?.[leftDisplayIndex];
          if (rightDisplayIndex === expectedRightIndex) {
            correctMatches++;
          }
          finalAnswers[leftDisplayIndex] = rightDisplayIndex;
        });
      } else {
        // Arrow mode scoring
        studentArrows.forEach(arrow => {
          const leftIndex = arrow.startWord.side === 'left' ? arrow.startWord.index : arrow.endWord.index;
          const rightIndex = arrow.startWord.side === 'right' ? arrow.startWord.index : arrow.endWord.index;
          
          if (displayData?.correctPairs?.[leftIndex] === rightIndex) {
            correctMatches++;
          }
          finalAnswers[leftIndex] = rightIndex;
        });
      }
      
      const score = correctMatches;
      const maxScore = totalPairs;
      
      console.log(`🎯 Final Score: ${score}/${maxScore} (${Math.round((score/maxScore)*100)}%)`);
      
      // Calculate timing
      const endTime = new Date();
      const timeTaken = testStartTime ? Math.round((endTime - testStartTime) / 1000) : 0;
      const startedAt = testStartTime ? testStartTime.toISOString() : endTime.toISOString();
      
      // Get anti-cheating data
      const cheatingData = getCheatingData();
      
      // Prepare submission data
      const studentId = user.student_id;
      const retestAssignKey = `retest_assignment_id_${studentId}_word_matching_${testData.id}`;
      const retestAssignmentId = localStorage.getItem(retestAssignKey);
      // Get current academic period ID from academic calendar service
      const { academicCalendarService } = await import('../../services/AcademicCalendarService');
      await academicCalendarService.loadAcademicCalendar();
      const currentTerm = academicCalendarService.getCurrentTerm();
      const academic_period_id = currentTerm?.id;
      
      if (!academic_period_id) {
        throw new Error('No current academic period found');
      }

      const submissionData = {
        test_id: testData.id,
        test_name: testData.test_name,
        teacher_id: testData.teacher_id || null,
        subject_id: testData.subject_id || null,
        student_id: studentId,
        academic_period_id: academic_period_id,
        parent_test_id: testData.id,
        retest_assignment_id: retestAssignmentId ? Number(retestAssignmentId) : null,
        interaction_type: testData.interaction_type,
        answers: finalAnswers,
        score: score,
        maxScore: maxScore,
        time_taken: timeTaken,
        started_at: startedAt,
        submitted_at: endTime.toISOString(),
        caught_cheating: cheatingData.caught_cheating,
        visibility_change_times: cheatingData.visibility_change_times
      };
      
      console.log('🎯 Submission data being sent:', submissionData);
      console.log('🎯 TestData structure:', testData);
      
      // Submit test results
      console.log('🎯 Submitting test results...');
      const response = await makeAuthenticatedRequest('/.netlify/functions/submit-word-matching-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });
      console.log('🎯 Submission response received:', response.status);
      
      const result = await response.json();
      
      if (result.success) {
        showNotification('Test submitted successfully!', 'success');

        // Clear anti-cheating data
        stopTracking();
        clearData();

        // Clear test data from cache
        if (user?.student_id) {
          clearTestData(user.student_id, 'word_matching', testData.id);
        }

        // Check if this is a retest and handle retest_attempt keys
        const isRetest = !!retestAssignmentId;
        if (isRetest && user?.student_id) {
          // Get max attempts from active tests cache or default to 3
          let maxAttempts = 3;
          try {
            const activeTestsCache = localStorage.getItem(`student_active_tests_${user.student_id}`);
            if (activeTestsCache) {
              const activeTests = JSON.parse(activeTestsCache);
              const test = activeTests?.tests?.find(t =>
                t.test_id === testData.id && t.test_type === 'word_matching'
              );
              if (test) {
                maxAttempts = test.retest_attempts_left || test.max_attempts || 3;
              }
            }
          } catch (e) {
            console.error('Error checking active tests cache:', e);
          }

          // Calculate percentage from score and maxScore
          const percentage = score > 0 && maxScore > 0 ? (score / maxScore) * 100 : 0;
          const passed = percentage >= 50;

          if (passed) {
            // Student passed - mark last attempt
            const lastSlotKey = `retest_attempt${maxAttempts}_${user.student_id}_word_matching_${testData.id}`;
            localStorage.setItem(lastSlotKey, 'true');
            console.log('🎓 Passed retest, marking last-slot key:', lastSlotKey);

            // Count actual attempts used after marking this attempt
            let usedAttempts = 0;
            for (let i = 1; i <= 10; i++) {
              const key = `retest_attempt${i}_${user.student_id}_word_matching_${testData.id}`;
              if (localStorage.getItem(key) === 'true') {
                usedAttempts++;
              }
            }

            // Mark retest as completed (student passed)
            const completionKey = `test_completed_${user.student_id}_word_matching_${testData.id}`;
            localStorage.setItem(completionKey, 'true');
            console.log('🎓 Marked retest as completed (student passed):', completionKey);

            // Set retest_attempts metadata so button logic can check if attempts are exhausted
            const attemptsMetaKey = `retest_attempts_${user.student_id}_word_matching_${testData.id}`;
            localStorage.setItem(attemptsMetaKey, JSON.stringify({ used: usedAttempts, max: maxAttempts }));
            console.log('🎓 Set retest attempts metadata (student passed):', attemptsMetaKey, { used: usedAttempts, max: maxAttempts });
          } else {
            // Find the next attempt number
            let nextAttemptNumber = 1;
            for (let i = 1; i <= 10; i++) {
              const key = `retest_attempt${i}_${user.student_id}_word_matching_${testData.id}`;
              if (localStorage.getItem(key) !== 'true') {
                nextAttemptNumber = i;
                break;
              }
            }
            // Mark this specific attempt as completed
            const attemptKey = `retest_attempt${nextAttemptNumber}_${user.student_id}_word_matching_${testData.id}`;
            localStorage.setItem(attemptKey, 'true');
            console.log('🎓 Marked retest attempt as completed:', attemptKey);

            // Count actual attempts used after marking this attempt
            let usedAttempts = 0;
            for (let i = 1; i <= 10; i++) {
              const key = `retest_attempt${i}_${user.student_id}_word_matching_${testData.id}`;
              if (localStorage.getItem(key) === 'true') {
                usedAttempts++;
              }
            }

            // Mark retest as completed (attempts exhausted OR passed) - right after writing retest_attempt key
            const attemptsLeft = maxAttempts - usedAttempts;
            const shouldComplete = attemptsLeft <= 0 || passed;
            console.log('🎓 Retest completion check:', { usedAttempts, maxAttempts, attemptsLeft, passed, shouldComplete });
            if (shouldComplete) {
              const completionKey = `test_completed_${user.student_id}_word_matching_${testData.id}`;
              localStorage.setItem(completionKey, 'true');
              console.log('🎓 Marked retest as completed (attempts exhausted or passed):', completionKey);

              // Set retest_attempts metadata so button logic can check if attempts are exhausted
              const attemptsMetaKey = `retest_attempts_${user.student_id}_word_matching_${testData.id}`;
              localStorage.setItem(attemptsMetaKey, JSON.stringify({ used: usedAttempts, max: maxAttempts }));
              console.log('🎓 Set retest attempts metadata (attempts exhausted):', attemptsMetaKey, { used: usedAttempts, max: maxAttempts });
            }
          }
        } else {
          // Regular test - mark as completed
          if (user?.student_id) {
            const completionKey = `test_completed_${user.student_id}_word_matching_${testData.id}`;
            localStorage.setItem(completionKey, 'true');
            console.log('✅ Test marked as completed in localStorage:', completionKey);
          }
        }

        // Cache the test results immediately after successful submission (following other tests pattern)
        if (user?.student_id) {
          const cacheKey = `student_results_table_${user.student_id}`;
          setCachedData(cacheKey, result, CACHE_TTL.student_results_table);
          console.log('🎓 Test results cached with key:', cacheKey);
        }

        // Clear retest keys after successful submission
        if (user?.student_id) {
          const retestKey = `retest1_${studentId}_word_matching_${testData.id}`;
          localStorage.removeItem(retestKey);
          localStorage.removeItem(retestAssignKey);
        }
        
        // Clear timer cache after successful submission
        if (timerKeyRef.current) {
          localStorage.removeItem(timerKeyRef.current);
        }
        
        // Navigate back to student cabinet with score and cheating data
        if (onTestComplete) {
          setBackInterceptEnabled(false);
          onTestComplete({
            score,
            caught_cheating: cheatingData.caught_cheating,
            visibility_change_times: cheatingData.visibility_change_times
          });
        }
        // Stop loading spinner after results are shown
        setIsSubmitting(false);
      } else {
        throw new Error(result.message || 'Failed to submit test');
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      setIsSubmitting(false);
    }
  }, [displayData, studentAnswers, studentArrows, testData, user, testStartTime, getCheatingData, stopTracking, clearData, makeAuthenticatedRequest, onTestComplete]);

  // Test timer effect with persistence (must be after handleSubmitTest is defined)
  useEffect(() => {
    if (!displayData || !testData || !testStartTime) return;
    const allowedSeconds = Number(testData?.allowed_time || 0);
    if (!allowedSeconds) return;
    
    console.log('⏱️ Timer effect triggered:', { allowedSeconds, timeRemaining, initialized: timerInitializedRef.current, testData: testData?.id });
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        // If prev is 0, use allowedSeconds as fallback (initialization might not have completed)
        const current = prev > 0 ? prev : allowedSeconds;
        if (current <= 0) {
          return 0;
        }
        const next = Math.max(0, current - 1);
        try {
          const now = Date.now();
          if (!lastTickRef.current) lastTickRef.current = now;
          if (timerKeyRef.current) {
            localStorage.setItem(timerKeyRef.current, JSON.stringify({
              remainingSeconds: next,
              lastTickAt: new Date(now).toISOString(),
              startedAt: testStartTime ? testStartTime.toISOString() : new Date(now - (allowedSeconds - next) * 1000).toISOString()
            }));
          }
        } catch {}
        if (next === 0) {
          handleSubmitTest();
        }
        return next;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [displayData, testData?.allowed_time, testStartTime, handleSubmitTest]);

  if (!displayData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto p-6"
    >
      {/* Submit Spinner Modal */}
      <PerfectModal
        isOpen={isSubmitting}
        onClose={() => {}}
        title="Submitting"
        size="small"
      >
        <div className="flex flex-col items-center justify-center py-4">
          <LoadingSpinner size="lg" className="mb-3" />
          <p className="text-blue-600 font-semibold text-lg">Submitting test...</p>
          <p className="text-gray-500 text-sm mt-1">Please wait while we process your results</p>
        </div>
      </PerfectModal>
      {/* Top-right Back button above header */}
      <div className="flex justify-end mb-2">
        <Button
          onClick={handleBackToCabinet}
          variant="outline"
          size="sm"
          disabled={isSubmitting}
        >
          Back to Cabinet
        </Button>
      </div>
        {/* Test Header */}
        <div 
          className={`rounded-lg border-2 p-6 mb-6 ${
            isCyberpunk 
              ? getCyberpunkCardBg(1).className
              : `${themeClasses.cardBg} ${themeClasses.cardBorder}`
          }`}
          style={isCyberpunk ? {
            ...getCyberpunkCardBg(1).style,
            ...themeStyles.glow,
            boxShadow: `${themeStyles.glow.boxShadow}, inset 0 0 20px ${colorToRgba(CYBERPUNK_COLORS.cyan, 0.1)}`
          } : {}}
        >
          <div className="text-left mb-4">
                 <h2 
                   className={`text-2xl font-bold ${
                     isCyberpunk ? 'tracking-wider' : themeClasses.text
                   } mb-2`}
                   style={isCyberpunk ? {
                     ...themeStyles.textCyan,
                     fontFamily: 'monospace'
                   } : {}}
                 >
              {isCyberpunk
                ? testData.test_name.toUpperCase()
                : testData.test_name}
            </h2>
            <p 
              className={`${
                isCyberpunk
                  ? 'text-yellow-400 tracking-wider'
                  : themeClasses.textSecondary
              }`}
              style={isCyberpunk ? { 
                fontFamily: 'monospace',
                textShadow: '0 0 5px rgba(255, 215, 0, 0.5)'
              } : {}}
            >
              {isCyberpunk
                ? (testData.interaction_type === 'drag' 
                    ? 'DRAG WORDS FROM LEFT TO RIGHT TO MATCH THEM' 
                    : 'CLICK ON THE WORD OR PHRASE ON THE LEFT, THEN CLICK ON THE MATCHING WORD OR PHRASE ON THE RIGHT TO CONNECT THEM')
                : (testData.interaction_type === 'drag' 
                    ? 'Drag words from left to right to match them' 
                    : 'Click on the word or phrase on the left, then click on the matching word or phrase on the right to connect them')}
            </p>
          </div>
        
        {/* Progress Tracker with Timer */}
        {testData && (
          <div className="mb-4">
            <ProgressTracker
              answeredCount={Object.keys(studentAnswers).length + (testData.interaction_type === 'arrow' ? studentArrows.length : 0)}
              totalQuestions={displayData?.leftWords?.length || 0}
              timeElapsed={(() => {
                const allowedSeconds = Number(testData?.allowed_time || 0);
                if (allowedSeconds <= 0) return 0;
                // Use timeRemaining if it's been initialized (> 0), otherwise use allowedSeconds
                return timeRemaining > 0 ? timeRemaining : allowedSeconds;
              })()}
              themeClasses={themeClasses}
              isCyberpunk={isCyberpunk}
            />
          </div>
        )}
      </div>

      {/* Test Content */}
      {testData.interaction_type === 'drag' ? (
        // Drag Mode with Konva
        <Card className={`mb-6 ${isCyberpunk ? getCyberpunkCardBg(0).className : ''}`}
        style={isCyberpunk ? {
          ...getCyberpunkCardBg(0).style,
          ...themeStyles.glow
        } : {}}>
          <div 
            ref={containerRef}
            className="relative w-full"
          >
            <Stage 
              width={canvasWidth} 
              height={canvasHeight}
              className={`border-2 rounded-lg ${isSubmitting ? 'pointer-events-none opacity-50' : ''} ${
                isCyberpunk ? 'border-cyan-400' : 'border-gray-200'
              }`}
              style={isCyberpunk ? {
                borderColor: CYBERPUNK_COLORS.cyan,
                backgroundColor: CYBERPUNK_COLORS.black
              } : {}}
            >
              <Layer>
                {/* Left Words - Draggable */}
                {displayData.leftWords.map((word, index) => {
                  const isDragged = studentAnswers[index] !== undefined;
                  const dynamicHeight = calculateBlockHeight(word, FONT_SIZES.LEFT_WORD, actualBlockWidth);
                  const position = blockPositions[index];
                  const y = position ? position.y : blockStartY + index * blockSpacing;
                  
                  return (
                    <Group
                      key={`left-${index}`}
                      x={leftBlockX}
                      y={y}
                      draggable={!isDragged}
                      onDragStart={(e) => {
                        // Bring to front when dragging starts
                        e.target.moveToTop();
                      }}
                      onDragEnd={(e) => {
                        const stage = e.target.getStage();
                        const rightWords = displayData.rightWords;
                        const rightWordWidth = actualBlockWidth + 60; // Responsive drop zone width
                        const rightStartX = rightBlockX - 30; // Responsive drop zone position (already calculated from right edge)
                        
                        console.log('🎯 Drop detection - Word dropped at:', e.target.x(), e.target.y());
                        
                        // Check if dropped on any right word
                        for (let rightIndex = 0; rightIndex < rightWords.length; rightIndex++) {
                          const rightWord = rightWords[rightIndex];
                          const rightPosition = blockPositions[rightIndex];
                          // Use the exact same Y position calculation as the block rendering
                          const rightY = rightPosition ? rightPosition.y : blockStartY + rightIndex * blockSpacing;
                          // Calculate dynamic height exactly like the block rendering does
                          const rightWordDynamicHeight = calculateBlockHeight(rightWord, FONT_SIZES.ORIGINAL_WORD, actualBlockWidth);
                          const dropZoneLeft = rightStartX;
                          const dropZoneRight = rightStartX + rightWordWidth;
                          const dropZoneTop = rightY;
                          const dropZoneBottom = rightY + rightWordDynamicHeight;
                          
                          console.log(`🎯 Checking drop zone ${rightIndex}:`, {
                            left: dropZoneLeft,
                            right: dropZoneRight,
                            top: dropZoneTop,
                            bottom: dropZoneBottom,
                            word: rightWords[rightIndex]
                          });
                          
                          if (
                            e.target.x() >= dropZoneLeft &&
                            e.target.x() <= dropZoneRight &&
                            e.target.y() >= dropZoneTop &&
                            e.target.y() <= dropZoneBottom
                          ) {
                            // Check if this dropzone is already occupied by another word
                            const isOccupied = Object.entries(studentAnswers).some(
                              ([occupiedLeftIndexStr, occupiedRightIndex]) => 
                                occupiedRightIndex === rightIndex && 
                                parseInt(occupiedLeftIndexStr) !== index
                            );
                            
                            if (isOccupied) {
                              // Dropzone is already occupied, don't place it
                              console.log(`⚠️ Dropzone ${rightIndex} is already occupied, resetting position`);
                              e.target.position({ x: leftBlockX, y: y });
                              return; // Exit early, don't place the word
                            }
                            
                            // Match found and dropzone is free!
                            console.log(`✅ Match found! Word "${displayData.leftWords[index]}" matched with "${rightWords[rightIndex]}"`);
                            setStudentAnswers(prev => ({
                              ...prev,
                              [index]: rightIndex
                            }));
                            break;
                          }
                        }
                        
                        // Reset position if not dropped on target
                        console.log('❌ No match found, resetting position');
                        e.target.position({ x: leftBlockX, y: y });
                      }}
                    >
                      <Rect
                        width={actualBlockWidth}
                        height={dynamicHeight}
                        fill={isDragged ? '#e5e7eb' : '#3b82f6'}
                        stroke={isDragged ? '#9ca3af' : '#1d4ed8'}
                        strokeWidth={2}
                        cornerRadius={8}
                        opacity={isDragged ? 0.5 : 1}
                      />
                      <Text
                        text={word}
                        x={actualBlockWidth / 2} // Center horizontally
                        y={dynamicHeight / 2} // Center vertically
                        fontSize={FONT_SIZES.LEFT_WORD}
                        fontFamily="Arial"
                        fill={isDragged ? '#dc2626' : 'white'} // Red color when dragged
                        align="center"
                        verticalAlign="middle"
                        width={actualBlockWidth}
                        offsetX={actualBlockWidth / 2} // Center horizontally
                        offsetY={dynamicHeight / 2} // Center vertically
                        wrap="word"
                        ellipsis={true}
                        listening={false}
                      />
                    </Group>
                  );
                })}
                
                {/* Right Words - Drop Targets */}
                {displayData.rightWords.map((word, index) => {
                  const dynamicHeight = calculateBlockHeight(word, FONT_SIZES.ORIGINAL_WORD, actualBlockWidth);
                  const position = blockPositions[index];
                  const y = position ? position.y : blockStartY + index * blockSpacing;
                  const matchedLeftIndex = Object.keys(studentAnswers).find(
                    leftIndex => studentAnswers[leftIndex] === index
                  );
                  
                  return (
                    <Group key={`right-${index}`} x={rightBlockX} y={y}>
                      <Rect
                        width={actualBlockWidth}
                        height={dynamicHeight}
                        fill={matchedLeftIndex ? '#10b981' : '#f3f4f6'}
                        stroke={matchedLeftIndex ? '#059669' : '#d1d5db'}
                        strokeWidth={2}
                        cornerRadius={8}
                      />
                      <Text
                        text={word}
                        x={actualBlockWidth / 2} // Center horizontally
                        y={dynamicHeight / 2} // Center vertically
                        fontSize={FONT_SIZES.ORIGINAL_WORD} // Responsive font size
                        fontFamily="Arial"
                        fill="#000000" // Always black for right block words
                        align="center"
                        verticalAlign="middle"
                        width={actualBlockWidth}
                        offsetX={actualBlockWidth / 2} // Center horizontally
                        offsetY={dynamicHeight / 2} // Center vertically
                        wrap="word"
                        ellipsis={true}
                        listening={false}
                      />
                      {/* Show matched word if any */}
                      {matchedLeftIndex && (
                        <Text
                          text={displayData.leftWords[matchedLeftIndex]}
                          x={actualBlockWidth / 2} // Center horizontally
                          y={dynamicHeight - 5} // Positioned at bottom with 2px padding from edge
                          fontSize={FONT_SIZES.DRAGGED_WORD} // Responsive font size
                          fontFamily="Arial"
                          fill="#dc2626" // Red for dragged word
                          align="center"
                          verticalAlign="middle"
                          width={actualBlockWidth}
                          offsetX={actualBlockWidth / 2} // Center horizontally
                          offsetY={FONT_SIZES.DRAGGED_WORD / 2} // Center the text vertically at this position
                          wrap="word"
                          ellipsis={true}
                        />
                      )}
                    </Group>
                  );
                })}
                
              </Layer>
            </Stage>
          </div>
        </Card>
      ) : (
        // Arrow Mode with Konva
        <Card className={`mb-6 ${isCyberpunk ? getCyberpunkCardBg(0).className : ''}`}
        style={isCyberpunk ? {
          ...getCyberpunkCardBg(0).style,
          ...themeStyles.glow
        } : {}}>
          <div 
            ref={containerRef}
            className="relative w-full"
          >
            <Stage 
              width={canvasWidth} 
              height={canvasHeight}
              className={`border-2 rounded-lg ${isSubmitting ? 'pointer-events-none opacity-50' : ''} ${
                isCyberpunk ? 'border-cyan-400' : 'border-gray-200'
              }`}
              style={isCyberpunk ? {
                borderColor: CYBERPUNK_COLORS.cyan,
                backgroundColor: CYBERPUNK_COLORS.black
              } : {}}
            >
              <Layer>
                {/* Left Words - Clickable */}
                {displayData?.leftWords?.map((word, index) => {
                  const dynamicHeight = calculateBlockHeight(word, FONT_SIZES.LEFT_WORD, actualBlockWidth);
                  const position = blockPositions[index];
                  const y = position ? position.y : blockStartY + index * blockSpacing;
                  const isSelected = selectedWord?.side === 'left' && selectedWord?.index === index;
                  
                  return (
                    <Group
                      key={`left-${index}`}
                      x={leftBlockX}
                      y={y}
                      onClick={() => handleWordClick('left', index)}
                    >
                      <Rect
                        width={actualBlockWidth}
                        height={dynamicHeight}
                        fill={isSelected ? '#3b82f6' : '#f3f4f6'}
                        stroke={isSelected ? '#1d4ed8' : '#d1d5db'}
                        strokeWidth={isSelected ? 3 : 2}
                        cornerRadius={8}
                      />
                      <Text
                        text={word}
                        x={actualBlockWidth / 2} // Center horizontally
                        y={dynamicHeight / 2} // Center vertically
                        fontSize={FONT_SIZES.LEFT_WORD} // Responsive font size
                        fontFamily="Arial"
                        fill={isSelected ? 'white' : '#374151'}
                        align="center"
                        verticalAlign="middle"
                        width={actualBlockWidth}
                        offsetX={actualBlockWidth / 2} // Center horizontally
                        offsetY={dynamicHeight / 2} // Center vertically
                        wrap="word"
                        ellipsis={true}
                        listening={false}
                      />
                    </Group>
                  );
                })}
                
                {/* Right Words - Clickable */}
                {displayData?.rightWords?.map((word, index) => {
                  const dynamicHeight = calculateBlockHeight(word, FONT_SIZES.ORIGINAL_WORD, actualBlockWidth);
                  const position = blockPositions[index];
                  const y = position ? position.y : blockStartY + index * blockSpacing;
                  const isSelected = selectedWord?.side === 'right' && selectedWord?.index === index;
                  
                  return (
                    <Group
                      key={`right-${index}`}
                      x={rightBlockX}
                      y={y}
                      onClick={() => handleWordClick('right', index)}
                    >
                      <Rect
                        width={actualBlockWidth}
                        height={dynamicHeight}
                        fill={isSelected ? '#3b82f6' : '#f3f4f6'}
                        stroke={isSelected ? '#1d4ed8' : '#d1d5db'}
                        strokeWidth={isSelected ? 3 : 2}
                        cornerRadius={8}
                      />
                      <Text
                        text={word}
                        x={actualBlockWidth / 2} // Center horizontally
                        y={dynamicHeight / 2} // Center vertically
                        fontSize={FONT_SIZES.ORIGINAL_WORD} // Responsive font size
                        fontFamily="Arial"
                        fill="#000000" // Always black for right block words
                        align="center"
                        verticalAlign="middle"
                        width={actualBlockWidth}
                        offsetX={actualBlockWidth / 2} // Center horizontally
                        offsetY={dynamicHeight / 2} // Center vertically
                        wrap="word"
                        ellipsis={true}
                        listening={false}
                      />
                    </Group>
                  );
                })}
                
                {/* Draw arrows between selected words */}
                {studentArrows.map((arrow, arrowIndex) => {
                  const leftWord = displayData?.leftWords?.[arrow.startWord.index];
                  const rightWord = displayData?.rightWords?.[arrow.endWord.index];
                  const leftHeight = calculateBlockHeight(leftWord, FONT_SIZES.LEFT_WORD, actualBlockWidth);
                  const rightHeight = calculateBlockHeight(rightWord, FONT_SIZES.ORIGINAL_WORD, actualBlockWidth);
                  
                  const startPosition = blockPositions[arrow.startWord.index];
                  const endPosition = blockPositions[arrow.endWord.index];
                  
                  const startY = startPosition ? startPosition.y + leftHeight / 2 : blockStartY + arrow.startWord.index * blockSpacing + leftHeight / 2;
                  const endY = endPosition ? endPosition.y + rightHeight / 2 : blockStartY + arrow.endWord.index * blockSpacing + rightHeight / 2;
                  
                  return (
                    <Line
                      key={arrowIndex}
                      points={[leftBlockX + actualBlockWidth + 20, startY, rightBlockX - 20, endY]} // Responsive arrow positioning
                      stroke={arrow.color || '#3b82f6'}
                      strokeWidth={STROKE_WIDTH} // Responsive stroke width
                      lineCap="round"
                      lineJoin="round"
                    />
                  );
                })}
                
              </Layer>
            </Stage>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <Card className={isCyberpunk ? getCyberpunkCardBg(1).className : ''}
      style={isCyberpunk ? {
        ...getCyberpunkCardBg(1).style,
        ...themeStyles.glow
      } : {}}>
        <div className={`submit-section flex justify-center space-x-4 ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}>
          <Button
            onClick={handleReset}
            variant="outline"
            disabled={isSubmitting}
          >
            Reset
          </Button>
          <Button
            onClick={() => setShowSubmitModal(true)}
            disabled={isSubmitting}
            className={`px-8 ${isCyberpunk ? '' : ''}`}
            style={isCyberpunk ? {
              backgroundColor: CYBERPUNK_COLORS.black,
              borderColor: CYBERPUNK_COLORS.cyan,
              color: CYBERPUNK_COLORS.cyan,
              fontFamily: 'monospace',
              borderWidth: '2px',
              ...themeStyles.glow
            } : {}}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" color={isCyberpunk ? CYBERPUNK_COLORS.cyan : "white"} className="mr-2" />
                {isCyberpunk ? 'SUBMITTING...' : 'Submitting...'}
              </>
            ) : (
              isCyberpunk ? 'SUBMIT TEST' : 'Submit Test'
            )}
          </Button>
        </div>
      </Card>

      {/* Reset Confirmation Modal */}
      <PerfectModal
        isOpen={showResetModal && !isSubmitting}
        onClose={() => setShowResetModal(false)}
        title="Reset Test"
        size="small"
      >
        <div className="text-center">
          <p className="text-gray-600 mb-6">
            Are you sure you want to reset? This will clear all your progress and answers.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => setShowResetModal(false)}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmReset}
              variant="primary"
            >
              Reset
            </Button>
          </div>
        </div>
      </PerfectModal>

      {/* Back to Cabinet Confirmation Modal */}
      <PerfectModal
        isOpen={showBackModal}
        onClose={cancelBackToCabinet}
        title="Exit Test"
        size="small"
      >
        <div className="text-center">
          <p className="text-gray-600 mb-6">
            Are you sure you want to leave the test? Your progress will be saved.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={cancelBackToCabinet}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={(e) => {
                console.log('🎯 WordMatchingStudent: Leave button clicked in modal');
                console.log('🎯 WordMatchingStudent: Button click event:', e);
                confirmBackToCabinet();
              }}
              variant="primary"
            >
              Leave
            </Button>
          </div>
        </div>
      </PerfectModal>

      {/* Submit Confirmation Modal */}
      <PerfectModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Test"
        size="small"
      >
        <div className="text-center">
          <p className="text-gray-600 mb-6">
            Are you sure you want to submit?
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => setShowSubmitModal(false)}
              variant="secondary"
            >
              Cancel
            </Button>
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
    </motion.div>
  );
};

export default WordMatchingStudent;

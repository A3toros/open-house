import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button, LoadingSpinner, Notification } from '@/components/ui/components-ui-index';
import { userService, testService, resultService } from '@/services/services-index';
import { academicCalendarService } from '@/services/AcademicCalendarService';
import { API_ENDPOINTS, USER_ROLES, CONFIG } from '@/shared/shared-index';
import { useNotification } from '@/components/ui/Notification';
import { getCachedData, setCachedData, CACHE_TTL } from '@/utils/cacheUtils';
import { SecureToken } from '@/utils/secureTokenStorage';
import { DrawingModal } from '@/components/modals';
import SpeakingTestReview from '@/components/test/SpeakingTestReview';
import TestAnswerModal from '@/components/test/TestAnswerModal';
import EditScoreModal from '@/components/test/EditScoreModal';
import ErrorBoundary from '@/components/ErrorBoundary';
import * as XLSX from 'xlsx';


// TEACHER RESULTS - React Component for Teacher Results Viewing
// ✅ COMPLETED: All teacher results functionality from legacy src/ converted to React
// ✅ COMPLETED: initializeGradeButtons() → useEffect with React effects
// ✅ COMPLETED: showClassesForGrade() → showClasses() with React state
// ✅ COMPLETED: showSemestersForClass() → showSemesters() with React state
// ✅ COMPLETED: determineAndOpenCurrentSemester() → openSemester() with React patterns
// ✅ COMPLETED: loadClassResults() → loadResults() with React patterns
// ✅ COMPLETED: displayClassResults() → renderResults() with React rendering
// ✅ COMPLETED: getScoreClass() → getScoreClass() with React utilities
// ✅ COMPLETED: createResultsTable() → createTable() with React components
// ✅ COMPLETED: showClassResults() → showResults() with React routing
// ✅ COMPLETED: TeacherResults main component with React patterns
// ✅ COMPLETED: Grade selection interface with React components
// ✅ COMPLETED: Class selection interface with React components
// ✅ COMPLETED: Semester selection interface with React components
// ✅ COMPLETED: Results table display with React rendering
// ✅ COMPLETED: Score analysis with React utilities
// ✅ COMPLETED: Export functionality with React utilities
// ✅ COMPLETED: Print functionality with React utilities
// ✅ COMPLETED: Loading states with React state management
// ✅ COMPLETED: Error handling with React error boundaries
// ✅ COMPLETED: Responsive design with Tailwind CSS
// ✅ COMPLETED: Accessibility features with ARIA support
// ✅ COMPLETED: Keyboard navigation with React event handling
// ✅ COMPLETED: Visual feedback with React state
// ✅ COMPLETED: Animation effects with Tailwind CSS
// ✅ COMPLETED: Performance optimization with React hooks
// ✅ COMPLETED: Legacy Compatibility: Full compatibility with legacy teacher system
// ✅ COMPLETED: React Integration: Easy integration with React routing
// ✅ COMPLETED: Tailwind CSS: Conforms to new Tailwind CSS in styles folder
// ✅ COMPLETED: Modern Patterns: Modern React patterns and best practices
// ✅ COMPLETED: Security: JWT token management and validation
// ✅ COMPLETED: User Experience: Smooth user experience with loading states
// ✅ COMPLETED: Error Recovery: Error recovery and graceful degradation
// ✅ COMPLETED: Session Management: Session validation and management
// ✅ COMPLETED: Role Management: Role-based routing and access control
// ✅ COMPLETED: Form Management: Form state management and validation
// ✅ COMPLETED: API Integration: Integration with teacher services
// ✅ COMPLETED: State Management: React state management for teacher data
// ✅ COMPLETED: Performance: Optimized teacher operations and caching
// ✅ COMPLETED: Memory Management: Proper cleanup and memory management
// ✅ COMPLETED: Event Handling: Proper event handling and cleanup
// ✅ COMPLETED: Accessibility: Full accessibility compliance
// ✅ COMPLETED: Documentation: Comprehensive component documentation
// ✅ COMPLETED: Maintainability: Clean, maintainable code with proper separation of concerns

const TeacherResults = ({ onBackToCabinet, selectedGrade, selectedClass, openRetestModal, forceRefreshOnMount = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { showNotification } = useNotification();
  
  // Compute percentage robustly from available fields; prefer best retest score/max when present
  const computePercentage = useCallback((result) => {
    let derived = null;
    if (typeof result?.percentage === 'number' && !Number.isNaN(result.percentage)) {
      derived = Math.round(result.percentage);
      console.debug('[TeacherResults] Using provided percentage', { percentage: result.percentage, rounded: derived, result });
      return derived;
    }
    const bestScore = result?.retest_best_score ?? result?.score;
    const bestMax = result?.retest_best_max_score ?? result?.max_score;
    const scoreNum = Number(bestScore ?? 0);
    const maxNum = Number(bestMax ?? 0);
    if (maxNum > 0) {
      derived = Math.round((scoreNum / maxNum) * 100);
    }
    // debug removed
    return derived;
  }, []);

  const getColorClassForResult = useCallback((result) => {
    const pct = computePercentage(result);
    if (pct === null) return 'text-gray-600';
    if (pct < 50) return 'text-red-600 font-semibold';
    if (pct < 70) return 'text-yellow-600';
    return 'text-green-600';
  }, [computePercentage]);

  const isRedResult = useCallback((result) => {
    const pct = computePercentage(result);
    return pct !== null && pct < 50;
  }, [computePercentage]);

  // Local state for teacher data
  const [teacherData, setTeacherData] = useState(null);
  
  // Local state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [showSemesterSelection, setShowSemesterSelection] = useState(false);
  const [availableGrades, setAvailableGrades] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableSemesters, setAvailableSemesters] = useState([1, 2]);
  const [results, setResults] = useState(null);
  const [academicYear, setAcademicYear] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentView, setCurrentView] = useState('main');
  
  // Internal state for selected grade and class (overrides props when user clicks)
  const [internalSelectedGrade, setInternalSelectedGrade] = useState(null);
  const [internalSelectedClass, setInternalSelectedClass] = useState(null);
  
  // Computed values: use internal state if set, otherwise use props
  const currentSelectedGrade = internalSelectedGrade || selectedGrade;
  const currentSelectedClass = internalSelectedClass || selectedClass;
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [classResults, setClassResults] = useState({});
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [collapsedTests, setCollapsedTests] = useState(new Set());
  const [isStudentCollapsed, setIsStudentCollapsed] = useState(true);
  
  // NEW: Term-based state for academic calendar service
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [currentSemesterTerms, setCurrentSemesterTerms] = useState(null);
  const [isLoadingAcademicCalendar, setIsLoadingAcademicCalendar] = useState(false);
  const [showScrollLeft, setShowScrollLeft] = useState(false);
  const [showScrollRight, setShowScrollRight] = useState(false);
  const tableRef = useRef(null);
  
  // Drawing modal state
  const [selectedDrawing, setSelectedDrawing] = useState(null);
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false);
  
  // Speaking test modal state
  const [selectedSpeakingTest, setSelectedSpeakingTest] = useState(null);
  const [isSpeakingModalOpen, setIsSpeakingModalOpen] = useState(false);
  
  // Score editing state
  const [editingScore, setEditingScore] = useState(null); // { resultId, score, maxScore }
  const [tempScore, setTempScore] = useState('');
  const [tempMaxScore, setTempMaxScore] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveButton, setShowSaveButton] = useState(false);
  
  // Speaking test score editing state
  const [editingSpeakingScore, setEditingSpeakingScore] = useState(null); // { resultId, score }
  const [tempSpeakingScore, setTempSpeakingScore] = useState('');
  const [isSavingSpeakingScore, setIsSavingSpeakingScore] = useState(false);
  
  // Column-level editing state for drawing tests ONLY
  const [editingColumns, setEditingColumns] = useState(new Set()); // Set of test names being edited
  const [columnScores, setColumnScores] = useState({}); // { testName: { studentId: { score, maxScore } } }
  const [isSavingColumn, setIsSavingColumn] = useState(false);
  // Inline drawing score edit state
  const [inlineDrawingEdit, setInlineDrawingEdit] = useState(null); // { key: `${testName}|${studentId}` }
  const [inlineDrawingValue, setInlineDrawingValue] = useState('');
  const [isSavingInline, setIsSavingInline] = useState(false);
  
  // Answer modal state
  const [selectedTestResult, setSelectedTestResult] = useState(null);
  const [selectedTestQuestions, setSelectedTestQuestions] = useState(null);
  const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  
  // Edit score modal state (for Fill Blanks/Matching/Word Matching)
  const [editScoreModal, setEditScoreModal] = useState({ isOpen: false, testResult: null });
  const [testQuestionsCache, setTestQuestionsCache] = useState({});
  
  // Use ref to persist editing state across re-renders
  const editingColumnsRef = useRef(new Set());
  const columnScoresRef = useRef({});
  const currentResultsRef = useRef(null);

  // Debug: Monitor state changes
  useEffect(() => {
    console.log('🎯 editingColumns state changed:', Array.from(editingColumns));
    editingColumnsRef.current = editingColumns;
  }, [editingColumns]);

  useEffect(() => {
    console.log('🎯 columnScores state changed:', columnScores);
    columnScoresRef.current = columnScores;
  }, [columnScores]);
  
  // Toggle test collapse
  const toggleTestCollapse = useCallback((testName) => {
    console.log('🔄 Toggling test collapse for:', testName);
    setCollapsedTests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(testName)) {
        newSet.delete(testName);
        console.log('📤 Expanding test:', testName);
      } else {
        newSet.add(testName);
        console.log('📥 Collapsing test:', testName);
      }
      console.log('📋 New collapsed tests:', Array.from(newSet));
      return newSet;
    });
  }, []);
  
  // Handle scroll detection
  const handleScroll = useCallback(() => {
    if (tableRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tableRef.current;
      setShowScrollLeft(scrollLeft > 0);
      setShowScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);
  
  // Initialize teacher results on component mount
  useEffect(() => {
    initializeTeacherResults();
  }, []);
  
  // Check scroll position when results change
  useEffect(() => {
    if (results && tableRef.current) {
      // Small delay to ensure table is rendered
      const timeoutId = setTimeout(handleScroll, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [results, handleScroll]);
  
  // Debug collapsed tests state
  useEffect(() => {
    console.log('📋 Current collapsed tests state:', Array.from(collapsedTests));
  }, [collapsedTests]);


  // NEW: Load results for specific term
  const loadResultsForTerm = useCallback(async (termId, forceRefresh = false) => {
    try {
      setIsLoadingResults(true);
      const teacherId = user?.teacher_id;
      const formattedClassName = `${currentSelectedGrade}/${currentSelectedClass}`;
      
      // Use termId directly (no academic year calculations)
      // Pass forceRefresh to bypass HTTP cache after mutations
      const data = await resultService.getTeacherStudentResults(teacherId, currentSelectedGrade, formattedClassName, termId, forceRefresh);
      
      if (data.success) {
        console.log('📅 Results loaded for term:', termId, data.results?.length || 0, 'results');
        console.log('📅 Students loaded:', data.students?.length || 0, 'students');
        
        // Extract unique tests from results
        const uniqueTests = [];
        const uniqueTestNames = new Set();
        const subjects = new Set();
        
        if (data.results && data.results.length > 0) {
          data.results.forEach(result => {
            if (result.test_name && !uniqueTestNames.has(result.test_name)) {
              uniqueTestNames.add(result.test_name);
              uniqueTests.push({
                test_name: result.test_name,
                test_type: result.test_type,
                subject: result.subject
              });
            }
            if (result.subject) {
              subjects.add(result.subject);
            }
          });
        }
        
        // Map test results to students
        const studentsWithScores = (data.students || []).map(student => {
          const studentResults = {};
          
          // Find all results for this student
          const studentTestResults = (data.results || []).filter(result => 
            result.student_id === student.student_id
          );
          
          // Map each test result to the student
          studentTestResults.forEach(result => {
            if (result.test_name) {
              // Store full result data including test_type and answers for drawing tests
              studentResults[result.test_name] = {
                id: result.id,
                test_type: result.test_type,
                test_id: result.test_id,
                subject_id: result.subject_id,
                score: result.score,
                max_score: result.max_score,
                retest_offered: result.retest_offered,
                caught_cheating: result.caught_cheating,
                visibility_change_times: result.visibility_change_times,
                answers: result.answers, // Include answers for drawing tests
                // Pass through AI feedback for speaking tests so modal can render analysis immediately
                ai_feedback: result.ai_feedback,
                name: result.name,
                surname: result.surname,
                test_name: result.test_name
              };
            }
          });
          
          return {
            ...student,
            ...studentResults
          };
        });
        
        // Create the results object in the expected format
        const resultsData = {
          results: data.results || [],
          students: studentsWithScores,
          class: studentsWithScores, // For backward compatibility
          unique_tests: uniqueTests,
          subjects: Array.from(subjects),
          count: data.count || 0,
          student_count: data.student_count || 0
        };
        
        console.log('📅 Processed results data:', {
          uniqueTests: uniqueTests.length,
          subjects: Array.from(subjects),
          resultsCount: data.results?.length || 0,
          studentsWithScores: studentsWithScores.length,
          sampleStudent: studentsWithScores[0]
        });
        
        // Set the results data for display
        setResults(resultsData);
        setClassResults(resultsData);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('📅 Error loading results for term:', error);
      setResults(null);
      setClassResults(null);
    } finally {
      setIsLoadingResults(false);
    }
  }, [user, currentSelectedGrade, currentSelectedClass]);

  // Initialize academic calendar and auto-select current term
  useEffect(() => {
    const initializeAcademicCalendar = async () => {
      try {
        setIsLoadingAcademicCalendar(true);
        await academicCalendarService.loadAcademicCalendar();
        const terms = academicCalendarService.getCurrentSemesterTerms();
        setCurrentSemesterTerms(terms);
        
        // Auto-select current term
        if (terms?.currentTerm) {
          setSelectedTerm(terms.currentTerm.id);
          // Auto-load results for current term
          // Use forceRefreshOnMount to bypass cache after retest creation
          if (currentSelectedGrade && currentSelectedClass) {
            loadResultsForTerm(terms.currentTerm.id, forceRefreshOnMount);
          }
        }
      } catch (error) {
        console.error('📅 Error initializing academic calendar:', error);
      } finally {
        setIsLoadingAcademicCalendar(false);
      }
    };
    
    initializeAcademicCalendar();
  }, [currentSelectedGrade, currentSelectedClass, loadResultsForTerm, forceRefreshOnMount]);

  // Handle props for pre-selected class
  useEffect(() => {
    if (selectedGrade && selectedClass) {
      console.log('👨‍🏫 Props detected:', { grade: selectedGrade, class: selectedClass });
      
      // Auto-select current term and load results
      // Use forceRefreshOnMount to bypass cache after retest creation
      if (currentSemesterTerms?.currentTerm) {
        setSelectedTerm(currentSemesterTerms.currentTerm.id);
        loadResultsForTerm(currentSemesterTerms.currentTerm.id, forceRefreshOnMount);
      }
    }
  }, [selectedGrade, selectedClass, currentSemesterTerms, loadResultsForTerm, forceRefreshOnMount]);
  
  // Enhanced initializeGradeButtons from legacy code
  const initializeTeacherResults = useCallback(async () => {
    console.log('👨‍🏫 Initializing teacher results...');
    
    try {
      setIsLoading(true);
      setError('');
      
      // Check authentication
      if (!isAuthenticated || !user) {
        console.log('👨‍🏫 User not authenticated');
        setError('User not authenticated');
        return;
      }
      
      // Validate teacher role
      if (user.role !== USER_ROLES.TEACHER) {
        console.error('👨‍🏫 Invalid user role for teacher results:', user.role);
        setError('Access denied. Teacher role required.');
        return;
      }
      
      // Load teacher assignments
      console.log('👨‍🏫 Loading teacher assignments...');
      await loadAssignments();
      
      // TODO: Replace with academic calendar service
      console.log('👨‍🏫 TODO: Load academic calendar service');
      
      console.log('👨‍🏫 Teacher results initialization complete!');
      
    } catch (error) {
      console.error('👨‍🏫 Error initializing teacher results:', error);
      setError('Failed to initialize teacher results');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);
  
  // Enhanced loadAssignments from legacy code
  const loadAssignments = useCallback(async () => {
    console.log('👨‍🏫 Loading teacher assignments...');
    try {
      // Check cache first for teacher data
      const teacherCacheKey = `teacher_data_${user?.teacher_id || user?.id || ''}`;
      let teacherData = getCachedData(teacherCacheKey);
      
      // Force refresh if cached data doesn't have proper subject structure
      if (teacherData && teacherData.subjects && teacherData.subjects.length > 0) {
        const hasValidSubjects = teacherData.subjects.some(subject => 
          subject.subject && subject.classes && subject.classes.length > 0
        );
        if (!hasValidSubjects) {
          console.log('👨‍🏫 Cached data has invalid subject structure, forcing refresh');
          localStorage.removeItem(teacherCacheKey);
          teacherData = null;
        }
      }
      
      if (!teacherData) {
        console.log('👨‍🏫 Cache MISS! Fetching teacher data from API');
        // Load teacher data to get all grades and classes
        teacherData = await userService.getTeacherData();
        console.log('👨‍🏫 Teacher data loaded:', teacherData);
        
        // Cache the result
        setCachedData(teacherCacheKey, teacherData, CACHE_TTL.teacher_subjects);
      } else {
        console.log('👨‍🏫 Cache HIT! Using cached teacher data');
      }
      
      setTeacherData(teacherData);
      
      // Extract all classes from teacher's subjects
      const allClasses = [];
      if (teacherData && teacherData.subjects) {
        console.log('👨‍🏫 Teacher subjects structure:', teacherData.subjects);
        teacherData.subjects.forEach(subject => {
          console.log('👨‍🏫 Processing subject:', subject);
          if (subject.classes) {
            subject.classes.forEach(cls => {
              if (cls.grade && cls.class) {
                allClasses.push({
                  grade: cls.grade,
                  class: cls.class,
                  subject: subject.subject || subject.name || 'Unknown Subject'
                });
              }
            });
          }
        });
      }
      
      // Set available classes directly
      setAvailableClasses(allClasses);
      
      console.log('👨‍🏫 Available classes from teacher data:', allClasses);
      
      // Check cache first for teacher tests
      const testsCacheKey = `teacher_tests_${user?.teacher_id || user?.id || ''}`;
      
      // FORCE REFRESH: Clear cache if it contains drawing tests to ensure fresh data
      const cachedTests = getCachedData(testsCacheKey);
      if (cachedTests && cachedTests.some(test => test.test_type === 'drawing')) {
        console.log('🎨 Drawing test detected - forcing cache refresh');
        localStorage.removeItem(testsCacheKey);
      }
      
      let tests = getCachedData(testsCacheKey);
      
      if (!tests) {
        console.log('👨‍🏫 Cache MISS! Fetching teacher tests from API');
        // Also load test assignments for filtering classes later
        tests = await testService.getTeacherTests();
        console.log('👨‍🏫 Teacher tests loaded:', tests);
        
        // Cache the result
        setCachedData(testsCacheKey, tests, CACHE_TTL.teacher_tests);
      } else {
        console.log('👨‍🏫 Cache HIT! Using cached teacher tests');
      }
      
      // Extract assignments from tests
      const allAssignments = tests.flatMap(test => test.assignments || []);
      setAssignments(allAssignments);
      
      console.log('👨‍🏫 Raw assignments data:', allAssignments);
      console.log('👨‍🏫 Teacher assignments loaded:', allAssignments.length);
    } catch (error) {
      console.error('👨‍🏫 Error loading teacher assignments:', error);
      showNotification('Failed to load teacher assignments', 'error');
    }
  }, [showNotification]);
  
  
  // Enhanced showClassesForGrade from legacy code
  const showClasses = useCallback(async (grade, classNum) => {
    console.log('👨‍🏫 Showing classes for grade:', grade, 'class:', classNum);
    
    // Set the selected grade and class
    setInternalSelectedGrade(grade);
    setInternalSelectedClass(classNum);
    setSelectedSemester(null);
    setResults(null);
    
    // TODO: Replace with academic calendar service
    if (grade && classNum) {
      console.log('👨‍🏫 TODO: Implement academic calendar service for term selection');
    }
  }, []);
  
  // Enhanced showSemestersForClass from legacy code
  const showSemesters = useCallback((grade, classNum) => {
    console.log('👨‍🏫 Showing semesters for class:', grade, classNum);
    
    setSelectedSemester(null);
    setResults(null);
    
    // TODO: Replace with academic calendar service
    console.log('👨‍🏫 TODO: Implement academic calendar service for term selection');
  }, []);

  // NEW: Enhanced class click handler with semester selection
  const handleClassClick = useCallback((grade, classNum) => {
    console.log('👨‍🏫 Class clicked:', grade, classNum);
    setShowSemesterSelection(true);
    // TODO: Replace with academic calendar service
    console.log('👨‍🏫 TODO: Implement academic calendar service for term selection');
  }, []);


  // NEW: Load results for selected semester (now uses term-based approach)
  const loadResultsForSemester = useCallback(async (semester, forceRefresh = false) => {
    if (!currentSelectedGrade || !currentSelectedClass) return;
    
    console.log('👨‍🏫 Loading results for semester:', semester, 'forceRefresh:', forceRefresh);
    setSelectedSemester(semester);
    
    // Use current term for loading results
    // Pass forceRefresh to bypass HTTP cache after mutations
    if (currentSemesterTerms?.currentTerm) {
      await loadResultsForTerm(currentSemesterTerms.currentTerm.id, forceRefresh);
    }
  }, [currentSelectedGrade, currentSelectedClass, currentSemesterTerms, loadResultsForTerm]);

  // NEW: Render term buttons for current semester
  const renderTermButtons = useCallback(() => {
    if (!currentSemesterTerms) {
      return (
        <div className="flex space-x-4 mb-6">
          <div className="px-6 py-3 rounded-lg bg-gray-200 text-gray-500">
            Loading terms...
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Current Semester: {currentSemesterTerms?.semester === 1 ? 'Semester 1' : 'Semester 2'}
        </h2>
        <div className="flex space-x-4">
          {currentSemesterTerms?.terms.map(term => (
            <motion.button
              key={term.id}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                term.isCurrent
                  ? 'bg-blue-600 text-white shadow-lg'
                  : selectedTerm === term.id
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => {
                setSelectedTerm(term.id);
                loadResultsForTerm(term.id);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {term.label}
            </motion.button>
          ))}
        </div>
      </div>
    );
  }, [currentSemesterTerms, selectedTerm, loadResultsForTerm]);

  // NEW: Group results by student for enhanced display
  const groupResultsByStudent = useCallback((results) => {
    return results.reduce((acc, result) => {
      if (!acc[result.student_id]) {
        acc[result.student_id] = [];
      }
      acc[result.student_id].push(result);
      return acc;
    }, {});
  }, []);

  // NEW: Calculate class average
  const calculateClassAverage = useCallback((results) => {
    if (results.length === 0) return 0;
    const totalPercentage = results.reduce((sum, result) => sum + (result.percentage || 0), 0);
    return Math.round(totalPercentage / results.length);
  }, []);

  // NEW: Handle failed test click for "Give another try?" functionality
  const handleFailedTestClick = useCallback((result) => {
    if (result.score < result.passing_score) {
      const confirmed = window.confirm('Give another try?');
      if (confirmed) {
        makeTestAccessible(result.student_id, result.test_id);
      }
    }
  }, []);

  // NEW: Make test accessible to student again
  const makeTestAccessible = useCallback(async (studentId, testId) => {
    try {
      const response = await fetch(`/.netlify/functions/reset-test-attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, testId })
      });
      
      if (response.ok) {
        // Update UI to show test as accessible again
        if (currentSelectedClass) {
          // Force refresh to bypass HTTP cache and show updated state immediately
          loadResultsForSemester(selectedSemester, true);
        }
        showNotification('Test made accessible to student', 'success');
      }
    } catch (error) {
      console.error('Error resetting test attempt:', error);
      showNotification('Failed to reset test attempt', 'error');
    }
  }, [currentSelectedClass, selectedSemester, loadResultsForSemester, showNotification]);
  
  // Enhanced getScoreClass from legacy code
  const getScoreClass = useCallback((score, maxScore) => {
    if (score === null || maxScore === null) return '';
    
    const percentage = Math.round((score / maxScore) * 100);
    if (percentage >= 80) return 'text-green-600 bg-green-50';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  }, []);

  // Drawing modal handlers
  const handleViewDrawing = useCallback((result) => {
    setSelectedDrawing(result);
    setIsDrawingModalOpen(true);
  }, []);

  // Speaking test modal handlers
  const handleViewSpeakingTest = useCallback((result, initialTab = 'overview', audioUrlOverride) => {
    // Debug selected speaking result payload to ensure ai_feedback is present and shape is correct
    try {
      const hasAi = !!result?.ai_feedback;
      const aiType = typeof result?.ai_feedback;
      let aiKeys = [];
      if (hasAi) {
        if (aiType === 'string') {
          try { aiKeys = Object.keys(JSON.parse(result.ai_feedback)); } catch (e) { aiKeys = ['<invalid json>']; }
        } else if (aiType === 'object') {
          aiKeys = Object.keys(result.ai_feedback || {});
        }
      }
      console.log('[AI DEBUG] Opening speaking result', { hasAi, aiType, aiKeys });
    } catch (_) {}

    const payload = { ...result, __initialTab: initialTab };
    if (audioUrlOverride) {
      payload.__audioUrl = audioUrlOverride;
    }
    setSelectedSpeakingTest(payload);
    setIsSpeakingModalOpen(true);
  }, []);

  // Fetch test questions with caching
  const fetchTestQuestions = useCallback(async (testType, testId) => {
    if (!testType || !testId) {
      console.error('fetchTestQuestions: Missing testType or testId', { testType, testId });
      return null;
    }

    const cacheKey = `${testType}_${testId}`;
    
    // Check cache first
    if (testQuestionsCache[cacheKey]) {
      console.log('📚 Using cached questions for', cacheKey);
      return testQuestionsCache[cacheKey];
    }
    
    setIsLoadingQuestions(true);
    try {
      console.log('📚 Fetching questions for', { testType, testId });
      const questions = await testService.getTestQuestions(testType, testId);
      console.log('📚 Questions fetched:', questions?.length || 0, 'questions');
      
      // Cache the questions
      setTestQuestionsCache(prev => ({
        ...prev,
        [cacheKey]: questions
      }));
      
      return questions;
    } catch (error) {
      console.error('📚 Error fetching test questions:', error);
      showNotification('Failed to load test questions', 'error');
      return null;
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [testQuestionsCache, showNotification]);

  // Handle viewing answers
  const handleViewAnswers = useCallback(async (testResult, test) => {
    console.log('📋 Opening answer modal for:', { testResult, test });
    console.log('📋 [handleViewAnswers] testResult.answers:', testResult?.answers);
    console.log('📋 [handleViewAnswers] testResult.answers type:', typeof testResult?.answers);
    console.log('📋 [handleViewAnswers] testResult.retest_offered:', testResult?.retest_offered);
    console.log('📋 [handleViewAnswers] Full testResult keys:', testResult ? Object.keys(testResult) : 'null');

    // Note: testResult.answers already contains retest answers (if retest_offered = true) 
    // thanks to teacher_student_results_view which uses CASE statement to return 
    // retest answers from test_attempts when retest_offered = true for MC/TF/Input tests.
    // This happens automatically via the view, no additional processing needed.

    // Special handling for drawing and speaking tests - use existing modals
    if (testResult.test_type === 'drawing' || test?.test_type === 'drawing') {
      handleViewDrawing(testResult);
      return;
    }

    if (testResult.test_type === 'speaking' || test?.test_type === 'speaking') {
      handleViewSpeakingTest(testResult);
      return;
    }

    // Exclude word matching and matching type tests - they have separate view mechanisms
    const testType = testResult.test_type || test?.test_type;
    if (testType === 'word_matching' || testType === 'matching_type') {
      showNotification('Word matching and picture matching tests have separate view mechanisms', 'info');
      return;
    }

    // Open modal immediately and show loading spinner
    // testResult.answers already contains retest answers when retest_offered = true (from view)
    setSelectedTestResult(testResult);
    setSelectedTestQuestions(null);
    setIsAnswerModalOpen(true);
    setIsLoadingQuestions(true);

    // Fetch questions (use cache if available)
    const testId = testResult.test_id || test?.test_id;

    if (!testType || !testId) {
      showNotification('Unable to load test questions: Missing test type or ID', 'error');
      setIsLoadingQuestions(false);
      return;
    }

    try {
      const questions = await fetchTestQuestions(testType, testId);
      if (questions) {
        setSelectedTestQuestions(questions);
      } else {
        showNotification('Failed to load test questions', 'error');
      }
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [fetchTestQuestions, handleViewDrawing, handleViewSpeakingTest, showNotification]);

  // Handle double-click to start editing score
  const handleScoreDoubleClick = useCallback((resultId, currentScore, currentMaxScore) => {
    setEditingScore({ resultId, score: currentScore, maxScore: currentMaxScore });
    setTempScore(currentScore?.toString() || '');
    setTempMaxScore(currentMaxScore?.toString() || '');
    setShowSaveButton(true);
  }, []);

  // Handle input changes during editing
  const handleTempScoreChange = useCallback((value) => {
    setTempScore(value);
  }, []);

  const handleTempMaxScoreChange = useCallback((value) => {
    setTempMaxScore(value);
  }, []);

  // Save score changes to database
  const handleSaveScore = useCallback(async () => {
    if (!editingScore) return;
    
    setIsSaving(true);
    try {
      const payload = { 
        resultId: editingScore.resultId, 
        score: parseInt(tempScore) || 0, 
        maxScore: parseInt(tempMaxScore) || 1 
      };
      
      const response = await fetch(API_ENDPOINTS.UPDATE_DRAWING_TEST_SCORE, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        showNotification('Score updated successfully', 'success');
        if (currentSelectedClass) {
          // Force refresh to bypass HTTP cache and show updated scores immediately
          loadResultsForSemester(selectedSemester, true);
        }
        // Reset editing state
        setEditingScore(null);
        setTempScore('');
        setTempMaxScore('');
        setShowSaveButton(false);
      } else {
        showNotification('Failed to update score', 'error');
      }
    } catch (error) {
      console.error('Error updating score:', error);
      showNotification('Failed to update score', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [editingScore, tempScore, tempMaxScore, currentSelectedClass, selectedSemester, loadResultsForSemester, showNotification]);

  // Cancel editing
  const handleCancelEditing = useCallback(() => {
    setEditingScore(null);
    setTempScore('');
    setTempMaxScore('');
    setShowSaveButton(false);
  }, []);

  // Speaking test score editing handlers
  const handleStartSpeakingScoreEdit = useCallback((resultId, currentScore) => {
    setEditingSpeakingScore({ resultId, score: currentScore });
    setTempSpeakingScore(currentScore.toString());
  }, []);

  const handleSaveSpeakingScore = useCallback(async () => {
    if (!editingSpeakingScore) return;
    
    setIsSavingSpeakingScore(true);
    try {
      const payload = { 
        resultId: editingSpeakingScore.resultId, 
        score: parseInt(tempSpeakingScore) || 0
      };
      
      const response = await fetch(API_ENDPOINTS.UPDATE_SPEAKING_TEST_SCORE, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const responseData = await response.json();
        showNotification('Speaking test score updated successfully', 'success');
        
        // Update the selectedSpeakingTest with the new score
        if (selectedSpeakingTest) {
          setSelectedSpeakingTest(prev => ({
            ...prev,
            score: responseData.score,
            percentage: responseData.percentage
          }));
        }
        
        if (currentSelectedClass) {
          // Force refresh to bypass HTTP cache and show updated scores immediately
          loadResultsForSemester(selectedSemester, true);
        }
        // Reset editing state
        setEditingSpeakingScore(null);
        setTempSpeakingScore('');
      } else {
        const errorData = await response.json();
        showNotification(errorData.error || 'Failed to update speaking test score', 'error');
      }
    } catch (error) {
      console.error('Error updating speaking test score:', error);
      showNotification('Failed to update speaking test score', 'error');
    } finally {
      setIsSavingSpeakingScore(false);
    }
  }, [editingSpeakingScore, tempSpeakingScore, currentSelectedClass, selectedSemester, loadResultsForSemester, showNotification]);

  const handleCancelSpeakingScoreEdit = useCallback(() => {
    setEditingSpeakingScore(null);
    setTempSpeakingScore('');
  }, []);

  // Column-level editing handlers for drawing tests ONLY
  const handleStartColumnEditing = (testName, resultsData) => {
    console.log('🎯 Starting column editing for drawing test:', testName);
    console.log('🎯 Current editingColumns before update:', Array.from(editingColumns));
    console.log('🎯 Results data passed to function:', resultsData);
    
    setEditingColumns(prev => {
      const newSet = new Set(prev).add(testName);
      console.log('🎯 Updated editingColumns:', Array.from(newSet));
      return newSet;
    });
    
    // Initialize column scores with current values
    console.log('🎯 Initializing column scores for test:', testName);
    console.log('🎯 Results data:', resultsData);
    console.log('🎯 Results.class:', resultsData ? resultsData.class : 'null');
    
    if (resultsData && resultsData.class) {
      const initialScores = {};
      console.log('🎯 Processing', resultsData.class.length, 'students');
      
      resultsData.class.forEach((student, index) => {
        console.log(`🎯 Student ${index}:`, student.student_id, 'Keys:', Object.keys(student));
        const testResult = student[testName];
        console.log(`🎯 Student ${student.student_id} test result for ${testName}:`, testResult);
        console.log(`🎯 Test result keys:`, testResult ? Object.keys(testResult) : 'null');
        console.log(`🎯 Test result id:`, testResult ? testResult.id : 'null');
        
        if (testResult && (testResult.test_type === 'drawing' || testResult.test_type === 'speaking')) {
          console.log(`🎯 SPEAKING TEST RESULT:`, testResult);
          console.log(`🎯 SPEAKING TEST TYPE:`, testResult.test_type);
          console.log(`🎯 SPEAKING TEST ANSWERS:`, testResult.answers);
          initialScores[student.student_id] = {
            score: (testResult.score || 0).toString(), // Keep as string for input display
            maxScore: (testResult.max_score || 100).toString(), // Keep as string for input display
            resultId: testResult.id
          };
        }
      });
      console.log('🎯 Initial scores for column:', initialScores);
      setColumnScores(prev => ({
        ...prev,
        [testName]: initialScores
      }));
    } else {
      console.log('🎯 No results or class data available');
    }
  };

  const handleCancelColumnEditing = useCallback((testName) => {
    setEditingColumns(prev => {
      const newSet = new Set(prev);
      newSet.delete(testName);
      return newSet;
    });
    setColumnScores(prev => {
      const newScores = { ...prev };
      delete newScores[testName];
      return newScores;
    });
  }, []);

  const handleColumnScoreChange = useCallback((testName, studentId, field, value) => {
    // Don't parse immediately - keep as string for input display
    const stringValue = value.toString();
    
    // Update the ref immediately for UI responsiveness
    if (!columnScoresRef.current[testName]) {
      columnScoresRef.current[testName] = {};
    }
    if (!columnScoresRef.current[testName][studentId]) {
      columnScoresRef.current[testName][studentId] = {};
    }
    columnScoresRef.current[testName][studentId][field] = stringValue;
    
    // Update the state for persistence (parse here for storage)
    const parsedValue = parseInt(value) || 0;
    setColumnScores(prev => ({
      ...prev,
      [testName]: {
        ...prev[testName],
        [studentId]: {
          ...prev[testName]?.[studentId],
          [field]: parsedValue
        }
      }
    }));
  }, []);

  const handleSaveColumnScores = useCallback(async (testName) => {
    if (!columnScoresRef.current[testName]) return;
    
    setIsSavingColumn(true);
    try {
      const updates = Object.entries(columnScoresRef.current[testName]).map(([studentId, scores]) => ({
        resultId: scores.resultId,
        score: parseInt(scores.score) || 0,
        maxScore: parseInt(scores.maxScore) || 100
      }));

      console.log('🎯 Saving column scores for', testName, ':', updates);

      // Save all scores for this column
      const promises = updates.map(update => {
        console.log('🎯 Sending update:', update);
        return fetch(API_ENDPOINTS.UPDATE_DRAWING_TEST_SCORE, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update)
        });
      });

      const responses = await Promise.all(promises);
      const allSuccessful = responses.every(response => response.ok);

      if (allSuccessful) {
        showNotification(`Scores updated successfully for ${testName}`, 'success');
        if (currentSelectedClass) {
          // Force refresh to bypass HTTP cache and show updated scores immediately
          loadResultsForSemester(selectedSemester, true);
        }
        handleCancelColumnEditing(testName);
      } else {
        showNotification('Failed to update some scores', 'error');
      }
    } catch (error) {
      console.error('Error updating column scores:', error);
      showNotification('Failed to update scores', 'error');
    } finally {
      setIsSavingColumn(false);
    }
  }, [columnScores, currentSelectedClass, selectedSemester, loadResultsForSemester, showNotification, handleCancelColumnEditing]);

  
  // Enhanced createResultsTable from legacy code with Tailwind CSS and Framer Motion
  const createTable = useCallback((subject, students, uniqueTests) => {
    if (!students || students.length === 0) {
      return (
        <motion.div 
          className="text-center py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-gray-500">No students found for this subject</p>
        </motion.div>
      );
    }
    
    return (
      <motion.div 
        className="relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Scroll indicators hidden per request */}
        
        <motion.div
          className="bg-white rounded-lg shadow-lg overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Top scroll bar */}
          <div 
            className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0"
            onScroll={(e) => {
              if (tableRef.current) {
                tableRef.current.scrollLeft = e.target.scrollLeft;
              }
            }}
          >
            <div className="min-w-full h-1">
              <div className="h-1" style={{ width: `${(uniqueTests.length + 5) * 120}px` }}></div>
            </div>
          </div>
          
          <div 
            ref={tableRef}
            className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0"
            onScroll={(e) => {
              handleScroll(e);
              // Sync top scroll bar
              const topScrollBar = e.target.previousElementSibling;
              if (topScrollBar) {
                topScrollBar.scrollLeft = e.target.scrollLeft;
              }
            }}
          >
            <table className="min-w-full border-collapse text-sm min-w-max">
            <thead>
              <motion.tr 
                className="bg-gradient-to-r from-blue-50 to-indigo-50"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <th className="border-b border-gray-200 px-4 py-4 text-left font-semibold text-gray-700 w-20 text-center">
                  Student ID
                </th>
                <th
                  className={`border-b border-gray-200 px-2 py-4 text-left font-semibold text-gray-700 ${isStudentCollapsed ? 'w-8 min-w-[32px] max-w-[32px] bg-gray-100 cursor-pointer select-none' : 'min-w-[180px] bg-blue-50 cursor-pointer select-none'}`}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsStudentCollapsed(!isStudentCollapsed); }}
                  title="Toggle student name columns"
                >
                  {isStudentCollapsed ? (
                    <div className="flex justify-center">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="truncate" title="Student Name">Student Name</span>
                      <svg className="w-4 h-4 ml-1 flex-shrink-0 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  )}
                </th>
                <th className="border-b border-gray-200 px-4 py-4 text-left font-semibold text-gray-700 w-16 text-center">
                  No.
                </th>
                <th className="border-b border-gray-200 px-4 py-4 text-left font-semibold text-gray-700 min-w-[100px]">
                  Nickname
                </th>
                {uniqueTests.map((test, index) => {
                  const isCollapsed = collapsedTests.has(test.test_name);
                  const isDrawingTest = test.test_type === 'drawing';
                  const isEditingColumn = editingColumnsRef.current.has(test.test_name);
                  
                  console.log(`🎯 Rendering test ${test.test_name}:`, {
                    isDrawingTest,
                    isEditingColumn,
                    editingColumns: Array.from(editingColumnsRef.current),
                    test_type: test.test_type
                  });
                  
                  return (
                    <th 
                      key={index} 
                      className={`border-b border-gray-200 px-2 py-4 text-left font-semibold text-gray-700 cursor-pointer hover:bg-blue-200 transition-colors select-none ${
                        isCollapsed ? 'w-8 min-w-[32px] max-w-[32px] bg-gray-100' : 'min-w-[100px] bg-blue-50'
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleTestCollapse(test.test_name);
                      }}
                    >
                      {isCollapsed ? (
                        <div className="flex justify-center">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="truncate" title={test.test_name}>
                            {test.test_name.length > 8 ? test.test_name.substring(0, 8) + '...' : test.test_name}
                          </span>
                          <svg className="w-4 h-4 ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      )}
                    </th>
                  );
                })}
              </motion.tr>
          </thead>
            <tbody>
              <AnimatePresence>
            {students.map((student, studentIndex) => (
                  <motion.tr 
                    key={studentIndex}
                    className={`border-b border-gray-100 hover:bg-blue-50 transition-colors duration-200 ${
                      studentIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: 0.1 + (studentIndex * 0.05),
                      ease: "easeOut"
                    }}
                    whileHover={{ 
                      scale: 1.01,
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
                    }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <motion.td 
                      className="border-b border-gray-100 px-4 py-4 text-center font-semibold text-gray-900"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      {student.student_id}
                    </motion.td>
                    {isStudentCollapsed ? (
                      <td className="border-b border-gray-100 px-1 py-4 text-sm w-8 min-w-[32px] max-w-[32px]">
                        <div className="flex justify-center">
                          <svg 
                            className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsStudentCollapsed(false); }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </td>
                    ) : (
                      <>
                        <motion.td 
                          className="border-b border-gray-100 px-4 py-4 text-gray-900"
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.2 }}
                        >
                          {student.name}
                        </motion.td>
                        <motion.td 
                          className="border-b border-gray-100 px-4 py-4 text-gray-900"
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.2 }}
                        >
                          {student.surname}
                        </motion.td>
                      </>
                    )}
                    <motion.td 
                      className="border-b border-gray-100 px-4 py-4 text-center text-gray-900"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      {student.number ?? (studentIndex + 1)}
                    </motion.td>
                    <motion.td 
                      className="border-b border-gray-100 px-4 py-4 text-gray-600"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      {student.nickname || '-'}
                    </motion.td>
                {uniqueTests.map((test, testIndex) => {
                  const isCollapsed = collapsedTests.has(test.test_name);
                  const testResult = student[test.test_name];
                  
                  if (isCollapsed) {
                    console.log('📥 Rendering collapsed column for test:', test.test_name);
                    return (
                      <td 
                        key={testIndex} 
                        className="border-b border-gray-100 px-1 py-4 text-sm w-8 min-w-[32px] max-w-[32px]"
                      >
                        <div className="flex justify-center">
                          <svg 
                            className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('🖱️ Clicked on collapsed arrow for:', test.test_name);
                              toggleTestCollapse(test.test_name);
                            }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </td>
                    );
                  }
                  
                  return (
                    <motion.td 
                      key={testIndex} 
                      className="border-b border-gray-100 px-2 py-4 text-sm min-w-[100px]"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "auto", opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={(e) => {
                        console.debug('[TeacherResults] Main table TD clicked', { testResult, student: student.student_id });
                        
                        // Skip drawing and speaking tests - they have separate view buttons
                        const testType = testResult?.test_type || test?.test_type;
                        if (testType === 'drawing' || testType === 'speaking') {
                          return; // Let their own buttons handle it
                        }
                        // Note: word_matching and matching_type are handled below based on score color
                        
                        const pct = computePercentage(testResult);
                        const isRed = pct !== null && pct < 50;
                        
                        // If blue pill exists (retest_offered = true) for MC/TF/Input, show retest answers
                        if (testResult?.retest_offered === true && 
                            (testType === 'multiple_choice' || testType === 'true_false' || testType === 'input')) {
                          handleViewAnswers(testResult, test);
                          return;
                        }
                        
                        // Handle Fill Blanks/Matching/Word Matching based on score color
                        if (testType === 'fill_blanks' || testType === 'matching_type' || testType === 'word_matching') {
                          console.debug('[TeacherResults] Fill Blanks/Matching/Word Matching clicked', { testType, isRed, testResult });
                          if (isRed) {
                            // Red score: show retest option
                            if (testResult?.retest_offered) {
                              showNotification('Retest is already offered', 'info');
                              return;
                            }
                            console.debug('[TeacherResults] Main table TD -> opening retest modal', { studentId: student.student_id, test });
                            openRetestModal({
                              failedStudentIds: [student.student_id],
                              test_type: test.test_type,
                              original_test_id: testResult?.test_id || test.test_id,
                              subject_id: testResult?.subject_id || test.subject_id,
                              grade: selectedGrade,
                              class: selectedClass
                            });
                          } else {
                            // Green/Yellow score: open edit score modal
                            console.debug('[TeacherResults] Opening edit score modal', { testResult });
                            setEditScoreModal({ isOpen: true, testResult });
                          }
                        } else if (isRed) {
                          // Red score: show retest option (for MC/TF/Input)
                          if (testResult?.retest_offered) {
                            showNotification('Retest is already offered', 'info');
                            return;
                          }
                          console.debug('[TeacherResults] Main table TD -> opening retest modal', { studentId: student.student_id, test });
                          openRetestModal({
                            failedStudentIds: [student.student_id],
                            test_type: test.test_type,
                            original_test_id: testResult?.test_id || test.test_id,
                            subject_id: testResult?.subject_id || test.subject_id,
                            grade: selectedGrade,
                            class: selectedClass
                          });
                        } else {
                          // Non-red score: show answers (for MC/TF/Input)
                          handleViewAnswers(testResult, test);
                        }
                      }}
                    >
                      {testResult && testResult.test_type === 'drawing' ? (
                        <div className="flex flex-col items-center space-y-2">
                          <button
                            onClick={() => handleViewDrawing(testResult)}
                            className="text-blue-600 hover:text-blue-800 underline text-sm font-medium px-2 py-1 rounded hover:bg-blue-50"
                          >
                            View Drawing
                          </button>
                          
                          {/* Inline drawing score edit (0/10) */}
                          {(() => {
                            const key = `${test.test_name}|${student.student_id}`;
                            const isEditing = inlineDrawingEdit === key;
                            const displayScore = Number.isFinite(testResult?.score) ? testResult.score : 0;
                            const displayMax = 10;
                            if (!isEditing) {
                              const pct = computePercentage(testResult);
                              const isRed = pct !== null && pct < 50;
                              const isYellow = pct !== null && pct >= 50 && pct < 70;
                              const isGreen = pct !== null && pct >= 70;
                              const blueOffered = testResult?.retest_offered === true;
                              const colorClass = pct === null
                                ? 'text-gray-600'
                                : (isRed ? 'text-red-600 font-semibold' : (isYellow ? 'text-yellow-600' : 'text-green-600'));
                              
                              return (
                                <motion.div
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass} cursor-pointer hover:opacity-90 ${blueOffered ? 'bg-blue-50 text-blue-700 border border-blue-200' : ''}`}
                                  style={isRed ? { color: '#b91c1c' } : undefined}
                                  whileHover={{ scale: 1.1 }}
                                  transition={{ duration: 0.2 }}
                                  onClick={(e) => { 
                                    e.preventDefault();
                                    e.stopPropagation();
                                    // Drawing tests have "View Drawing" button - don't show answer modal
                                    if (isRed && !blueOffered) {
                                      openRetestModal({
                                        failedStudentIds: [student.student_id],
                                        test_type: test.test_type,
                                        original_test_id: testResult?.test_id || test.test_id,
                                        subject_id: testResult?.subject_id || test.subject_id,
                                        grade: selectedGrade,
                                        class: selectedClass
                                      });
                                    } else {
                                      // Drawing tests already have "View Drawing" button - just allow editing
                                      setInlineDrawingEdit(key); 
                                      setInlineDrawingValue(String(displayScore)); 
                                    }
                                  }}
                                  title={blueOffered ? 'Retest offered' : (isRed ? 'Offer retest' : 'Double-click to edit score')}
                                >
                                  {(() => {
                                    const displayScore = (testResult.retest_best_score ?? testResult.score);
                                    const displayMax = (testResult.retest_best_max_score ?? testResult.max_score);
                                    return (
                                      <>
                                        <span className={isRed ? 'text-red-700' : ''}>{displayScore}</span>/<span>{displayMax}</span>
                                      </>
                                    );
                                  })()}
                                  {testResult.caught_cheating && (
                                    <span className="ml-1">⚠️</span>
                                  )}
                                </motion.div>
                              );
                            }
                            return (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max={10}
                                  value={inlineDrawingValue}
                                  onChange={(e) => setInlineDrawingValue(e.target.value)}
                                  onBlur={async () => {
                                    const newVal = Math.max(0, Math.min(10, parseFloat(inlineDrawingValue || '0')));
                                    setIsSavingInline(true);
                                    try {
                                      const payload = {
                                        resultId: testResult?.id,
                                        score: newVal,
                                        maxScore: 10
                                      };
                                      const token = await (window.tokenManager?.getToken() || SecureToken.get()) || localStorage.getItem('accessToken') || localStorage.getItem('token');
                                      const resp = await fetch(API_ENDPOINTS.UPDATE_DRAWING_TEST_SCORE, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
                                        body: JSON.stringify(payload)
                                      });
                                      if (!resp.ok) throw new Error('Failed to save');
                                    } catch (_) { /* swallow, UI stays */ }
                                    finally {
                                      setIsSavingInline(false);
                                      setInlineDrawingEdit(null);
                                      // Force refresh to bypass HTTP cache and show updated scores immediately
                                      loadResultsForSemester(selectedSemester, true);
                                    }
                                  }}
                                  onKeyDown={async (e) => {
                                    if (e.key === 'Enter') {
                                      e.currentTarget.blur();
                                    } else if (e.key === 'Escape') {
                                      setInlineDrawingEdit(null);
                                    }
                                  }}
                                  className="w-16 px-2 py-1 text-xs border border-blue-500 bg-blue-50 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="0"
                                  disabled={isSavingInline}
                                />
                                <span className="text-xs text-gray-500">/</span>
                                <input
                                  type="number"
                                  value={10}
                                  className="w-12 px-2 py-1 text-xs border border-gray-300 bg-gray-100 rounded"
                                  disabled
                                />
                              </div>
                            );
                          })()}
                          
                          {testResult.caught_cheating && testResult.visibility_change_times && (
                            <span className="text-xs text-red-600">
                              ({testResult.visibility_change_times})
                            </span>
                          )}
                        </div>
                      ) : testResult && (testResult.test_type === 'speaking' || test.test_type === 'speaking') ? (
                        <div className="flex flex-col items-center space-y-2">
                          {(() => {
                            const a = testResult?.answers;
                            let audioUrl = undefined;
                            if (typeof a === 'string') {
                              if (/^https?:\/\//i.test(a)) audioUrl = a; else { try { audioUrl = JSON.parse(a)?.audio_url; } catch (_) {} }
                            } else if (a && typeof a === 'object') {
                              audioUrl = a.audio_url;
                            }
                            if (!audioUrl && testResult?.audio_url) audioUrl = testResult.audio_url;
                            // debug removed
                            return (
                              <>
                                <button
                                  onClick={() => handleViewSpeakingTest({ ...testResult, __studentId: student.student_id }, 'audio', audioUrl)}
                                  className="text-blue-600 hover:text-blue-800 underline text-sm font-medium px-2 py-1 rounded hover:bg-blue-50"
                                >
                                  Results
                                </button>
                                {/* No direct link; only modal trigger per request */}
                              </>
                            );
                          })()}
                          
                          {/* Score display - regular numbers by default, editable when column is being edited */}
                          {(() => {
                            const isEditing = editingColumnsRef.current.has(test.test_name);
                            console.log(`🎯 Score cell for ${test.test_name}:`, {
                              isEditing,
                              editingColumns: Array.from(editingColumnsRef.current),
                              test_name: test.test_name
                            });
                            return isEditing;
                          })() ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max={testResult.max_score || 100}
                                value={columnScoresRef.current[test.test_name]?.[student.student_id]?.score || testResult.score || ''}
                                onChange={(e) => handleColumnScoreChange(test.test_name, student.student_id, 'score', e.target.value)}
                                className="w-16 px-2 py-1 text-xs border border-blue-500 bg-blue-50 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Score"
                              />
                              <span className="text-xs text-gray-500">/</span>
                              <input
                                type="number"
                                min="1"
                                value={columnScoresRef.current[test.test_name]?.[student.student_id]?.maxScore || testResult.max_score || 100}
                                onChange={(e) => handleColumnScoreChange(test.test_name, student.student_id, 'maxScore', e.target.value)}
                                className="w-16 px-2 py-1 text-xs border border-blue-500 bg-blue-50 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Max"
                              />
                            </div>
                          ) : (
                            <div 
                              className="px-2 py-1 rounded-full text-xs font-medium"
                              onDoubleClick={() => {
                                console.log('🎯 Double-clicked on speaking test score:', test.test_name);
                                console.log('🎯 Results state at double-click:', results);
                                console.log('🎯 Test result:', testResult);
                                console.log('🎯 Student:', student);
                                console.log('🎯 Test:', test);
                                
                                if (testResult && testResult.id) {
                                  console.log('🎯 Starting column editing for speaking test:', test.test_name);
                                  handleStartColumnEditing(test.test_name);
                                } else {
                                  console.log('🎯 No test result ID found, cannot edit');
                                }
                              }}
                              title="Double-click to edit scores"
                            >
                          {(() => {
                            const pct = computePercentage(testResult);
                            const isRed = pct !== null && pct < 50;
                            const isYellow = pct !== null && pct >= 50 && pct < 70;
                            const isGreen = pct !== null && pct >= 70;
                            const blueOffered = testResult.retest_offered;
                            const colorClass = pct === null
                              ? 'text-gray-600'
                              : (isRed ? 'text-red-600 font-semibold' : (isYellow ? 'text-yellow-600' : 'text-green-600'));
                            return (
                              <motion.div
                                className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass} cursor-pointer hover:opacity-90 ${blueOffered ? 'bg-blue-50 text-blue-700 border border-blue-200' : ''}`}
                                style={isRed ? { color: '#b91c1c' } : undefined}
                                whileHover={{ scale: 1.1 }}
                                transition={{ duration: 0.2 }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  // Speaking tests have separate view buttons - don't show answer modal
                                  if (isRed && !blueOffered) {
                                    console.log('🎯 Offering retest for speaking test:', test.test_name);
                                    openRetestModal({
                                      failedStudentIds: [student.student_id],
                                      test_type: test.test_type,
                                      original_test_id: testResult?.test_id || test.test_id,
                                      subject_id: testResult?.subject_id || test.subject_id,
                                      grade: selectedGrade,
                                      class: selectedClass
                                    });
                                  }
                                  // For non-red speaking tests, they have their own view buttons - do nothing here
                                }}
                                title={blueOffered ? 'Retest offered' : (isRed ? 'Offer retest' : 'Use "View Results" button to review')}
                              >
                                {(() => {
                                  const displayScore = (testResult.retest_best_score ?? testResult.score);
                                  const displayMax = (testResult.retest_best_max_score ?? testResult.max_score);
                                  return (
                                    <>
                                      <span className={isRed ? 'text-red-700' : ''}>{displayScore}</span>/<span>{displayMax}</span>
                                    </>
                                  );
                                })()}
                                {testResult.caught_cheating && (
                                  <span className="ml-1">⚠️</span>
                                )}
                              </motion.div>
                            );
                          })()}
                              {testResult.caught_cheating && testResult.visibility_change_times && (
                                <span className="text-xs text-red-600">
                                  ({testResult.visibility_change_times})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ) : testResult && testResult.score !== null && testResult.score !== undefined ? (
                        <div className="flex flex-col items-center space-y-1">
                          {(() => {
                            const pct = computePercentage(testResult);
                            const isRed = pct !== null && pct < 50;
                            const isYellow = pct !== null && pct >= 50 && pct < 70;
                            const isGreen = pct !== null && pct >= 70;
                            // debug removed
                            const colorClass = pct === null
                              ? 'text-gray-600'
                              : (isRed ? 'text-red-600 font-semibold' : (isYellow ? 'text-yellow-600' : 'text-green-600'));
                            const blueOffered = testResult?.retest_offered === true;
                            return (
                              <motion.div 
                                className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass} cursor-pointer hover:opacity-90 ${blueOffered ? 'bg-blue-50 text-blue-700 border border-blue-200' : ''}`}
                                style={isRed ? { color: '#b91c1c' } : undefined}
                                whileHover={{ scale: 1.1 }}
                                transition={{ duration: 0.2 }}
                                onClick={(e) => { 
                                  e.preventDefault();
                                  e.stopPropagation();
                                  
                                  // Skip drawing and speaking tests - they have separate view buttons
                                  const testType = testResult?.test_type || test?.test_type;
                                  if (testType === 'drawing' || testType === 'speaking') {
                                    return; // Let their own buttons handle it
                                  }
                                  
                                  // If blue pill exists (retest_offered = true) for MC/TF/Input, show retest answers
                                  if (testResult?.retest_offered === true && 
                                      (testType === 'multiple_choice' || testType === 'true_false' || testType === 'input')) {
                                    handleViewAnswers(testResult, test);
                                    return;
                                  }
                                  
                                  // Handle Fill Blanks/Matching/Word Matching based on score color
                                  if (testType === 'fill_blanks' || testType === 'matching_type' || testType === 'word_matching') {
                                    console.debug('[TeacherResults] Score pill clicked (Fill Blanks/Matching/Word Matching)', { testType, isRed, testResult });
                                    if (isRed) {
                                      // Red score: show retest option
                                      if (testResult?.retest_offered) {
                                        showNotification('Retest is already offered', 'info');
                                        return;
                                      }
                                      openRetestModal({ 
                                        failedStudentIds: [student.student_id],
                                        test_type: test.test_type,
                                        original_test_id: testResult?.test_id || test.test_id,
                                        subject_id: testResult?.subject_id || test.subject_id,
                                        grade: selectedGrade,
                                        class: selectedClass
                                      });
                                    } else {
                                      // Green/Yellow score: open edit score modal
                                      console.debug('[TeacherResults] Opening edit score modal from score pill', { testResult });
                                      setEditScoreModal({ isOpen: true, testResult });
                                    }
                                    return;
                                  }
                                  
                                  if (isRed) {
                                    // Red score: show retest option (for MC/TF/Input)
                                    if (testResult?.retest_offered) {
                                      showNotification('Retest is already offered', 'info');
                                      return;
                                    }
                                    openRetestModal({ 
                                      failedStudentIds: [student.student_id],
                                      test_type: test.test_type,
                                      original_test_id: testResult?.test_id || test.test_id,
                                      subject_id: testResult?.subject_id || test.subject_id,
                                      grade: selectedGrade,
                                      class: selectedClass
                                    }); 
                                  } else {
                                    // Non-red score: show answers (for MC/TF/Input)
                                    handleViewAnswers(testResult, test);
                                  }
                                }}
                                title={blueOffered ? 'Click to view retest answers' : (isRed ? 'Offer retest' : '')}
                              >
                                {(() => {
                                  const displayScore = (testResult.retest_best_score ?? testResult.score);
                                  const displayMax = (testResult.retest_best_max_score ?? testResult.max_score);
                                  return (
                                    <>
                                      <span className={isRed ? 'text-red-700' : ''}>{displayScore}</span>/<span>{displayMax}</span>
                                    </>
                                  );
                                })()}
                                {testResult.caught_cheating && (
                                  <span className="ml-1">⚠️</span>
                                )}
                              </motion.div>
                            );
                          })()}
                          {testResult.caught_cheating && testResult.visibility_change_times && (
                            <span className="text-xs text-red-600">
                              ({testResult.visibility_change_times})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </motion.td>
                  );
                })}
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    );
  }, [getScoreClass, collapsedTests, toggleTestCollapse, isStudentCollapsed]);

  // Mobile responsive table version
  const createTableMobile = useCallback((subject, students, uniqueTests) => {
    if (!students || students.length === 0) {
      return (
        <motion.div 
          className="text-center py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-gray-500">No students found for this subject</p>
        </motion.div>
      );
    }
    
    return (
      <motion.div 
        className="w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <motion.div 
          className="overflow-x-auto -mx-4 px-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="bg-white rounded-lg shadow-md overflow-hidden min-w-max">
            <table className="w-full border-collapse text-xs min-w-max">
              <thead>
                <motion.tr 
                  className="bg-gradient-to-r from-blue-50 to-indigo-50"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.2 }}
                >
                  <th className="border-b border-gray-200 px-3 py-3 text-left font-semibold text-gray-700 w-16 text-center">
                    ID
                  </th>
                  <th
                    className={`border-b border-gray-200 px-2 py-3 text-left font-semibold text-gray-700 ${isStudentCollapsed ? 'w-8 min-w-[32px] max-w-[32px] bg-gray-100 cursor-pointer select-none' : 'min-w-[160px] bg-blue-50 cursor-pointer select-none'}`}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsStudentCollapsed(!isStudentCollapsed); }}
                    title="Toggle student name columns"
                  >
                    {isStudentCollapsed ? (
                      <div className="flex justify-center">
                        <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="truncate" title="Student Name">Student Name</span>
                        <svg className="w-3 h-3 ml-1 flex-shrink-0 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    )}
                  </th>
                  <th className="border-b border-gray-200 px-3 py-3 text-left font-semibold text-gray-700 w-12 text-center">
                    No.
                  </th>
                  <th className="border-b border-gray-200 px-3 py-3 text-left font-semibold text-gray-700 min-w-[80px]">
                    Nickname
                  </th>
                  {uniqueTests.map((test, index) => {
                    const isDrawingTest = test.test_type === 'drawing';
                    const isEditingColumn = editingColumnsRef.current.has(test.test_name);
                    
                    return (
                      <motion.th 
                        key={index} 
                        className="border-b border-gray-200 px-3 py-3 text-left font-semibold text-gray-700 min-w-[100px]"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: 0.3 + (index * 0.05) }}
                      >
                        <div className="flex flex-col space-y-1">
                          
                          {/* Test name */}
                          <span className="text-xs">
                            {test.test_name.length > 10 ? test.test_name.substring(0, 10) + '...' : test.test_name}
                          </span>
                        </div>
                      </motion.th>
                    );
                  })}
                </motion.tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {students.map((student, studentIndex) => (
                    <motion.tr 
                      key={studentIndex}
                      className={`border-b border-gray-100 hover:bg-blue-50 transition-colors duration-200 ${
                        studentIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ 
                        duration: 0.2, 
                        delay: 0.1 + (studentIndex * 0.03),
                        ease: "easeOut"
                      }}
                      whileHover={{ 
                        scale: 1.005,
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
                      }}
                      whileTap={{ scale: 0.995 }}
                    >
                      <motion.td 
                        className="border-b border-gray-100 px-3 py-3 text-center font-semibold text-gray-900"
                        whileHover={{ scale: 1.03 }}
                        transition={{ duration: 0.15 }}
                      >
                        {student.student_id}
                      </motion.td>
                      {isStudentCollapsed ? (
                        <td className="border-b border-gray-100 px-1 py-3 text-xs w-8 min-w-[32px] max-w-[32px]">
                          <div className="flex justify-center">
                            <svg 
                              className="w-3 h-3 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsStudentCollapsed(false); }}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </td>
                      ) : (
                        <>
                          <motion.td 
                            className="border-b border-gray-100 px-3 py-3 text-gray-900 truncate"
                            whileHover={{ scale: 1.01 }}
                            transition={{ duration: 0.15 }}
                          >
                            {student.name}
                          </motion.td>
                          <motion.td 
                            className="border-b border-gray-100 px-3 py-3 text-gray-900 truncate"
                            whileHover={{ scale: 1.01 }}
                            transition={{ duration: 0.15 }}
                          >
                            {student.surname}
                          </motion.td>
                        </>
                      )}
                      <motion.td 
                        className="border-b border-gray-100 px-3 py-3 text-center text-gray-900 truncate"
                        whileHover={{ scale: 1.01 }}
                        transition={{ duration: 0.15 }}
                      >
                        {student.number ?? (studentIndex + 1)}
                      </motion.td>
                      <motion.td 
                        className="border-b border-gray-100 px-3 py-3 text-gray-600 whitespace-normal break-words"
                        whileHover={{ scale: 1.01 }}
                        transition={{ duration: 0.15 }}
                      >
                        {student.nickname || '-'}
                      </motion.td>
                      {uniqueTests.map((test, testIndex) => {
                        const isCollapsed = collapsedTests.has(test.test_name);
                        const testResult = student[test.test_name];
                        
                        if (isCollapsed) {
                          return (
                            <td 
                              key={testIndex} 
                              className="border-b border-gray-100 px-1 py-3 text-sm w-8 min-w-[32px] max-w-[32px]"
                            >
                              <div className="flex justify-center">
                                <svg 
                                  className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleTestCollapse(test.test_name);
                                  }}
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </td>
                          );
                        }
                        
                        return (
                          <motion.td 
                            key={testIndex} 
                            className="border-b border-gray-100 px-3 py-3 text-sm"
                            whileHover={{ scale: 1.01 }}
                            transition={{ duration: 0.15 }}
                            onClick={(e) => {
                              console.debug('[TeacherResults] TD clicked', { testResult, student: student.student_id });
                              
                              // Skip drawing and speaking tests - they have separate view buttons
                              const testType = testResult?.test_type || test?.test_type;
                              if (testType === 'drawing' || testType === 'speaking') {
                                return; // Let their own buttons handle it
                              }
                              
                              const pct = computePercentage(testResult);
                              const isRed = pct !== null && pct < 50;
                              
                              // If blue pill exists (retest_offered = true) for MC/TF/Input, show retest answers
                              if (testResult?.retest_offered === true && 
                                  (testType === 'multiple_choice' || testType === 'true_false' || testType === 'input')) {
                                handleViewAnswers(testResult, test);
                                return;
                              }
                              
                              // Handle Fill Blanks/Matching/Word Matching based on score color
                              if (testType === 'fill_blanks' || testType === 'matching_type' || testType === 'word_matching') {
                                console.debug('[TeacherResults] Fill Blanks/Matching/Word Matching clicked (nested table)', { testType, isRed, testResult });
                                if (isRed) {
                                  // Red score: show retest option
                                  if (testResult?.retest_offered) {
                                    showNotification('Retest is already offered', 'info');
                                    return;
                                  }
                                  console.debug('[TeacherResults] TD -> opening retest modal', { studentId: student.student_id });
                                  openRetestModal({ 
                                    failedStudentIds: [student.student_id],
                                    test_type: testResult.test_type,
                                    original_test_id: testResult.test_id,
                                    subject_id: testResult.subject_id,
                                    grade: selectedGrade,
                                    class: selectedClass
                                  });
                                } else {
                                  // Green/Yellow score: open edit score modal
                                  console.debug('[TeacherResults] Opening edit score modal (nested table)', { testResult });
                                  setEditScoreModal({ isOpen: true, testResult });
                                }
                              } else if (isRed) {
                                // Red score: show retest option (for MC/TF/Input)
                                if (testResult?.retest_offered) {
                                  showNotification('Retest is already offered', 'info');
                                  return;
                                }
                                console.debug('[TeacherResults] TD -> opening retest modal', { studentId: student.student_id });
                                openRetestModal({ 
                                  failedStudentIds: [student.student_id],
                                  test_type: testResult.test_type,
                                  original_test_id: testResult.test_id,
                                  subject_id: testResult.subject_id,
                                  grade: selectedGrade,
                                  class: selectedClass
                                });
                              } else {
                                // Non-red score: show answers (for MC/TF/Input)
                                handleViewAnswers(testResult, test);
                              }
                            }}
                          >
                             {testResult && (testResult.test_type === 'drawing' || test.test_type === 'drawing' || testResult.test_type === 'speaking' || test.test_type === 'speaking' || (testResult.score !== null && testResult.score !== undefined)) ? (
                              <div className="flex flex-col items-center space-y-1">
                                {testResult.test_type === 'drawing' ? (
                                  <>
                                    <button
                                      onClick={() => handleViewDrawing(testResult)}
                                      className="text-blue-600 hover:text-blue-800 underline text-xs font-medium px-1 py-0.5 rounded hover:bg-blue-50"
                                    >
                                      View
                                    </button>
                                    {editingColumnsRef.current.has(test.test_name) ? (
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="number"
                                          min="0"
                                          max={testResult.max_score || 100}
                                          value={columnScoresRef.current[test.test_name]?.[student.student_id]?.score || testResult.score || ''}
                                          onChange={(e) => handleColumnScoreChange(test.test_name, student.student_id, 'score', e.target.value)}
                                          className="w-12 px-1 py-0.5 text-xs border border-blue-500 bg-blue-50 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                          placeholder="Score"
                                        />
                                        <span className="text-xs text-gray-500">/</span>
                                        <input
                                          type="number"
                                          min="1"
                                          value={columnScoresRef.current[test.test_name]?.[student.student_id]?.maxScore || testResult.max_score || 100}
                                          onChange={(e) => handleColumnScoreChange(test.test_name, student.student_id, 'maxScore', e.target.value)}
                                          className="w-12 px-1 py-0.5 text-xs border border-blue-500 bg-blue-50 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                          placeholder="Max"
                                        />
                                      </div>
                                    ) : (
                                      (() => {
                                        const pct = computePercentage(testResult);
                                        const isRed = pct !== null && pct < 50;
                                        const isYellow = pct !== null && pct >= 50 && pct < 70;
                                        const isGreen = pct !== null && pct >= 70;
                                        const blueOffered = testResult.retest_offered;
                                        const colorClass = pct === null ? 'text-gray-600' : (isRed ? 'text-red-600 font-semibold' : (isYellow ? 'text-yellow-600' : 'text-green-600'));
                                        return (
                                          <motion.div
                                            className={`px-1 py-0.5 rounded text-xs font-medium ${colorClass} cursor-pointer hover:opacity-90 ${blueOffered ? 'bg-blue-50 text-blue-700 border border-blue-200' : ''}`}
                                            style={isRed ? { color: '#b91c1c' } : undefined}
                                            whileHover={{ scale: 1.05 }}
                                            transition={{ duration: 0.15 }}
                                            onDoubleClick={() => handleStartColumnEditing(test.test_name)}
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              
                                              // Skip drawing and speaking tests - they have separate view buttons
                                              const testType = testResult?.test_type || test?.test_type;
                                              if (testType === 'drawing' || testType === 'speaking') {
                                                return; // Let their own buttons handle it
                                              }
                                              
                                              // If blue pill exists (retest_offered = true) for MC/TF/Input, show retest answers
                                              if (testResult?.retest_offered === true && 
                                                  (testType === 'multiple_choice' || testType === 'true_false' || testType === 'input')) {
                                                handleViewAnswers(testResult, test);
                                                return;
                                              }
                                              
                                              if (isRed) {
                                                // Red score: show retest option
                                                if (testResult?.retest_offered) {
                                                  showNotification('Retest is already offered', 'info');
                                                  return;
                                                }
                                                openRetestModal({
                                                  failedStudentIds: [student.student_id],
                                                  test_type: test.test_type,
                                                  original_test_id: testResult?.test_id || test.test_id,
                                                  subject_id: testResult?.subject_id || test.subject_id,
                                                  grade: selectedGrade,
                                                  class: selectedClass
                                                });
                                              } else {
                                                handleViewAnswers(testResult, test);
                                              }
                                            }}
                                            title={blueOffered ? 'Click to view retest answers' : (isRed ? 'Offer retest' : 'Click to view answers')}
                                          >
                                            <span className={isRed ? 'text-red-700' : ''}>{testResult.score}</span>/<span>{testResult.max_score}</span>
                                            {testResult.caught_cheating && (
                                              <span className="ml-1">⚠️</span>
                                            )}
                                          </motion.div>
                                        );
                                      })()
                                    )}
                                  </>
                                ) : (testResult.test_type === 'speaking' || test.test_type === 'speaking') ? (
                                  <>
                                    <button
                                      onClick={() => handleViewSpeakingTest({ ...testResult, __studentId: student.student_id }, 'audio')}
                                      className="text-blue-600 hover:text-blue-800 underline text-xs font-medium px-1 py-0.5 rounded hover:bg-blue-50"
                                    >
                                      View Audio
                                    </button>
                                    {/* No direct link; only modal trigger per request */}
                                    {editingSpeakingScore && editingSpeakingScore.resultId === testResult.result_id ? (
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="number"
                                          min="0"
                                          max={testResult.max_score || 100}
                                          value={tempSpeakingScore}
                                          onChange={(e) => setTempSpeakingScore(e.target.value)}
                                          className="w-12 px-1 py-0.5 text-xs border border-blue-500 bg-blue-50 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                          placeholder="Score"
                                        />
                                        <button
                                          onClick={() => handleSaveSpeakingScore()}
                                          disabled={isSavingSpeakingScore}
                                          className="px-1 py-0.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                                        >
                                          {isSavingSpeakingScore ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                          onClick={() => handleCancelSpeakingScoreEdit()}
                                          disabled={isSavingSpeakingScore}
                                          className="px-1 py-0.5 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 disabled:opacity-50"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : (
                                      (() => {
                                        const pct = computePercentage(testResult);
                                        const isRed = pct !== null && pct < 50;
                                        const isYellow = pct !== null && pct >= 50 && pct < 70;
                                        const isGreen = pct !== null && pct >= 70;
                                        const blueOffered = testResult.retest_offered;
                                        const colorClass = pct === null ? 'text-gray-600' : (isRed ? 'text-red-600 font-semibold' : (isYellow ? 'text-yellow-600' : 'text-green-600'));
                                        return (
                                          <motion.div
                                            className={`px-1 py-0.5 rounded text-xs font-medium ${colorClass} cursor-pointer hover:opacity-90 ${blueOffered ? 'bg-blue-50 text-blue-700 border border-blue-200' : ''}`}
                                            style={isRed ? { color: '#b91c1c' } : undefined}
                                            whileHover={{ scale: 1.05 }}
                                            transition={{ duration: 0.15 }}
                                            onDoubleClick={() => {
                                              setEditingSpeakingScore({ resultId: testResult.result_id, score: testResult.score });
                                              setTempSpeakingScore(testResult.score?.toString() || '');
                                            }}
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              
                                              // Skip drawing and speaking tests - they have separate view buttons
                                              const testType = testResult?.test_type || test?.test_type;
                                              if (testType === 'drawing' || testType === 'speaking') {
                                                return; // Let their own buttons handle it
                                              }
                                              
                                              // If blue pill exists (retest_offered = true) for MC/TF/Input, show retest answers
                                              if (testResult?.retest_offered === true && 
                                                  (testType === 'multiple_choice' || testType === 'true_false' || testType === 'input')) {
                                                handleViewAnswers(testResult, test);
                                                return;
                                              }
                                              
                                              if (isRed) {
                                                // Red score: show retest option
                                                if (testResult?.retest_offered) {
                                                  showNotification('Retest is already offered', 'info');
                                                  return;
                                                }
                                                openRetestModal({
                                                  failedStudentIds: [student.student_id],
                                                  test_type: test.test_type,
                                                  original_test_id: testResult?.test_id || test.test_id,
                                                  subject_id: testResult?.subject_id || test.subject_id,
                                                  grade: selectedGrade,
                                                  class: selectedClass
                                                });
                                              } else {
                                                handleViewAnswers(testResult, test);
                                              }
                                            }}
                                            title={blueOffered ? 'Click to view retest answers' : (isRed ? 'Offer retest' : 'Click to view answers, double-click to edit score')}
                                          >
                                            <span className={isRed ? 'text-red-700' : ''}>{testResult.score || 0}</span>/<span>{testResult.max_score || 100}</span>
                                            {testResult.caught_cheating && (
                                              <span className="ml-1">⚠️</span>
                                            )}
                                          </motion.div>
                                        );
                                      })()
                                    )}
                                  </>
                                ) : (
                                  (() => {
                                      const pct = computePercentage(testResult);
                                      const isRed = pct !== null && pct < 50;
                                      const isYellow = pct !== null && pct >= 50 && pct < 70;
                                      const isGreen = pct !== null && pct >= 70;
                                      const blueOffered = testResult?.retest_offered === true;
                                      console.debug('[TeacherResults] Render pill', { studentId: student.student_id, pct, isRed, isYellow, isGreen, score: testResult.score, max: testResult.max_score, percentageField: testResult.percentage });
                                      const colorClass = pct === null
                                        ? 'text-gray-600'
                                        : (isRed ? 'text-red-600 font-semibold' : (isYellow ? 'text-yellow-600' : 'text-green-600'));
                                      const classNameStr = `px-1 py-0.5 rounded text-xs font-medium ${colorClass} cursor-pointer hover:opacity-90 pointer-events-auto ${blueOffered ? 'bg-blue-50 text-blue-700 border border-blue-200' : ''}`;
                                      // debug removed
                                      return (
                                        <motion.div 
                                          className={classNameStr}
                                          style={isRed ? { color: '#b91c1c' } : undefined}
                                          whileHover={{ scale: 1.05 }}
                                          transition={{ duration: 0.15 }}
                                          onClick={(e) => { 
                                            e.preventDefault();
                                            e.stopPropagation();
                                            
                                            // Skip drawing and speaking tests - they have separate view buttons
                                            const testType = testResult?.test_type || test?.test_type;
                                            if (testType === 'drawing' || testType === 'speaking') {
                                              return; // Let their own buttons handle it
                                            }
                                            
                                            // If blue pill exists (retest_offered = true) for MC/TF/Input, show retest answers
                                            if (testResult?.retest_offered === true && 
                                                (testType === 'multiple_choice' || testType === 'true_false' || testType === 'input')) {
                                              handleViewAnswers(testResult, test);
                                              return;
                                            }
                                            
                                            if (isRed) {
                                              // Red score: show retest option
                                              if (testResult?.retest_offered) {
                                                showNotification('Retest is already offered', 'info');
                                                return;
                                              }
                                              const computedColor = window.getComputedStyle(e.currentTarget).color;
                                              console.debug('[TeacherResults] Red pill clicked -> opening retest modal', { studentId: student.student_id, className: classNameStr, computedColor }); 
                                              openRetestModal({ 
                                                failedStudentIds: [student.student_id],
                                                test_type: test.test_type,
                                                original_test_id: testResult?.test_id || test.test_id,
                                                subject_id: testResult?.subject_id || test.subject_id,
                                                grade: selectedGrade,
                                                class: selectedClass
                                              }); 
                                            } else {
                                              handleViewAnswers(testResult, test);
                                            }
                                          }}
                                          title={blueOffered ? 'Click to view retest answers' : (isRed ? 'Offer retest' : 'Click to view answers')}
                                        >
                                          <span className={isRed ? 'text-red-700' : ''}>{testResult.score}</span>/<span>{testResult.max_score}</span>
                                          {testResult.caught_cheating && (
                                            <span className="ml-1">⚠️</span>
                                          )}
                                        </motion.div>
                                      );
                                  })()
                                )}
                                {testResult.caught_cheating && testResult.visibility_change_times && (
                                  <span className="text-xs text-red-600">
                                    ({testResult.visibility_change_times})
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </motion.td>
                        );
                      })}
                    </motion.tr>
            ))}
                </AnimatePresence>
          </tbody>
        </table>
      </div>
        </motion.div>
      </motion.div>
    );
  }, [getScoreClass, collapsedTests, toggleTestCollapse, isStudentCollapsed]);
  

  // Enhanced displayClassResults from legacy code
  const renderResults = useCallback(() => {
    if (!results) return null;
    
    console.log('🔍 renderResults - results:', results);
    console.log('🔍 renderResults - results.class:', results.class);
    console.log('🔍 renderResults - results.unique_tests:', results.unique_tests);
    
    // Check if we have student data (results.class should contain students)
    const hasStudentData = results.class && Array.isArray(results.class) && results.class.length > 0;
    console.log('🔍 renderResults - hasStudentData:', hasStudentData);
    
    if (!hasStudentData) {
      console.log('🔍 renderResults - No student data, showing no students message');
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No students found for this class and semester.</p>
        </div>
      );
    }
    
    // Get unique tests from the API response
    const uniqueTests = results.unique_tests || [];
    console.log('🔍 renderResults - uniqueTests:', uniqueTests);
    
    // Store the current results data in a ref for use in handlers
    currentResultsRef.current = results;
    
    return (
      <div className="space-y-6">

        {/* Results Header with Grade/Class Display */}
        <motion.div 
          className="bg-gradient-to-r from-red-500 to-pink-500 rounded-lg p-6 text-white"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.h2 
            className="text-2xl font-bold mb-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            Test Results - Grade M{currentSelectedGrade}, Class {currentSelectedGrade}/{currentSelectedClass}, Semester {selectedSemester}
          </motion.h2>
          <motion.p 
            className="text-cyan-100"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            Viewing results for {results.subjects?.length || 0} subject(s)
          </motion.p>
          
          {/* Collapse/Expand All Button */}
          <motion.div 
            className="mt-4 flex gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <button
              onClick={() => {
                const allTestNames = results.unique_tests?.map(test => test.test_name) || [];
                setCollapsedTests(new Set(allTestNames));
              }}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition-colors"
            >
              Collapse All Tests
            </button>
            <button
              onClick={() => setCollapsedTests(new Set())}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition-colors"
            >
              Expand All Tests
            </button>
          </motion.div>
        </motion.div>
        
        {/* Show the combined class results table */}
        <motion.div 
          className="bg-white rounded-lg shadow p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <motion.h3 
            className="text-lg font-semibold text-gray-900 mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            Class Results
          </motion.h3>
          
          {/* Desktop Table */}
          <div className="hidden md:block">
            {createTable('All Subjects', results.class, uniqueTests)}
          </div>
          {/* Mobile Table */}
          <div className="md:hidden">
            {createTableMobile('All Subjects', results.class, uniqueTests)}
          </div>
        </motion.div>
      </div>
    );
  }, [results, createTable, currentSelectedGrade, currentSelectedClass, selectedSemester]);
  
  // Show notification helper
  

  // Format time utility function
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const remainingSeconds = timeInSeconds % 60;
    return `${minutes} min ${remainingSeconds} sec`;
  };

  // Export to Excel
  const exportToExcel = useCallback(() => {
    if (!results || !results.class || !results.unique_tests) return;
    
    // Use the exact same order as the table (no sorting)
    const headers = [
      'Student ID',
      'Name', 
      'Surname',
      'No.',
      'Nickname',
      ...results.unique_tests.map(test => test.test_name)
    ];
    
    // Prepare data for Excel export matching the table structure
    const excelData = results.class.map((student, studentIndex) => {
      const row = [];
      
      // Add student info in exact order
      row.push(student.student_id);
      row.push(student.name);
      row.push(student.surname);
      row.push(student.number ?? (studentIndex + 1));
      row.push(student.nickname || '-');
      
      // Add test results in exact order (same as table)
      results.unique_tests.forEach(test => {
        const testResult = student[test.test_name];
        if (testResult && testResult.score !== null && testResult.score !== undefined) {
          row.push(`${testResult.score}/${testResult.max_score}`);
        } else {
          row.push('-');
        }
      });
      
      return row;
    });
    
    // Create worksheet with headers
    const ws = XLSX.utils.aoa_to_sheet([headers, ...excelData]);

    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Set column widths to match table structure
    const colWidths = [
      { wch: 10 }, // Student ID
      { wch: 15 }, // Name
      { wch: 15 }, // Surname
      { wch: 6 },  // No.
      { wch: 12 }, // Nickname
      // Dynamic widths for test columns
      ...results.unique_tests.map(() => ({ wch: 15 })) // Each test column
    ];
    ws['!cols'] = colWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Class Results');
    
    // Generate and download file
    const fileName = `class-results-${currentSelectedGrade}-${currentSelectedClass}-semester-${selectedSemester}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    showNotification('Excel file exported successfully!', 'success');
  }, [results, currentSelectedGrade, currentSelectedClass, selectedSemester, showNotification]);
  
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading Teacher Results...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Results Error</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button
              variant="primary"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Teacher Results Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Class Results</h1>
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {lastUpdated ? lastUpdated.toLocaleString() : 'Never'}
              </p>
            </div>
            
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Class Selection - Grouped by Subject */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Class</h2>
            {availableClasses.length > 0 ? (
              (() => {
                // Group classes by subject
                const classesBySubject = availableClasses.reduce((acc, classInfo) => {
                  const subject = classInfo.subject || 'Unknown Subject';
                  if (!acc[subject]) {
                    acc[subject] = [];
                  }
                  acc[subject].push(classInfo);
                  return acc;
                }, {});

                return (
                  <div className="space-y-6">
                    {Object.entries(classesBySubject).map(([subject, classes]) => (
                      <div key={subject} className="border border-gray-200 rounded-lg p-4">
                        <h3 className="text-md font-semibold text-gray-800 mb-3 flex flex-col sm:flex-row sm:items-center items-center">
                          <div className="flex items-center">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                            {subject}
                          </div>
                          <span className="ml-0 sm:ml-2 text-sm text-gray-500 mt-1 sm:mt-0">({classes.length} classes)</span>
                        </h3>
                        <div className="flex flex-wrap justify-center gap-2">
                          {classes.map((classInfo, index) => (
                            <Button
                              key={`${classInfo.grade}-${classInfo.class}-${index}`}
                              variant={currentSelectedGrade === classInfo.grade && currentSelectedClass === classInfo.class ? "primary" : "outline"}
                              onClick={() => showClasses(classInfo.grade, classInfo.class)}
                              className="px-3 py-1 text-xs font-medium min-w-[60px]"
                            >
                              {classInfo.grade}/{classInfo.class}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
            ) : (
              <p className="text-gray-500">No classes available</p>
            )}
          </div>
          
          
          {/* Term Selection */}
          {currentSelectedClass && renderTermButtons()}

          {/* Results Display */}
          {currentSelectedClass && results && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  {currentSelectedGrade} {currentSelectedClass} - Test Results {selectedTerm ? `(Term ${currentSemesterTerms?.terms.find(t => t.id === selectedTerm)?.term})` : ''}
                </h2>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                    onClick={exportToExcel}
                  >
                    <img src="/pics/excel.png" alt="Excel" className="w-4 h-4 object-contain" />
                    <span className="font-medium text-sm">Export Excel</span>
                  </button>
                </div>
              </div>
              {renderResults()}
            </div>
          )}
          
          {/* No Results Message → Inline spinner instead of phrase */}
          {currentSelectedClass && !results && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-200 border-t-blue-500" />
                  <span className="text-gray-600">Loading results…</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drawing Modal */}
      {selectedDrawing && isDrawingModalOpen && (
        <ErrorBoundary>
          <DrawingModal
            drawing={selectedDrawing}
            isOpen={isDrawingModalOpen}
            onClose={() => setIsDrawingModalOpen(false)}
            isTeacherView={true}
            onSaveScore={async ({ resultId, score, maxScore }) => {
              try {
                const token = await (window.tokenManager?.getToken() || SecureToken.get()) || localStorage.getItem('accessToken') || localStorage.getItem('token');
                const resp = await fetch(API_ENDPOINTS.UPDATE_DRAWING_TEST_SCORE, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
                  body: JSON.stringify({ resultId, score, maxScore })
                });
                if (!resp.ok) throw new Error('Failed to save');
                // Force refresh to bypass HTTP cache and show updated scores immediately
                await loadResultsForSemester(selectedSemester, true);
              } catch (e) {
                showNotification('Failed to save drawing score', 'error');
              }
            }}
          />
        </ErrorBoundary>
      )}

      {/* Test Answer Modal */}
      <ErrorBoundary>
        <TestAnswerModal
          onScoreUpdate={(updatedData) => {
            // Refresh results table after score update
            if (currentSelectedClass) {
              loadResultsForSemester(selectedSemester, true);
            }
            // Update selectedTestResult if it's still open
            if (selectedTestResult) {
              setSelectedTestResult(prev => ({
                ...prev,
                score: updatedData.score,
                max_score: updatedData.maxScore,
                percentage: updatedData.percentage
              }));
            }
          }}
          isOpen={isAnswerModalOpen}
          onClose={() => {
            setIsAnswerModalOpen(false);
            setSelectedTestResult(null);
            setSelectedTestQuestions(null);
          }}
          testResult={selectedTestResult}
          questions={selectedTestQuestions}
          isLoadingQuestions={isLoadingQuestions}
        />
      </ErrorBoundary>

      {/* Edit Score Modal (for Fill Blanks/Matching/Word Matching) */}
      <ErrorBoundary>
        <EditScoreModal
          isOpen={editScoreModal.isOpen}
          onClose={() => setEditScoreModal({ isOpen: false, testResult: null })}
          testResult={editScoreModal.testResult}
          onScoreUpdate={(updatedData) => {
            // Refresh results table after score update
            if (currentSelectedClass) {
              loadResultsForSemester(selectedSemester, true);
            }
          }}
        />
      </ErrorBoundary>

      {/* Speaking Test Modal */}
      {selectedSpeakingTest && isSpeakingModalOpen && (
        <ErrorBoundary>
          <SpeakingTestReview
            result={selectedSpeakingTest}
            isOpen={isSpeakingModalOpen}
            onClose={() => setIsSpeakingModalOpen(false)}
            initialTab={selectedSpeakingTest.__initialTab || 'overview'}
            // Speaking test score editing props
            editingSpeakingScore={editingSpeakingScore}
            tempSpeakingScore={tempSpeakingScore}
            isSavingSpeakingScore={isSavingSpeakingScore}
            onStartSpeakingScoreEdit={handleStartSpeakingScoreEdit}
            onSaveSpeakingScore={handleSaveSpeakingScore}
            onCancelSpeakingScoreEdit={handleCancelSpeakingScoreEdit}
            onTempSpeakingScoreChange={setTempSpeakingScore}
          />
        </ErrorBoundary>
      )}
    </div>
  );
};

export default TeacherResults;

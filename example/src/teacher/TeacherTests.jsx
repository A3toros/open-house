import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTestProgress } from '../hooks/useTestProgress';
import userService from '../services/userService';
import testService from '../services/testService';
import { academicCalendarService } from '../services/AcademicCalendarService';
import { Button, LoadingSpinner, Notification, useNotification } from '../components/ui/components-ui-index';
import Card from '../components/ui/Card';
import MatchingTestCreator from '../components/test/MatchingTestCreator';
import WordMatchingCreator from '../components/test/WordMatchingCreator';
import DrawingTestCreator from '../components/test/DrawingTestCreator';
import FillBlanksTestCreator from '../components/test/FillBlanksTestCreator';
import SpeakingTestCreator from '../components/test/SpeakingTestCreator';
import MathEditorButton from '../components/math/MathEditorButton';
import { renderMathInText } from '../utils/mathRenderer';
import * as XLSX from 'xlsx';

// Test type mapping
const TEST_TYPE_MAP = {
  'multipleChoice': 'multiple_choice',
  'trueFalse': 'true_false',
  'input': 'input',
  'matching': 'matching_type',
  'wordMatching': 'word_matching',
  'drawing': 'drawing',
  'fillBlanks': 'fill_blanks',
  'speaking': 'speaking'
};

const TeacherTests = () => {
  const { user } = useAuth();
  const { saveProgress, getProgress, clearProgress } = useTestProgress();
  const { notifications, showNotification, removeNotification } = useNotification();
  
  // === PHASE 1: CORE INFRASTRUCTURE STATE ===
  // Test creation state (matching legacy window variables)
  const [isInTestCreation, setIsInTestCreation] = useState(false);
  const [testAssignmentCompleted, setTestAssignmentCompleted] = useState(false);
  const [currentStep, setCurrentStep] = useState('typeSelection'); // typeSelection, formCreation, testAssignment
  
  // Navigation state
  const [navigationDisabled, setNavigationDisabled] = useState(false);
  
  // Test type and form state
  const [testType, setTestType] = useState(null);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingTest, setIsSavingTest] = useState(false);
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);
  const [isAssigningTest, setIsAssigningTest] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    testName: '',
    numQuestions: 0,
    numOptions: 0,
    questions: {},
    // Timer fields
    enableTimer: false,
    timerMinutes: '',
    // Shuffle questions
    isShuffled: false
  });
  
  // Test assignment state
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [createdTestId, setCreatedTestId] = useState(null);
  
  // Refs for DOM elements (matching legacy getElementById calls)
  const testTypeSelectionRef = useRef(null);
  const multipleChoiceFormRef = useRef(null);
  const trueFalseFormRef = useRef(null);
  const inputTestFormRef = useRef(null);
  const matchingTestFormRef = useRef(null);
  const testAssignmentSectionRef = useRef(null);
  const activeTestsSectionRef = useRef(null);

  // === PHASE 1: CORE INFRASTRUCTURE FUNCTIONS ===
  
  // Initialize test creation functionality (exact copy from legacy)
  const initializeTestCreation = useCallback(async () => {
    // Check if user session is still valid using JWT
    if (!user || !user.teacher_id) {
      console.error('No valid teacher session found in initializeTestCreation, redirecting to login');
      // Redirect to login
      showNotification('Missing teacher session. Please sign in again.', 'error');
      return;
    }
    
    console.log('🔍 Setting up test creation event listeners...');
    
    // Set up auto-save for form fields
    setupFormAutoSave();
    
    console.log('🔍 Test creation initialization complete');
  }, [user, showNotification]);
  
  // Show test type selection (exact copy from legacy)
  const showTestTypeSelection = useCallback(async () => {
    // Check if user session is still valid using JWT
    if (!user || !user.teacher_id) {
      console.error('No valid teacher session found in showTestTypeSelection, redirecting to login');
      showNotification('Missing teacher session. Please sign in again.', 'error');
      return;
    }
    
    console.log('🔍 showTestTypeSelection called - starting new test creation');
    
    // Reset the test assignment completed flag
    setTestAssignmentCompleted(false);
    console.log('🔍 Reset testAssignmentCompleted flag to false');
    
    // Set test creation state
    setIsInTestCreation(true);
    console.log('🔍 Set isInTestCreation flag to true');
    
    // Disable grade buttons and active tests button
    disableNavigationButtons();
    
    // Hide other sections
    setCurrentStep('typeSelection');
    
    // Save current state to localStorage
    saveTestCreationState('testTypeSelection');
  }, [user, showNotification]);
  

  
  // Disable navigation buttons during test creation (exact copy from legacy)
  const disableNavigationButtons = useCallback(async () => {
    // Check if user session is still valid using JWT
    if (!user || !user.teacher_id) {
      console.error('No valid teacher session found in disableNavigationButtons, redirecting to login');
        return;
      }
      
    console.log('🔍 Disabling navigation buttons...');
    setNavigationDisabled(true);
  }, [user]);
  
  // Enable navigation buttons (exact copy from legacy)
  const enableNavigationButtons = useCallback(async () => {
    // Check if user session is still valid using JWT
    if (!user || !user.teacher_id) {
      console.error('No valid teacher session found in enableNavigationButtons, redirecting to login');
        return;
      }
      
    console.log('🔍 Enabling navigation buttons...');
    setNavigationDisabled(false);
  }, [user]);
  
  // === PHASE 1: STATE MANAGEMENT FUNCTIONS ===
  
  // Save test creation state (exact copy from legacy)
  const saveTestCreationState = useCallback(async (currentStep) => {
    // Check if user session is still valid using JWT
    if (!user || !user.teacher_id) {
      console.error('No valid teacher session found in saveTestCreationState, redirecting to login');
      return;
    }
    
    console.log('🔍 🔴 saveTestCreationState called with step:', currentStep);
    console.log('🔍 🔴 Call stack:', new Error().stack);
    
    // Include Excel upload state in saved state
    const excelState = {
      multipleChoice: {
        buttonVisible: true, // Will be managed by state
        hintVisible: false
      },
      trueFalse: {
        buttonVisible: true,
        hintVisible: false
      },
      input: {
        buttonVisible: true,
        hintVisible: false
      }
    };
    
    const state = {
      isInTestCreation: true,
      currentStep: currentStep,
      timestamp: Date.now(),
      excelState
    };
    localStorage.setItem('test_creation_state', JSON.stringify(state));
    console.log('🔍 Saved test creation state:', state);
    
    // Save form data for the current step (inline to avoid circular dependency)
    const formDataToSave = {};
    
    switch (currentStep) {
      case 'testTypeSelection':
        // No form data to save for this step
        break;
        
      case 'multipleChoiceForm':
        formDataToSave.testName = formData.testName || '';
        formDataToSave.numQuestions = formData.numQuestions || '';
        formDataToSave.numOptions = formData.numOptions || '';
        formDataToSave.questions = formData.questions || {};
        break;
        
      case 'trueFalseForm':
        formDataToSave.testName = formData.testName || '';
        formDataToSave.numQuestions = formData.numQuestions || '';
        formDataToSave.questions = formData.questions || {};
        break;
        
      case 'inputForm':
        formDataToSave.testName = formData.testName || '';
        formDataToSave.numQuestions = formData.numQuestions || '';
        formDataToSave.questions = formData.questions || {};
        break;
        
      case 'formCreation':
        // Save all form data for any form creation step
        formDataToSave.testName = formData.testName || '';
        formDataToSave.numQuestions = formData.numQuestions || '';
        formDataToSave.numOptions = formData.numOptions || '';
        formDataToSave.questions = formData.questions || {};
        formDataToSave.enableTimer = !!formData.enableTimer;
        formDataToSave.timerMinutes = formData.timerMinutes || '';
        formDataToSave.isShuffled = !!formData.isShuffled;
        break;
        
      case 'assignment':
      case 'testAssignment':
        // Save assignment step data (test form data is already saved)
        formDataToSave.testName = formData.testName || '';
        formDataToSave.numQuestions = formData.numQuestions || '';
        formDataToSave.numOptions = formData.numOptions || '';
        formDataToSave.questions = formData.questions || {};
        break;
        
      default:
        console.log('🔍 Unknown step in saveTestCreationState:', currentStep);
        break;
    }
    
    // Save form data to localStorage
    if (Object.keys(formDataToSave).length > 0) {
      localStorage.setItem(`form_data_${currentStep}`, JSON.stringify(formDataToSave));
      console.log('🔍 Saved form data for step:', currentStep, formDataToSave);
    }
  }, [user, formData]);
  
  // Clear test creation state (exact copy from legacy)
  const clearTestCreationState = useCallback(async () => {
    // Check if user session is still valid using JWT
    if (!user || !user.teacher_id) {
      console.error('No valid teacher session found in clearTestCreationState, redirecting to login');
      return;
    }
    
    // Clear test creation state
    localStorage.removeItem('test_creation_state');
    localStorage.removeItem('test_creation_form_data');
    
    // Clear any other test-related data that might exist
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('test') || key.includes('form') || key.includes('question'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log('🔍 Removed localStorage key:', key);
    });
    
    console.log('🔍 Cleared test creation state from localStorage');
  }, [user]);
  
  // Clear all test form fields (exact copy from legacy)
  const clearAllTestFormFields = useCallback(async () => {
    // Check if user session is still valid using JWT
    if (!user || !user.teacher_id) {
      console.error('No valid teacher session found in clearAllTestFields, redirecting to login');
      return;
    }
    
    console.log('🔍 Clearing all test form fields...');
    
    // Clear form data state
    setFormData({
      testName: '',
      numQuestions: 0,
      numOptions: 0,
      questions: {}
    });
    
    // Clear test type
    setTestType(null);
    
    // Clear selected classes
    setSelectedClasses([]);
    
    // Clear created test ID
    setCreatedTestId(null);
    
    console.log('🔍 Cleared all test form fields');
  }, [user]);
  
  // Reset Excel upload state (exact copy from legacy)
  const resetExcelUploadState = useCallback(() => {
    console.log('🔍 Resetting Excel upload state...');
    
    // Reset React state
    setExcelUploadState({
      multipleChoice: { buttonVisible: false, hintVisible: false },
      trueFalse: { buttonVisible: false, hintVisible: false },
      input: { buttonVisible: false, hintVisible: false }
    });
    
    const testTypes = ['multiple-choice', 'true-false', 'input', 'word-matching'];
    
    testTypes.forEach(testType => {
      // Hide Excel upload button
      const excelBtn = document.querySelector(`.excel-upload-btn[data-test-type="${testType}"]`);
      if (excelBtn) {
        excelBtn.style.display = 'none';
        console.log('🔍 Excel button hidden for:', testType);
      }
      
      // Hide Excel hint
      const excelHint = document.querySelector(`.excel-hint[data-test-type="${testType}"]`);
      if (excelHint) {
        excelHint.style.display = 'none';
        console.log('🔍 Excel hint hidden for:', testType);
      }
      
      // Clear file input
      const fileInput = document.querySelector(`.excel-file-input[data-test-type="${testType}"]`);
      if (fileInput) {
        fileInput.value = '';
        console.log('🔍 File input cleared for:', testType);
      }
    });
    
    console.log('✅ Excel upload state reset complete');
  }, []);
  
  // === PHASE 1: FORM AUTO-SAVE SYSTEM ===
  
  // Set up auto-save for form fields (exact copy from legacy)
  const setupFormAutoSave = useCallback(() => {
    console.log('🔍 Setting up auto-save listeners for initial form fields...');
    
    // In React, auto-save is handled by useEffect hooks that watch formData changes
    // This function is kept for compatibility but the actual auto-save logic
    // is implemented through React's state management system
    
    // Set up auto-save for basic form fields
    const basicFields = ['testName', 'numQuestions', 'numOptions', 'enableTimer', 'timerMinutes', 'isShuffled'];
    basicFields.forEach(fieldName => {
      const element = document.getElementById(fieldName);
      if (element) {
        element.addEventListener('input', () => {
          // Auto-save is handled by React state changes
          console.log(`🔍 Auto-save triggered for field: ${fieldName}`);
        });
      }
    });
    
    console.log('✅ Form auto-save setup complete');
  }, []);
  
  // Save form data for specific step (exact copy from legacy)
  const saveFormDataForStep = useCallback(async (step) => {
    // Check if user session is still valid using JWT
    if (!user || !user.teacher_id) {
      console.error('No valid teacher session found in saveFormDataForStep, redirecting to login');
      return;
    }
    
    console.log('🔍 🔴 saveFormDataForStep called with step:', step);
    console.log('🔍 🔴 Call stack:', new Error().stack);
    
    const formDataToSave = {};
    
    switch (step) {
      case 'testTypeSelection':
        // No form data to save for this step
        break;
        
      case 'multipleChoiceForm':
        formDataToSave.testName = formData.testName || '';
        formDataToSave.numQuestions = formData.numQuestions || '';
        formDataToSave.numOptions = formData.numOptions || '';
        formDataToSave.questions = formData.questions || {};
        break;
        
      case 'trueFalseForm':
        formDataToSave.testName = formData.testName || '';
        formDataToSave.numQuestions = formData.numQuestions || '';
        formDataToSave.questions = formData.questions || {};
        break;
        
      case 'inputForm':
        formDataToSave.testName = formData.testName || '';
        formDataToSave.numQuestions = formData.numQuestions || '';
        formDataToSave.questions = formData.questions || {};
        break;
        
      case 'formCreation':
        // Save all form data for any form creation step
        formDataToSave.testName = formData.testName || '';
        formDataToSave.numQuestions = formData.numQuestions || '';
        formDataToSave.numOptions = formData.numOptions || '';
        formDataToSave.questions = formData.questions || {};
        break;
        
      default:
        console.log('🔍 Unknown step for form data save:', step);
        return;
    }
    
    localStorage.setItem('test_creation_form_data', JSON.stringify({
      step: step,
      data: formDataToSave,
      timestamp: Date.now()
    }));
    
    console.log('🔍 Saved form data for step:', step, formDataToSave);
  }, [user, formData]);
  
  // Restore form data for specific step (exact copy from legacy)
  const restoreFormDataForStep = useCallback(async (step) => {
    console.log('🔍 Restoring form data for step:', step);
    
    try {
      // Get saved form data from localStorage - use the same key format as save
      const savedData = localStorage.getItem(`form_data_${step}`);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        console.log('🔍 Restored form data:', parsedData);
        
        // Restore form data to React state
        setFormData(prevData => {
          const newData = {
            ...prevData,
            ...parsedData
          };
          console.log('🔍 Updated formData with restored data:', newData);
          console.log('🔍 Matching test data in restored data:', newData.matchingTestData);
          return newData;
        });
        
        // Restore specific form fields
        Object.keys(parsedData).forEach(key => {
          const element = document.getElementById(key);
          if (element && parsedData[key] !== undefined) {
            element.value = parsedData[key];
          }
        });
        
        console.log('✅ Form data restored for step:', step);
      } else {
        console.log('ℹ️ No saved data found for step:', step);
      }
    } catch (error) {
      console.error('❌ Error restoring form data:', error);
    }
  }, [user]);
  
  // Set up multiple choice form auto-save (exact copy from legacy)
  const setupMultipleChoiceFormAutoSave = useCallback(() => {
    console.log('🔍 Setting up multiple choice form auto-save...');
    
    // Set up auto-save for multiple choice specific fields
    const mcFields = ['mcNumOptions'];
    mcFields.forEach(fieldName => {
      const element = document.getElementById(fieldName);
      if (element) {
        element.addEventListener('input', () => {
          console.log(`🔍 Auto-save triggered for MC field: ${fieldName}`);
          // Auto-save is handled by React state changes
        });
      }
    });
    
    // Set up auto-save for question fields
    const questionFields = document.querySelectorAll('#mcQuestionsContainer input, #mcQuestionsContainer textarea, #mcQuestionsContainer select');
    questionFields.forEach(field => {
      field.addEventListener('input', () => {
        console.log('🔍 Auto-save triggered for MC question field');
        // Auto-save is handled by React state changes
      });
    });
    
    console.log('✅ Multiple choice form auto-save setup complete');
  }, []);

  // Set up true/false form auto-save (exact copy from legacy)
  const setupTrueFalseFormAutoSave = useCallback(() => {
    console.log('🔍 Setting up true/false form auto-save...');
    
    // Set up auto-save for true/false specific fields
    const tfFields = document.querySelectorAll('#tfQuestionsContainer input, #tfQuestionsContainer textarea, #tfQuestionsContainer select');
    tfFields.forEach(field => {
      field.addEventListener('input', () => {
        console.log('🔍 Auto-save triggered for TF question field');
        // Auto-save is handled by React state changes
      });
    });
    
    console.log('✅ True/false form auto-save setup complete');
  }, []);

  // Set up input form auto-save (exact copy from legacy)
  const setupInputFormAutoSave = useCallback(() => {
    console.log('🔍 Setting up input form auto-save...');
    
    // Set up auto-save for input specific fields
    const inputFields = document.querySelectorAll('#inputQuestionsContainer input, #inputQuestionsContainer textarea, #inputQuestionsContainer select');
    inputFields.forEach(field => {
      field.addEventListener('input', () => {
        console.log('🔍 Auto-save triggered for Input question field');
        // Auto-save is handled by React state changes
      });
    });
    
    console.log('✅ Input form auto-save setup complete');
  }, []);
  


  // Show Excel upload button (exact copy from legacy)
  const showExcelUploadButton = useCallback((testType) => {
    console.log('🔍 showExcelUploadButton called with testType:', testType);
    
    // Map test type to state key
    const stateKey = testType === 'multiple-choice' ? 'multipleChoice' : 
                    testType === 'true-false' ? 'trueFalse' : 
                    testType === 'input' ? 'input' : testType;
    
    setExcelUploadState(prev => ({
      ...prev,
      [stateKey]: {
        ...prev[stateKey],
        buttonVisible: true
      }
    }));
  }, []);
  
  // Show Excel hint (exact copy from legacy)
  const showExcelHint = useCallback((testType) => {
    console.log('🔍 showExcelHint called with testType:', testType);
    
    // Map test type to state key
    const stateKey = testType === 'multiple-choice' ? 'multipleChoice' : 
                    testType === 'true-false' ? 'trueFalse' : 
                    testType === 'input' ? 'input' : testType;
    
    setExcelUploadState(prev => ({
      ...prev,
      [stateKey]: {
        ...prev[stateKey],
        hintVisible: true
      }
    }));
  }, []);
  

  
  // Display test assignment options (exact copy from legacy)
  const displayTestAssignmentOptions = useCallback(async (classes, testType, testId) => {
    // Check if user session is still valid using JWT
    if (!user || !user.teacher_id) {
      console.error('No valid teacher session found in displayTestAssignmentOptions, redirecting to login');
      return;
    }
    
    console.log('displayTestAssignmentOptions called with:', { classes, testType, testId });
    
    // Update available classes state
    setAvailableClasses(classes);
    
    console.log('🔍 Test assignment options displayed for:', { testType, testId, classesCount: classes.length });
  }, [user]);
  
  // Load teacher grades and classes (exact copy from legacy)
  const loadTeacherGradesAndClasses = useCallback(async (testType, testId) => {
    try {
      console.log('Loading teacher grades and classes for test assignment');
      
      // Check if user session is still valid using JWT
      if (!user || !user.teacher_id) {
        console.error('No valid teacher session found, redirecting to login');
        return;
      }
      
      console.log('Teacher ID:', user.teacher_id);
      
      // Load teacher subjects with classes using the correct API (like legacy)
      const response = await window.tokenManager.makeAuthenticatedRequest(`/.netlify/functions/get-teacher-subjects?teacher_id=${user.teacher_id}`);
      const data = await response.json();
      console.log('Teacher subjects response:', data);
      
      if (data.success && data.subjects && data.subjects.length > 0) {
        console.log('Teacher subjects loaded:', data.subjects);
        setAvailableClasses(data.subjects); // Store subjects with their classes
        displayTestAssignmentOptions(data.subjects, testType, testId);
      } else {
        console.log('No teacher subjects found');
        // Show no subjects message
        showNotification('No subjects found. Please assign subjects to grades and classes first.', 'warning');
      }
    } catch (error) {
      console.error('Error loading teacher grades and classes:', error);
      showNotification('Error loading teacher grades and classes', 'error');
    }
  }, [user, showNotification, displayTestAssignmentOptions]);
  
  // Load available classes for assignment (use teacher-subjects API for proper grouping)
  const loadAvailableClasses = useCallback(async () => {
    console.log('👨‍🏫 Loading available classes...');
    
    // Check if user session is still valid using JWT
    if (!user || !user.teacher_id) {
      console.error('No valid teacher session found, redirecting to login');
      return;
    }
    
    try {
      // Use the teacher-subjects API that returns data already grouped by subjects
      const response = await window.tokenManager.makeAuthenticatedRequest(`/.netlify/functions/get-teacher-subjects?teacher_id=${user.teacher_id}`);
      const data = await response.json();
      console.log('👨‍🏫 Teacher subjects response:', data);
      
      if (data.success && data.subjects && data.subjects.length > 0) {
        console.log('👨‍🏫 Teacher subjects loaded:', data.subjects);
        setAvailableClasses(data.subjects); // Data is already grouped by subjects
      } else {
        console.log('No teacher subjects found');
        setAvailableClasses([]);
        showNotification('No subjects found. Please assign subjects to grades and classes first.', 'warning');
      }
    } catch (error) {
      console.error('👨‍🏫 Error loading available classes:', error);
      showNotification('Failed to load available classes', 'error');
    }
  }, [user, showNotification]);
  
  // Show test assignment (exact copy from legacy)
  const showTestAssignment = useCallback(async (testType, testId) => {
    // Check if we're returning from a successful assignment
    if (testAssignmentCompleted) {
      setTestAssignmentCompleted(false); // Reset flag
      return;
    }
    
    // Check if user session is still valid before proceeding using JWT
    if (!user || !user.teacher_id) {
      console.error('No valid teacher session found in showTestAssignment, redirecting to login');
      return;
    }
    
    // Ensure navigation buttons are disabled
    disableNavigationButtons();
    
    // Save current state
    saveTestCreationState('testAssignment');
    
    // Set test assignment state
    setCreatedTestId(testId);
    setTestType(testType);
    setCurrentStep('testAssignment');
    
    // Load teacher grades and classes
    loadTeacherGradesAndClasses(testType, testId);
    
    console.log('🔍 Test assignment interface shown for:', { testType, testId });
  }, [testAssignmentCompleted, user, disableNavigationButtons, saveTestCreationState, loadTeacherGradesAndClasses]);
  
  // Display teacher's active tests (exact copy from legacy)
  const displayTeacherActiveTests = useCallback(async (tests) => {
    // Check if user session is still valid using JWT
    if (!user || !user.teacher_id) {
      console.error('No valid teacher session found in displayTeacherActiveTests, redirecting to login');
      return;
    }
    
    console.log('🔍 Displaying teacher active tests:', tests);
    
    if (tests.length === 0) {
      setActiveTests([]);
      return;
    }
    
    // Update active tests state
    setActiveTests(tests);
    
    console.log('🔍 Active tests displayed:', tests.length, 'tests');
  }, [user]);
  
  // Load teacher test questions (exact copy from legacy)
  const loadTeacherTestQuestions = useCallback(async (testType, testId) => {
    try {
      console.log('🔍 Loading test questions for:', { testType, testId });
      
      // Use the existing testService to load test questions
      const questions = await testService.getTestQuestions(testId, testType);
      console.log('🔍 Test questions loaded:', questions);
      
      return questions;
    } catch (error) {
      console.error('Error loading test questions:', error);
      throw error;
    }
  }, []);
  
  // Show teacher test details modal (exact copy from legacy)
  const showTeacherTestDetailsModal = useCallback((testType, testId, testName, questions) => {
    console.log('🔍 Showing teacher test details modal:', { testType, testId, testName, questionsCount: questions.length });
    
    // For now, we'll just log the details
    // In a full implementation, this would show a modal with the test details
    console.log('Test Details:', {
      testType,
      testId,
      testName,
      questions: questions.map(q => ({
        id: q.question_id,
        question: q.question,
        correctAnswer: q.correct_answer
      }))
    });
    
    showNotification(`Test details for "${testName}" loaded successfully.`, 'success');
  }, [showNotification]);
  
  // Load teacher active tests (exact copy from legacy)
  const loadTeacherActiveTests = useCallback(async () => {
    console.log('🔧 DEBUG: loadTeacherActiveTests called');
    
    try {
      console.log('🔧 DEBUG: Fetching teacher active tests using JWT authentication...');
      
      // Use the existing testService to load active tests
      const tests = await testService.getTeacherTests();
      console.log('🔧 DEBUG: Tests loaded:', tests);
      
      if (tests && tests.length > 0) {
        console.log('🔧 DEBUG: Success! Displaying', tests.length, 'tests');
        displayTeacherActiveTests(tests);
      } else {
        console.log('🔧 DEBUG: No tests found');
        setActiveTests([]);
      }
    } catch (error) {
      console.error('🔧 DEBUG: Error loading active tests:', error);
      showNotification('Error loading active tests.', 'error');
    }
  }, [showNotification, displayTeacherActiveTests]);
  
  // Show test creation success message (exact copy from legacy)
  const showTestCreationSuccessMessage = useCallback(() => {
    console.log('showTestCreationSuccessMessage called');
    
    showNotification('Test created and assigned successfully!', 'success');
    
    // Reset form and return to test type selection
    setCurrentStep('typeSelection');
    setFormData({
      testName: '',
      numQuestions: 0,
      numOptions: 0,
      questions: {}
    });
    setSelectedClasses([]);
    setTestAssignmentCompleted(false);
    
    // Reset test creation state
    setIsInTestCreation(false);
    
    // Clear test creation state from localStorage (like legacy code)
    clearTestCreationState();
  }, [showNotification, clearTestCreationState]);
  
  // Assign test to classes (exact copy from legacy)
  const assignTestToClasses = useCallback(async (testType, testId) => {
    console.log('🔍 === ASSIGN TEST TO CLASSES DEBUG START ===');
    console.log('🔍 Test Type:', testType);
    console.log('🔍 Test ID:', testId);
    console.log('🔍 Current formData:', formData);
    console.log('🔍 Selected Classes:', selectedClasses);
    console.log('🔍 User:', user);
    
    // Check if user session is still valid using JWT
    if (!user || !user.teacher_id) {
      console.error('❌ No valid teacher session found in assignTestToClasses, redirecting to login');
      showNotification('Missing teacher session. Please sign in again.', 'error');
      return;
    }
    
    console.log('✅ Teacher ID:', user.teacher_id);
    
    if (selectedClasses.length === 0) {
      console.warn('⚠️ No classes selected');
      showNotification('Please select at least one class.', 'warning');
      return;
    }
    
    try {
      console.log('📤 Preparing test + assignment request...');
      
      // Get current academic period ID from academic calendar service
      await academicCalendarService.loadAcademicCalendar();
      const currentTerm = academicCalendarService.getCurrentTerm();
      const currentAcademicPeriodId = currentTerm?.id;
      
      if (!currentAcademicPeriodId) {
        throw new Error('No current academic period found');
      }
      
      // Prepare assignments data with subject_id
      const assignments = selectedClasses.map(classObj => {
        const assignment = {
          grade: parseInt(classObj.grade),
          class: parseInt(classObj.class),
          subject_id: parseInt(classObj.subject_id),
          academic_period_id: currentAcademicPeriodId, // Dynamic academic period
          due_date: null
        };
        console.log('🔍 Created assignment:', assignment);
        return assignment;
      });
      
      console.log('📋 Final assignments array:', assignments);
      
      // Handle matching tests differently
      if (testType === 'matching') {
        console.log('🎯 Processing matching test...');
        console.log('🔄 Setting isAssigningTest to true for matching test...');
        setIsAssigningTest(true);
        console.log('🔄 isAssigningTest set to true, overlay should show');
        
        // Small delay to ensure state update renders
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // For matching tests, use the special matching test data from formData
        const matchingTestData = formData.matchingTestData;
        console.log('🔍 Matching test data from formData:', matchingTestData);
        
        if (!matchingTestData) {
          console.error('❌ Matching test data not found in formData');
          showNotification('Matching test data not found. Please recreate the test.', 'error');
          return;
        }
        
        console.log('✅ Matching test data found, processing...');

        // Use pre-processed questions from MatchingTestCreator
        let questions;
        if (matchingTestData.processedQuestions) {
          console.log('🔍 Using pre-processed questions from MatchingTestCreator');
          questions = matchingTestData.processedQuestions;
        } else {
          console.log('🔍 Converting blocks to questions (fallback)...');
          console.log('🔍 Blocks:', matchingTestData.blocks);
          console.log('🔍 Words:', matchingTestData.words);
          console.log('🔍 Arrows:', matchingTestData.arrows);
          
          questions = matchingTestData.blocks.map((block, index) => {
            const word = matchingTestData.words.find(w => w.blockId === block.id)?.word || `Word ${index + 1}`;
            const hasArrow = matchingTestData.arrows.some(arrow => arrow.startBlock === block.id);
            const arrow = matchingTestData.arrows.find(arrow => arrow.startBlock === block.id) || null;
            
            const question = {
              question_id: index + 1,
              word: word,
              block_coordinates: {
                x: block.x,
                y: block.y,
                width: block.width,
                height: block.height
              },
              has_arrow: hasArrow,
              arrow: arrow ? {
                startX: arrow.startX,
                startY: arrow.startY,
                endX: arrow.endX,
                endY: arrow.endY,
                style: arrow.style || {}
              } : null
            };
            
            console.log(`🔍 Question ${index + 1}:`, question);
            return question;
          });
        }
        
        console.log('📋 Final questions array:', questions);

        const testData = {
          teacher_id: user.teacher_id,
          test_name: formData.testName,
          image_url: matchingTestData.imageUrl,
          num_blocks: matchingTestData.blocks.length,
          questions: questions,
          allowed_time: formData.enableTimer ? Math.max(0, Math.floor((Number(formData.timerMinutes || 0)) * 60)) : null,
          assignments: assignments
        };

        console.log('📤 Final matching test data payload:', testData);

        // Call the matching test specific API
        console.log('🚀 Calling testService.saveMatchingTest...');
        const response = await testService.saveMatchingTest(testData);
        console.log('📥 API Response:', response);
        
        if (response.success) {
          console.log('✅ Matching test created and assigned successfully!');
          showNotification('Matching test created and assigned successfully!', 'success');
          console.log('Matching test created and assigned successfully');
          
          // Mark assignment as completed
          setTestAssignmentCompleted(true);
          
          // Return to main cabinet
          returnToMainCabinet();
        } else {
          console.error('❌ Failed to create matching test:', response.message);
          showNotification('Error creating and assigning matching test: ' + response.message, 'error');
        }
        setIsAssigningTest(false);
        return;
      }

      // Handle word matching tests
      if (testType === 'wordMatching') {
        console.log('🎯 Processing word matching test...');
        console.log('🔄 Setting isAssigningTest to true for word matching test...');
        setIsAssigningTest(true);
        console.log('🔄 isAssigningTest set to true, overlay should show');
        
        // Small delay to ensure state update renders
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const wordMatchingData = formData.wordMatchingData;
        console.log('🔍 Word matching test data from formData:', wordMatchingData);
        
        if (!wordMatchingData) {
          console.error('❌ Word matching test data not found in formData');
          showNotification('Word matching test data not found. Please recreate the test.', 'error');
          return;
        }
        
        console.log('✅ Word matching test data found, processing...');

        // Convert word pairs to questions format
        const questions = wordMatchingData.wordPairs.map((pair, index) => ({
          question_id: index + 1,
          left_word: pair.leftWord,
          right_word: pair.rightWord
        }));

        console.log('📋 Final word matching questions array:', questions);

        const testData = {
          teacher_id: user.teacher_id,
          test_type: 'word_matching',
          test_name: formData.testName,
          num_questions: wordMatchingData.wordPairs.length,
          interaction_type: wordMatchingData.interactionType || 'drag',
          questions: questions,
          allowed_time: formData.enableTimer ? Math.max(0, Math.floor((Number(formData.timerMinutes || 0)) * 60)) : null,
          assignments: assignments
        };

        console.log('📤 Final word matching test data payload:', testData);

        // Call the word matching test specific API
        console.log('🚀 Calling testService.assignTestToClasses for word matching...');
        const response = await testService.assignTestToClasses(testData);
        console.log('📥 API Response:', response);
        
        if (response.success) {
          console.log('✅ Word matching test created and assigned successfully!');
          showNotification('Word matching test created and assigned successfully!', 'success');
          console.log('Word matching test created and assigned successfully');
          
          // Mark assignment as completed
          setTestAssignmentCompleted(true);
          
          // Return to main cabinet
          returnToMainCabinet();
        } else {
          console.error('❌ Failed to create word matching test:', response.message);
          showNotification('Error creating and assigning word matching test: ' + response.message, 'error');
        }
        setIsAssigningTest(false);
        return;
      }

      // Handle drawing tests
      if (testType === 'drawing') {
        console.log('🎯 Processing drawing test...');
        console.log('🔄 Setting isAssigningTest to true for drawing test...');
        setIsAssigningTest(true);
        console.log('🔄 isAssigningTest set to true, overlay should show');
        
        // Small delay to ensure state update renders
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const drawingData = formData.drawingData;
        console.log('🔍 Drawing test data from formData:', drawingData);
        
        if (!drawingData) {
          console.error('❌ Drawing test data not found in formData');
          showNotification('Drawing test data not found. Please recreate the test.', 'error');
          return;
        }
        
        console.log('✅ Drawing test data found, processing...');

        // Use the questions from drawingData
        const questions = drawingData.questions || [];
        console.log('📋 Drawing questions array:', questions);

        const testData = {
          teacher_id: user.teacher_id,
          test_type: 'drawing',
          test_name: formData.testName,
          num_questions: drawingData.num_questions,
          passing_score: drawingData.passing_score,
          questions: questions,
          allowed_time: formData.enableTimer ? Math.max(0, Math.floor((Number(formData.timerMinutes || 0)) * 60)) : null,
          assignments: assignments
        };

        console.log('📤 Final drawing test data payload:', testData);

        // Call the unified save-test-with-assignments function
        console.log('🚀 Calling testService.assignTestToClasses...');
        const response = await testService.assignTestToClasses(testData);
        console.log('📥 API Response:', response);
        
        if (response.success) {
          console.log('✅ Drawing test created and assigned successfully!');
          showNotification('Drawing test created and assigned successfully!', 'success');
          
          // Mark assignment as completed
          setTestAssignmentCompleted(true);
          
          // Return to main cabinet
          returnToMainCabinet();
        } else {
          console.error('❌ Failed to create drawing test:', response.message);
          showNotification('Error creating and assigning drawing test: ' + response.message, 'error');
        }
        setIsAssigningTest(false);
        return;
      }

      // Handle fill blanks tests
      if (testType === 'fillBlanks') {
        console.log('🎯 Processing fill blanks test...');
        console.log('🔄 Setting isAssigningTest to true for fill blanks test...');
        setIsAssigningTest(true);
        console.log('🔄 isAssigningTest set to true, overlay should show');
        
        // Small delay to ensure state update renders
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const fillBlanksData = formData.fillBlanksData;
        console.log('🔍 Fill blanks test data from formData:', fillBlanksData);
        
        if (!fillBlanksData) {
          console.error('❌ Fill blanks test data not found in formData');
          showNotification('Fill blanks test data not found. Please recreate the test.', 'error');
          return;
        }
        
        console.log('✅ Fill blanks test data found, processing...');

        // Use the blanks from fillBlanksData
        const blanks = fillBlanksData.blanks || [];
        console.log('📋 Fill blanks questions array:', blanks);

        const testData = {
          teacher_id: user.teacher_id,
          test_type: 'fill_blanks',
          test_name: formData.testName,
          test_text: fillBlanksData.test_text,
          num_questions: fillBlanksData.num_questions,
          num_blanks: fillBlanksData.num_blanks,
          separate_type: fillBlanksData.separate_type,
          allowed_time: formData.enableTimer ? Math.max(0, Math.floor((Number(formData.timerMinutes || 0)) * 60)) : null,
          questions: blanks,
          assignments: assignments
        };

        console.log('📤 Final fill blanks test data payload:', testData);

        // Call the unified save-test-with-assignments function
        console.log('🚀 Calling testService.assignTestToClasses...');
        const response = await testService.assignTestToClasses(testData);
        console.log('📥 API Response:', response);
        
        if (response.success) {
          console.log('✅ Fill blanks test created and assigned successfully!');
          showNotification('Fill blanks test created and assigned successfully!', 'success');
          
          // Mark assignment as completed
          setTestAssignmentCompleted(true);
          
          // Return to main cabinet
          returnToMainCabinet();
        } else {
          console.error('❌ Failed to create fill blanks test:', response.message);
          showNotification('Error creating and assigning fill blanks test: ' + response.message, 'error');
        }
        setIsAssigningTest(false);
        return;
      }

      // Handle speaking tests
      if (testType === 'speaking') {
        console.log('🎯 Processing speaking test...');
        console.log('🔄 Setting isAssigningTest to true for speaking test...');
        setIsAssigningTest(true);
        console.log('🔄 isAssigningTest set to true, overlay should show');
        
        // Small delay to ensure state update renders
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const speakingData = formData.speakingData;
        console.log('🔍 Speaking test data from formData:', speakingData);
        
        if (!speakingData) {
          console.error('❌ Speaking test data not found in formData');
          showNotification('Speaking test data not found. Please recreate the test.', 'error');
          return;
        }
        
        console.log('✅ Speaking test data found, processing...');

        const testData = {
          teacher_id: user.teacher_id,
          test_type: 'speaking',
          test_name: formData.testName,
          time_limit: speakingData.time_limit,
          min_duration: speakingData.min_duration,
          max_duration: speakingData.max_duration,
          max_attempts: speakingData.max_attempts,
          min_words: speakingData.min_words,
          passing_score: speakingData.passing_score,
          allowed_time: formData.enableTimer ? Math.max(0, Math.floor((Number(formData.timerMinutes || 0)) * 60)) : null,
          questions: speakingData.questions,
          assignments: assignments
        };

        console.log('📤 Final speaking test data payload:', testData);

        // Call the specialized save-speaking-test-with-assignments function
        console.log('🚀 Calling save-speaking-test-with-assignments for speaking test...');
        const response = await window.tokenManager.makeAuthenticatedRequest('/.netlify/functions/save-speaking-test-with-assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testData)
        });
        
        const result = await response.json();
        console.log('📥 API Response:', result);
        
        if (result.success) {
          console.log('✅ Speaking test created and assigned successfully!');
          showNotification('Speaking test created and assigned successfully!', 'success');
          
          // Mark assignment as completed
          setTestAssignmentCompleted(true);
          
          // Return to main cabinet
          returnToMainCabinet();
        } else {
          console.error('❌ Failed to create speaking test:', result.message);
          showNotification('Error creating and assigning speaking test: ' + result.message, 'error');
        }
        setIsAssigningTest(false);
        return;
      }

      // Convert questions object to array format expected by backend (for non-matching tests)
      console.log('🔍 Processing non-matching test...');
      console.log('🔍 Form data questions:', formData.questions);
      
      const questionsArray = Object.keys(formData.questions).map(questionId => {
        const question = formData.questions[questionId];
        console.log(`🔍 Processing question ${questionId}:`, question);
        
        // Handle different test types with appropriate correct answer format
        let correctAnswerField;
        if (testType === 'input') {
          // Input tests use correct_answers (array) for multiple correct answers
          correctAnswerField = { correct_answers: question.correct_answers || [question.correctAnswer || ''] };
        } else if (testType === 'trueFalse') {
          // True/False tests need boolean conversion
          const correctAnswer = question.correct_answer || question.correctAnswer || question.correct_answers?.[0] || '';
          // Convert string 'true'/'false' to boolean, or default to false if empty
          const booleanAnswer = correctAnswer === 'true' ? true : correctAnswer === 'false' ? false : false;
          correctAnswerField = { correct_answer: booleanAnswer };
        } else {
          // Multiple choice tests use correct_answer (single string)
          correctAnswerField = { correct_answer: question.correctAnswer || question.correct_answer || question.correct_answers?.[0] || '' };
        }
        
        const convertedQuestion = {
          question_id: parseInt(questionId),
          question: question.question,
          ...correctAnswerField,
          options: question.options || [] // Send as array - backend will handle conversion
        };
        
        console.log(`🔍 Question ${questionId} correct_answers:`, question.correct_answers);
        console.log(`🔍 Question ${questionId} correctAnswer:`, question.correctAnswer);
        
        console.log(`🔍 Converted question ${questionId}:`, convertedQuestion);
        return convertedQuestion;
      });
      
      console.log('📋 Final questions array:', questionsArray);
      
      // Prepare complete test data for save-test-with-assignments
      const testData = {
        teacher_id: user.teacher_id,
        test_type: TEST_TYPE_MAP[testType],
        test_name: formData.testName,
        num_questions: formData.numQuestions,
        num_options: formData.numOptions,
        questions: questionsArray,
        allowed_time: formData.enableTimer ? Math.max(0, Math.floor((Number(formData.timerMinutes || 0)) * 60)) : null,
        is_shuffled: !!formData.isShuffled,
        assignments: assignments
      };
      
      console.log('📤 Final test data payload:', testData);
      
      console.log('🔄 Setting isAssigningTest to true...');
      setIsAssigningTest(true);
      console.log('🔄 isAssigningTest set to true, overlay should show');
      
      // Small delay to ensure state update renders
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Call the combined save + assign API
      console.log('🚀 Calling testService.assignTestToClasses...');
      const response = await testService.assignTestToClasses(testData);
      console.log('📥 API Response:', response);
      
      if (response.success) {
        console.log('✅ Test created and assigned successfully!');
        showNotification('Test created and assigned successfully!', 'success');
        console.log('Test created and assigned successfully');
        
        // Mark assignment as completed
        setTestAssignmentCompleted(true);
        
        // Return to main cabinet (like legacy code)
        returnToMainCabinet();
      } else {
        console.error('❌ Failed to create and assign test:', response.message);
        showNotification('Error creating and assigning test: ' + response.message, 'error');
      }
    } catch (error) {
      console.error('💥 Exception in assignTestToClasses:', error);
      console.error('Error creating and assigning test:', error);
      showNotification('Error creating and assigning test. Please try again.', 'error');
    } finally {
      setIsAssigningTest(false);
    }
    
    console.log('🔍 === ASSIGN TEST TO CLASSES DEBUG END ===');
  }, [user, selectedClasses, formData, showNotification, showTestCreationSuccessMessage]);
  
  
  // Return to main cabinet (exact copy from legacy)
  const returnToMainCabinet = useCallback(async () => {
    console.log('returnToMainCabinet called - restoring main cabinet view');
    
    try {
      // Reset test creation state
      setIsInTestCreation(false);
      setTestAssignmentCompleted(false);
      setCurrentStep('typeSelection');
      setTestType(null);
      setCreatedTestId(null);
      setSelectedClasses([]);
      
      // Re-enable navigation buttons
      enableNavigationButtons();
      
      // Clear test creation state
      clearTestCreationState();
      
      // Show success message in the main cabinet (like legacy code)
      showTestCreationSuccessMessage();
      
      console.log('🔍 Returned to main cabinet');
    } catch (error) {
      console.error('Error returning to main cabinet:', error);
    }
  }, [enableNavigationButtons, clearTestCreationState, showTestCreationSuccessMessage]);
  
  // === PHASE 5: ACTIVE TESTS MANAGEMENT ===
  
  // Active tests state
  const [activeTests, setActiveTests] = useState([]);
  const [showActiveTests, setShowActiveTests] = useState(false);
  
 
  
  // Refresh active tests data (exact copy from legacy)
  const refreshActiveTestsData = useCallback(async () => {
    console.log('🔍 Refreshing active tests data...');
    
    try {
      await loadTeacherActiveTests();
      showNotification('Active tests data refreshed.', 'success');
    } catch (error) {
      console.error('Error refreshing active tests data:', error);
      showNotification('Error refreshing data.', 'error');
    }
  }, [loadTeacherActiveTests, showNotification]);
  

  // === PHASE 6: SUBJECT MANAGEMENT ===
  
  // Subject management state
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [showSubjectSelection, setShowSubjectSelection] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  

  
  // Display existing subjects in selection (exact copy from legacy)
  const displayExistingSubjectsInSelection = useCallback(async (subjects) => {
    // Check if user session is still valid using JWT
    if (!user || !user.teacher_id) {
      console.error('No valid teacher session found in displayExistingSubjectsInSelection, redirecting to login');
      return;
    }
    
    console.log('Displaying existing subjects in selection interface:', subjects);
    
    // Update subjects state
    setSubjects(subjects);
    
    console.log('🔍 Existing subjects displayed in selection:', subjects.length, 'subjects');
  }, [user]);
  
  // Load and display existing subjects (exact copy from legacy)
  const loadAndDisplayExistingSubjects = useCallback(async () => {
    try {
      console.log('Loading existing subjects...');
      
      // Load subjects using the existing service
      const subjects = await userService.getTeacherSubjects();
      console.log('Existing subjects loaded:', subjects);
      
      if (subjects && subjects.length > 0) {
        displayExistingSubjectsInSelection(subjects);
      } else {
        console.log('No existing subjects found');
        setSubjects([]);
      }
    } catch (error) {
      console.error('Error loading existing subjects:', error);
      showNotification('Error loading subjects.', 'error');
    }
  }, [showNotification, displayExistingSubjectsInSelection]);
  





  // Close menu on outside click (exact copy from legacy)
  const closeMenuOnOutsideClick = useCallback((event) => {
    console.log('Checking for outside click...');
    
    const dropdownMenu = document.getElementById('dropdownMenu');
    const menuButton = document.querySelector('[data-menu-button]');
    
    if (dropdownMenu && !dropdownMenu.contains(event.target) && !menuButton?.contains(event.target)) {
      console.log('Outside click detected, closing menu');
      dropdownMenu.classList.remove('show');
      document.removeEventListener('click', closeMenuOnOutsideClick);
    }
  }, []);
  
  
  

  
  
  // === PHASE 3: EXCEL UPLOAD SYSTEM ===
  
  // Excel upload state
  const [excelUploadState, setExcelUploadState] = useState({
    multipleChoice: { buttonVisible: false, hintVisible: false },
    trueFalse: { buttonVisible: false, hintVisible: false },
    input: { buttonVisible: false, hintVisible: false }
  });
  
  // Handle Excel file upload (exact copy from legacy)
  const handleExcelFileUpload = useCallback((event, testType) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Basic file validation
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      showNotification('Please select a valid Excel file (.xlsx or .xls)', 'error');
      event.target.value = '';
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      showNotification('File is too large. Please select a file smaller than 5MB.', 'error');
      event.target.value = '';
      return;
    }
    
    // Set loading state
    setIsUploadingExcel(true);
    
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        console.log('🔍 File loaded, processing data...');
        
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log('🔍 Parsed Excel data:', jsonData);
        
        processExcelDataForTestType(jsonData, testType);
        
        // Clear loading state on success
        setIsUploadingExcel(false);
        
      } catch (error) {
        console.error('Error processing Excel file:', error);
        showNotification('Error reading Excel file: ' + error.message, 'error');
        event.target.value = '';
        // Clear loading state on error
        setIsUploadingExcel(false);
      }
    };
    
    reader.onerror = function() {
      showNotification('Failed to read file', 'error');
      event.target.value = '';
      // Clear loading state on error
      setIsUploadingExcel(false);
    };
    
    reader.readAsArrayBuffer(file);
  }, [showNotification]);
  
  // Initialize Excel upload for all test types (exact copy from legacy)
  const initializeExcelUploadForAllTestTypes = useCallback(() => {
    console.log('🔍 Initializing Excel upload for all test types...');
    
    // Get all Excel upload buttons
    const excelButtons = document.querySelectorAll('.excel-upload-btn');
    console.log(`🔍 Found ${excelButtons.length} Excel upload buttons`);
    
    // Set up event listeners for each test type
    excelButtons.forEach((button, index) => {
      const testType = button.dataset.testType;
      const fileInput = document.querySelector(`.excel-file-input[data-test-type="${testType}"]`);
      
      console.log(`🔍 Processing button ${index + 1}: testType=${testType}, fileInput=${fileInput ? 'found' : 'not found'}`);
      
      if (fileInput) {
        // Remove existing event listeners to avoid duplicates
        if (button._excelClickHandler) {
          button.removeEventListener('click', button._excelClickHandler);
        }
        if (fileInput._excelChangeHandler) {
          fileInput.removeEventListener('change', fileInput._excelChangeHandler);
        }
        
        // Create new event handlers
        button._excelClickHandler = () => {
          console.log(`🔍 Excel upload button clicked for test type: ${testType}`);
          fileInput.click();
        };
        
        fileInput._excelChangeHandler = (event) => {
          console.log(`🔍 File input changed for test type: ${testType}`);
          handleExcelFileUpload(event, testType);
        };
        
        // Add new event listeners
        button.addEventListener('click', button._excelClickHandler);
        fileInput.addEventListener('change', fileInput._excelChangeHandler);
        
        console.log(`✅ Excel upload initialized for test type: ${testType}`);
      } else {
        console.warn(`⚠️ File input not found for test type: ${testType}`);
      }
    });
    
    console.log('✅ Excel upload initialization complete');
  }, [handleExcelFileUpload]);
  
  
  // === PHASE 3: EXCEL DATA PROCESSING ===
  
  // Process Excel data for specific test type (exact copy from legacy)
  const processExcelDataForTestType = useCallback((excelData, testType) => {
    // Filter out empty rows first (common issue with Excel files)
    const filteredData = excelData.filter(row => 
      Array.isArray(row) && row.length > 0 && row.some(cell => cell && cell.toString().trim() !== '')
    );
    
    console.log(`🔍 Original Excel data rows:`, excelData.length);
    console.log(`🔍 Filtered Excel data rows:`, filteredData.length);
    
    // First, check for headers
    const headerInfo = detectHeaders(filteredData, testType);
    
    // Use the appropriate data rows (with or without headers)
    const dataRows = headerInfo.dataRows;
    
    if (dataRows.length === 0) {
      const message = 'No data rows found after header processing. Please check your Excel file.';
      showNotification(message, 'error');
      alert(message);
      clearFileInputForTestType(testType);
      return;
    }
    
    // Now recognize the data pattern (without headers)
    console.log(`🔍 Processing Excel data for test type: ${testType}`);
    console.log(`🔍 Data rows after header processing:`, dataRows);
    const recognition = recognizeExcelData(dataRows, testType);
    console.log(`🔍 Recognition result:`, recognition);
    
    if (!recognition.recognized) {
      // Data wasn't recognized - user needs to fix their file
      console.log(`❌ Excel data recognition failed for test type: ${testType}`);
      const message = 'Excel data recognition failed. Please check your file format.';
      showNotification(message, 'error');
      alert(message);
      clearFileInputForTestType(testType);
      return;
    }
    
    console.log(`✅ Excel data recognition successful for test type: ${testType}`);
    
    // Data was recognized - check question count
    const excelQuestionCount = dataRows.length;
    const userQuestionCount = getQuestionCountForTestType(testType);
    
    // If user hasn't specified number of questions yet, use the CSV count
    if (userQuestionCount === 0) {
      console.log(`🔍 No question count specified, using CSV count: ${excelQuestionCount}`);
      // Update the form data with the number of questions from CSV
      setFormData(prev => ({
        ...prev,
        numQuestions: excelQuestionCount
      }));
    } else if (excelQuestionCount !== userQuestionCount) {
      // Counts don't match - prompt user to fix
      const message = `Your CSV file has ${excelQuestionCount} data rows, but you specified ${userQuestionCount} questions.\n\n` +
                     `Please either:\n` +
                     `1. Change your question count to ${excelQuestionCount}, or\n` +
                     `2. Fix your CSV file to have exactly ${userQuestionCount} data rows\n\n` +
                     `Then try uploading again.`;
      
      showNotification(message, 'error');
      clearFileInputForTestType(testType);
      return;
    }
      
    // Everything matches - use the data exactly as it is (without headers)
    populateFromExcelForTestType(dataRows, testType);
  }, [showNotification]);
  
  // Detect headers in Excel data (exact copy from legacy)
  const detectHeaders = useCallback((excelData, testType) => {
    if (excelData.length === 0) {
      return { hasHeaders: false, headerRow: null, dataRows: excelData };
    }
    
    const firstRow = excelData[0];
    
    // Check if first row looks like headers
    const headerPattern = getHeaderPattern(testType);
    const headerMatch = checkHeaderMatch(firstRow, headerPattern);
    
    if (headerMatch.isLikelyHeader) {
      // First row looks like headers - ask user
      const message = `The first row of your Excel file looks like it contains headers:\n\n` +
                     `"${firstRow.join(' | ')}"\n\n` +
                     `Does the first row contain column headers?\n\n` +
                     `Click "OK" if YES (headers will be removed)\n` +
                     `Click "Cancel" if NO (first row will be treated as data)`;
      
      const hasHeaders = window.confirm(message);
      
      if (hasHeaders) {
        return { 
          hasHeaders: true, 
          headerRow: firstRow,
          dataRows: excelData.slice(1) // Remove first row
        };
      }
    }
    
    // No headers or user chose to keep first row as data
    return { 
      hasHeaders: false, 
      headerRow: null,
      dataRows: excelData
    };
  }, []);
  
  // Get header pattern for test type (exact copy from legacy)
  const getHeaderPattern = useCallback((testType) => {
    switch (testType) {
      case 'multipleChoice':
        return {
          keywords: ['question', 'answer', 'correct', 'option', 'a', 'b', 'c', 'd', 'e', 'f'],
          expectedColumns: 4
        };
      case 'trueFalse':
        return {
          keywords: ['question', 'answer', 'correct', 'true', 'false'],
          expectedColumns: 2
        };
      case 'input':
        return {
          keywords: ['question', 'answer', 'correct'],
          expectedColumns: 2
        };
      default:
        return { keywords: [], expectedColumns: 0 };
    }
  }, []);
  
  // Check header match (exact copy from legacy)
  const checkHeaderMatch = useCallback((firstRow, headerPattern) => {
    if (!firstRow || firstRow.length === 0) {
      return { isLikelyHeader: false };
    }
    
    // Check if row length matches expected
    if (firstRow.length < headerPattern.expectedColumns) {
      return { isLikelyHeader: false };
    }
    
    // Check if any cell contains header keywords
    const rowText = firstRow.join(' ').toLowerCase();
    const keywordMatches = headerPattern.keywords.filter(keyword => 
      rowText.includes(keyword.toLowerCase())
    );
    
    // If more than half the keywords match, it's likely a header
    const isLikelyHeader = keywordMatches.length > headerPattern.keywords.length / 2;
    
    return { isLikelyHeader, keywordMatches };
  }, []);
  
  // Recognize Excel data (exact copy from legacy)
  const recognizeExcelData = useCallback((excelData, testType) => {
    if (excelData.length === 0) {
      showNotification('No data rows found. Please check your Excel file.', 'error');
      return { recognized: false, data: [] };
    }
    
    // Check if data matches our expected format
    console.log(`🔍 Checking data pattern for test type: ${testType}`);
    console.log(`🔍 Excel data to validate:`, excelData);
    const recognitionResult = checkDataPattern(excelData, testType);
    console.log(`🔍 Recognition result:`, recognitionResult);
    
    if (!recognitionResult.matches) {
      // Data doesn't match our pattern - prompt user to review
      const message = `Your Excel file doesn't match the expected format.\n\n` +
                     `Required format:\n${getRequiredFormatForTestType(testType)}\n\n` +
                     `Please review your Excel file and make sure it follows this format exactly.\n\n` +
                     `Then try uploading again.`;
      
      console.log(`❌ Data pattern validation failed:`, message);
      console.log(`🔍 Calling showNotification with message:`, message);
      showNotification(message, 'error');
      console.log(`🔍 showNotification called`);
      
      // Also show alert as fallback to ensure user sees the error
      alert(message);
      
      return { recognized: false, data: [] };
    }
    
    console.log(`✅ Data pattern validation passed for test type: ${testType}`);
    
    // Data matches our pattern - return it unchanged
    return { recognized: true, data: excelData };
  }, [showNotification]);
  
  // Check data pattern (exact copy from legacy)
  const checkDataPattern = useCallback((excelData, testType) => {
    if (testType === 'multipleChoice') {
      // Check if each row has: Question + Correct Answer + Options
      for (let i = 0; i < excelData.length; i++) {
        const row = excelData[i];
        
        // Need at least 4 columns: Question + Correct Answer + Option A + Option B
        if (row.length < 4) {
          return { 
            matches: false, 
            issue: `Row ${i + 1} has ${row.length} columns but needs at least 4` 
          };
        }
        
        // Check if question exists
        if (!row[0] || row[0].toString().trim() === '') {
          return { 
            matches: false, 
            issue: `Row ${i + 1} has no question in column 1` 
          };
        }
        
        // Check if correct answer exists
        if (!row[1] || row[1].toString().trim() === '') {
          return { 
            matches: false, 
            issue: `Row ${i + 1} has no correct answer in column 2` 
          };
        }
      }
    } else if (testType === 'trueFalse') {
      // Check if each row has: Question + Correct Answer (True/False)
      for (let i = 0; i < excelData.length; i++) {
        const row = excelData[i];
        
        // Need at least 2 columns: Question + Correct Answer
        if (row.length < 2) {
          return { 
            matches: false, 
            issue: `Row ${i + 1} has ${row.length} columns but needs at least 2` 
          };
        }
        
        // Check if question exists
        if (!row[0] || row[0].toString().trim() === '') {
          return { 
            matches: false, 
            issue: `Row ${i + 1} has no question in column 1` 
          };
        }
        
        // Check if correct answer exists and is valid
        const correctAnswer = row[1]?.toString().trim().toLowerCase();
        if (!correctAnswer || !['true', 'false', 't', 'f'].includes(correctAnswer)) {
          return { 
            matches: false, 
            issue: `Row ${i + 1} has invalid correct answer in column 2 (must be True/False)` 
          };
        }
      }
    } else if (testType === 'input') {
      // Check if each row has: Question + Correct Answer
      for (let i = 0; i < excelData.length; i++) {
        const row = excelData[i];
        
        // Need at least 2 columns: Question + Correct Answer
        if (row.length < 2) {
          return { 
            matches: false, 
            issue: `Row ${i + 1} has ${row.length} columns but needs at least 2` 
          };
        }
        
        // Check if question exists
        if (!row[0] || row[0].toString().trim() === '') {
          return { 
            matches: false, 
            issue: `Row ${i + 1} has no question in column 1` 
          };
        }
        
        // Check if correct answer exists
        if (!row[1] || row[1].toString().trim() === '') {
          return { 
            matches: false, 
            issue: `Row ${i + 1} has no correct answer in column 2` 
          };
        }
      }
    }
    
    return { matches: true };
  }, []);
  
  // Get required format for test type (exact copy from legacy)
  const getRequiredFormatForTestType = useCallback((testType) => {
    switch (testType) {
      case 'multipleChoice':
        return 'Column 1: Question\nColumn 2: Correct Answer (A, B, C, D, E, or F)\nColumn 3: Option A\nColumn 4: Option B\nColumn 5: Option C (optional)\nColumn 6: Option D (optional)\nColumn 7: Option E (optional)\nColumn 8: Option F (optional)';
      case 'trueFalse':
        return 'Column 1: Question\nColumn 2: Correct Answer (True or False)';
      case 'input':
        return 'Column 1: Question\nColumn 2: Correct Answer';
      default:
        return 'Unknown test type';
    }
  }, []);
  
  // Get question count for test type (exact copy from legacy)
  const getQuestionCountForTestType = useCallback((testType) => {
    return formData.numQuestions || 0;
  }, [formData.numQuestions]);
  
  // Clear file input for test type (exact copy from legacy)
  const clearFileInputForTestType = useCallback((testType) => {
    console.log(`🔍 Clearing file input for test type: ${testType}`);
    // File input clearing will be handled by React state
  }, []);
  
  // === PHASE 3: EXCEL POPULATION FUNCTIONS ===
  
  // Populate from Excel for test type (exact copy from legacy)
  const populateFromExcelForTestType = useCallback((excelData, testType) => {
    console.log(`🔍 populateFromExcelForTestType called with testType: ${testType}`);
    switch (testType) {
      case 'multipleChoice':
      case 'multiple-choice':
        populateMultipleChoiceFromExcel(excelData);
        break;
      case 'trueFalse':
      case 'true-false':
        populateTrueFalseFromExcel(excelData);
        break;
      case 'input':
        populateInputFromExcel(excelData);
        break;
      default:
        console.log(`❌ Unknown test type: ${testType}`);
    }
  }, []);
  
  // Populate multiple choice from Excel (exact copy from legacy)
  const populateMultipleChoiceFromExcel = useCallback((excelData) => {
    console.log('🔍 populateMultipleChoiceFromExcel called with:', excelData);
    
    // Always determine the number of options from Excel data, regardless of what's already set
    const maxOptions = Math.max(...excelData.map(row => row.length - 2)); // -2 for question and correct answer
    const userNumOptions = Math.min(maxOptions, 6); // Cap at 6 options
    console.log(`🔍 Excel data has ${maxOptions} option columns, using ${userNumOptions} options`);
    
    // Update form data with the number of options from Excel
    setFormData(prev => ({
      ...prev,
      numOptions: userNumOptions
    }));
    
    const questions = {};
    
    excelData.forEach((row, index) => {
      const questionId = index + 1;
      console.log(`🔍 Row ${index + 1} data:`, row);
      const questionData = {
        question: (row[0] || '').toString().trim(), // Use Excel question text directly like legacy
        options: [], // Create as array to match UI expectations
        correctAnswer: (row[1] || '').toString().trim().toUpperCase() // Column 1 is correct answer
      };
      console.log(`🔍 Question ${questionId} correctAnswer:`, questionData.correctAnswer);
      
      // Get the options array based on user's choice
      const allOptions = ['A', 'B', 'C', 'D', 'E', 'F'];
      const userOptions = allOptions.slice(0, userNumOptions);
      
      userOptions.forEach((option, optIndex) => {
        // Get option text from Excel - Column 2+ contains the option texts
        // +2 because column 0 is question, column 1 is correct answer
        const excelOptionText = (row[optIndex + 2] || '').toString().trim();
        console.log(`🔍 Option ${optIndex} (${option}):`, excelOptionText);
        questionData.options.push(excelOptionText);
      });
      
      questions[questionId] = questionData;
    });
    
    // Update form data with Excel data
    setFormData(prev => {
      const newFormData = {
        ...prev,
        questions
      };
      console.log('🔍 Updating form data with:', newFormData);
      return newFormData;
    });
    
    console.log('🔍 Populated multiple choice questions from Excel:', questions);
    
    // Show success notification
    showNotification(`Successfully loaded ${excelData.length} questions from CSV file!`, 'success');
    
    // Setup auto-save
    setupMultipleChoiceFormAutoSave();
    
    // Re-attach any necessary event listeners
    reattachFormEventListeners('multiple-choice');
  }, [formData.numOptions, setupMultipleChoiceFormAutoSave, showNotification]);
  
  // Populate true/false from Excel (exact copy from legacy)
  const populateTrueFalseFromExcel = useCallback((excelData) => {
    console.log('🔍 populateTrueFalseFromExcel called with:', excelData);
    
    const questions = {};
    
    excelData.forEach((row, index) => {
      const questionId = index + 1;
      const questionData = {
        question: (row[0] || '').toString().trim(), // Trim Excel data like legacy
        correctAnswer: row[1]?.toString().trim().toLowerCase() === 'true' ? 'true' : 'false'
      };
      
      questions[questionId] = questionData;
    });
    
    // Update form data with Excel data
    setFormData(prev => ({
      ...prev,
      questions
    }));
    
    console.log('🔍 Populated true/false questions from Excel:', questions);
    
    // Show success notification
    showNotification(`Successfully loaded ${excelData.length} questions from CSV file!`, 'success');
    
    // Setup auto-save
    setupTrueFalseFormAutoSave();
    
    // Re-attach any necessary event listeners
    reattachFormEventListeners('true-false');
  }, [setupTrueFalseFormAutoSave, showNotification]);
  
  // Populate input from Excel (exact copy from legacy)
  const populateInputFromExcel = useCallback((excelData) => {
    console.log('🔍 populateInputFromExcel called with:', excelData);
    
    const questions = {};
    
    excelData.forEach((row, index) => {
      const questionId = index + 1;
      
      // Extract all answers from the row (columns 1 onwards)
      const answers = [];
      for (let i = 1; i < row.length; i++) {
        const answer = (row[i] || '').toString().trim();
        if (answer) {
          answers.push(answer);
        }
      }
      
      const questionData = {
        question: (row[0] || '').toString().trim(), // Trim Excel data like legacy
        correctAnswer: answers[0] || '', // First answer as primary
        correct_answers: answers // All answers as array for multiple correct answers (with underscore)
      };
      
      console.log(`🔍 Excel question ${questionId} data:`, questionData);
      questions[questionId] = questionData;
    });
    
    // Update form data with Excel data
    setFormData(prev => ({
      ...prev,
      questions
    }));
    
    console.log('🔍 Populated input questions from Excel:', questions);
    
    // Show success notification
    showNotification(`Successfully loaded ${excelData.length} questions from Excel file!`, 'success');
    
    // Setup auto-save
    setupInputFormAutoSave();
    
    // Re-attach any necessary event listeners
    reattachFormEventListeners('input');
  }, [setupInputFormAutoSave, showNotification]);
  
  // Reattach form event listeners (exact copy from legacy)
  const reattachFormEventListeners = useCallback((testType) => {
    console.log(`🔍 Reattaching form event listeners for test type: ${testType}`);
    
    // Remove existing event listeners to prevent duplicates
    const existingListeners = document.querySelectorAll('[data-listener-attached="true"]');
    existingListeners.forEach(element => {
      element.removeEventListener('input', () => {});
      element.removeAttribute('data-listener-attached');
    });
    
    // Reattach event listeners based on test type
    switch (testType) {
      case 'multiple-choice':
        setupMultipleChoiceFormAutoSave();
        break;
      case 'true-false':
        setupTrueFalseFormAutoSave();
        break;
      case 'input':
        setupInputFormAutoSave();
        break;
      default:
        console.warn('Unknown test type for event listener reattachment:', testType);
    }
    
    console.log(`✅ Form event listeners reattached for test type: ${testType}`);
  }, [setupMultipleChoiceFormAutoSave, setupTrueFalseFormAutoSave, setupInputFormAutoSave]);
  
  // Restore test creation state (exact copy from legacy)
  const restoreTestCreationState = useCallback(() => {
    const stateData = localStorage.getItem('test_creation_state');
    if (!stateData) {
      console.log('🔍 No test creation state found in localStorage');
      return false;
    }
    
    try {
      const state = JSON.parse(stateData);
      console.log('🔍 Found test creation state:', state);
      
      // Check if state is recent (within last 30 minutes)
      const stateAge = Date.now() - state.timestamp;
      const maxAge = 30 * 60 * 1000; // 30 minutes
      
      if (stateAge > maxAge) {
        console.log('🔍 Test creation state is too old, clearing it');
        clearTestCreationState();
        return false;
      }
      
      // Restore the state
      setIsInTestCreation(true);
      console.log('🔍 Restored isInTestCreation flag to true');
      
      // Disable navigation buttons
      disableNavigationButtons();
      
      // Restore Excel upload state
      if (state.excelState) {
        resetExcelUploadState();
      }
      
      // Show the appropriate step
      switch (state.currentStep) {
        case 'testTypeSelection':
          console.log('🔍 Restoring test type selection step');
          setCurrentStep('typeSelection');
          break;
        case 'multipleChoiceForm':
          console.log('🔍 Restoring multiple choice form step');
          setTestType('multipleChoice');
          setCurrentStep('formCreation');
          break;
        case 'trueFalseForm':
          console.log('🔍 Restoring true/false form step');
          setTestType('trueFalse');
          setCurrentStep('formCreation');
          break;
        case 'inputForm':
          console.log('🔍 Restoring input form step');
          setTestType('input');
          setCurrentStep('formCreation');
          break;
        case 'testAssignment':
        case 'assignment':
          console.log('🔍 Restoring test assignment step');
          // Note: We can't restore assignment step without test data, so go back to type selection
          // This matches the legacy behavior - assignment step can't be restored
          console.log('🔍 Cannot restore test assignment step without test data, going back to type selection');
          setCurrentStep('typeSelection');
          break;
        default:
          console.log('🔍 Unknown step in state, defaulting to type selection');
          setCurrentStep('typeSelection');
      }
      
      // Restore form data for the current step
      restoreFormDataForStep(state.currentStep);
      
      return true;
    } catch (error) {
      console.error('🔍 Error restoring test creation state:', error);
      clearTestCreationState();
      return false;
    }
  }, [clearTestCreationState, disableNavigationButtons, resetExcelUploadState, restoreFormDataForStep]);
  
  // Initialize component
  useEffect(() => {
    console.log('👨‍🏫 Initializing Teacher Tests...');
    initializeTestCreation();
    
    // Try to restore test creation state
    restoreTestCreationState();
    
    // Load available classes for assignment
    loadAvailableClasses();
    
    // Initialize Excel upload functionality
    initializeExcelUploadForAllTestTypes();
  }, [initializeTestCreation, restoreTestCreationState, loadAvailableClasses, initializeExcelUploadForAllTestTypes]);

  // Initialize Excel upload when buttons are rendered
  useEffect(() => {
    if (formData.numQuestions > 0 && testType && testType !== 'matching' && testType !== 'drawing' && testType !== 'fillBlanks') {
      console.log('🔍 Excel upload buttons rendered, initializing event listeners...');
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        initializeExcelUploadForAllTestTypes();
      }, 100);
    }
  }, [formData.numQuestions, testType, initializeExcelUploadForAllTestTypes]);
  
  // Handle test type selection
  const handleTestTypeSelection = (type) => {
    console.log('👨‍🏫 Test type selected:', type);
    console.log('👨‍🏫 Setting testType to:', type);
    setTestType(type);
    setCurrentStep('formCreation');
    setFormData({ testName: '', numQuestions: 0, numOptions: 0, questions: {}, enableTimer: false, timerMinutes: '' });
    saveTestCreationState('formCreation');
    
    // Initialize Excel upload for the new test type
    setTimeout(() => {
      initializeExcelUploadForAllTestTypes();
    }, 100); // Small delay to ensure DOM is updated
  };

  // Handle form data changes
  const handleFormDataChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle question data changes
  const handleQuestionChange = (questionId, field, value) => {
    setFormData(prev => ({
      ...prev,
      questions: {
        ...prev.questions,
        [questionId]: {
          ...prev.questions[questionId],
          [field]: value
        }
      }
    }));
  };

  // Create test questions based on type
  const createTestQuestions = (type, testName, numQuestions, numOptions = 0) => {
    const questions = {};
    
    for (let i = 1; i <= numQuestions; i++) {
      if (type === 'multipleChoice') {
        questions[i] = {
          question: '',
          options: Array.from({ length: numOptions }, () => ''), // Create array of empty strings
          correctAnswer: ''
        };
      } else if (type === 'trueFalse') {
        questions[i] = {
          question: '',
          correctAnswer: ''
        };
      } else if (type === 'input') {
        questions[i] = {
          question: '',
          correct_answers: ['']
        };
      }
    }
    
    setFormData(prev => ({
      ...prev,
      questions
    }));
    
    // Show Excel upload buttons after questions are created
    if (type === 'multipleChoice') {
      showExcelUploadButton('multiple-choice');
      showExcelHint('multiple-choice');
    } else if (type === 'trueFalse') {
      showExcelUploadButton('true-false');
      showExcelHint('true-false');
    } else if (type === 'input') {
      showExcelUploadButton('input');
      showExcelHint('input');
    }
  };

  // Save test
  const saveTest = async () => {
    if (!testType || !formData.testName || !formData.numQuestions) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }
    
    // Don't save to database yet - just proceed to assignment step
    console.log('👨‍🏫 Test form completed, proceeding to assignment step');
    
    // Save the test data locally for the assignment step
    saveTestCreationState('testAssignment', formData);
    
    // Proceed to assignment step where subject will be selected
    setCurrentStep('testAssignment');
    showNotification('Test form completed! Now select classes and subjects.', 'success');
  };


  // Handle class selection
  const handleClassSelection = (grade, className, isSelected, subjectId, subjectName) => {
    const classKey = `${grade}/${className}/${subjectId}`;
    if (isSelected) {
      setSelectedClasses(prev => [...prev, { 
        grade, 
        class: className, 
        subject_id: subjectId,
        subject: subjectName 
      }]);
      } else {
      setSelectedClasses(prev => prev.filter(c => !(
        c.grade === grade && 
        c.class === className && 
        c.subject_id === subjectId
      )));
    }
  };

  // Excel upload functionality removed - matching tests now use visual interface

  // Handle matching test save
  const handleMatchingTestSave = useCallback(async (testData) => {
    console.log('🎯 [DEBUG] handleMatchingTestSave called');
    console.log('🎯 [DEBUG] Received testData:', testData);
    console.log('🎯 [DEBUG] Current formData:', formData);
    console.log('🎯 [DEBUG] Current testType:', testType);
    console.log('🎯 [DEBUG] Current user:', user);
    console.log('🎯 [DEBUG] Current currentStep:', currentStep);
    
    setIsSavingTest(true);
    
    try {
      // Convert matching test data to the format expected by save-matching-type-test
      const questions = testData.blocks.map((block, index) => {
        const word = testData.words.find(w => w.blockId === block.id)?.word || `Word ${index + 1}`;
        const hasArrow = testData.arrows.some(arrow => arrow.startBlock === block.id);
        const arrow = testData.arrows.find(arrow => arrow.startBlock === block.id) || null;
        
        return {
          question_id: index + 1,
          word: word,
          block_coordinates: {
            x: block.x,
            y: block.y,
            width: block.width,
            height: block.height
          },
          has_arrow: hasArrow,
          arrow: arrow ? {
            startX: arrow.startX,
            startY: arrow.startY,
            endX: arrow.endX,
            endY: arrow.endY,
            style: arrow.style || {}
          } : null
        };
      });

      // Prepare the test data for the API
      const payload = {
        teacher_id: user.teacher_id,
        test_name: formData.testName || `Matching Test - ${new Date().toLocaleString()}`,
        image_url: testData.imageUrl,
        num_blocks: testData.blocks.length,
        questions: questions,
        assignments: [] // Will be filled in the assignment step
      };

      console.log('📦 Sending matching test payload:', payload);

      // Create the form data for the assignment step
      const assignmentFormData = {
        ...formData,
        testName: payload.test_name,
        numQuestions: payload.num_blocks,
        numOptions: 0,
        questions: questions.reduce((acc, q, index) => {
          acc[index + 1] = {
            question: q.word,
            correctAnswer: q.word,
            options: []
          };
          return acc;
        }, {}),
        matchingTestData: testData // Store the visual matching test data
      };

      console.log('📦 Assignment form data:', assignmentFormData);

      // Update the form data state with the matching test data
      setFormData(assignmentFormData);

      // Save the test data locally for the assignment step
      saveTestCreationState('testAssignment', assignmentFormData);

      console.log('📦 Setting current step to testAssignment');
      setCurrentStep('testAssignment');
      showNotification('Matching test data saved! Now select classes and subjects.', 'success');
    } catch (error) {
      console.error('❌ Error saving matching test:', error);
      showNotification('Failed to save matching test: ' + error.message, 'error');
    } finally {
      setIsSavingTest(false);
    }
  }, [user, formData, testType, showNotification, saveTestCreationState]);

  // Handle matching test cancel
  const handleMatchingTestCancel = useCallback(() => {
    console.log('❌ Cancelling matching test creation');
    setCurrentStep('typeSelection');
    setFormData({
      testName: '',
      numQuestions: 0,
      numOptions: 0,
      questions: {}
    });
  }, []);

  // Handle word matching test save
  const handleWordMatchingTestSave = useCallback(async (testData) => {
    console.log('🎯 [DEBUG] handleWordMatchingTestSave called');
    console.log('🎯 [DEBUG] Received testData:', testData);
    
    setIsSavingTest(true);
    
    try {
      // Store the word matching test data
      setFormData(prev => ({
        ...prev,
        wordMatchingData: testData,
        numQuestions: testData.numQuestions || testData.wordPairs?.length || 0
      }));
      
      // Move to assignment step
      setCurrentStep('testAssignment');
      showNotification('Word matching test created! Now assign it to classes.', 'success');
    } catch (error) {
      console.error('Error saving word matching test:', error);
      showNotification('Failed to save word matching test: ' + error.message, 'error');
    } finally {
      setIsSavingTest(false);
    }
  }, [showNotification]);

  // Handle word matching test cancel
  const handleWordMatchingTestCancel = useCallback(() => {
    console.log('❌ Cancelling word matching test creation');
    setCurrentStep('typeSelection');
    setFormData({
      testName: '',
      numQuestions: 0,
      numOptions: 0,
      questions: {}
    });
  }, []);

  // Drawing Test Handlers
  const handleDrawingTestSave = useCallback(async (testData) => {
    console.log('🎯 [DEBUG] handleDrawingTestSave called');
    console.log('🎯 [DEBUG] Received testData:', testData);
    
    setIsSavingTest(true);
    
    try {
      // Store the drawing test data
      setFormData(prev => ({
        ...prev,
        drawingData: testData,
        numQuestions: testData.num_questions || testData.questions?.length || 0
      }));
      
      // Move to assignment step (like word matching tests)
      setCurrentStep('testAssignment');
      showNotification('Drawing test created! Now assign it to classes.', 'success');
    } catch (error) {
      console.error('❌ Error saving drawing test:', error);
      showNotification('Error saving drawing test', 'error');
    } finally {
      setIsSavingTest(false);
    }
  }, [showNotification]);

  const handleDrawingTestCancel = useCallback(() => {
    console.log('❌ Cancelling drawing test creation');
    setCurrentStep('typeSelection');
    setFormData({
      testName: '',
      numQuestions: 0,
      numOptions: 0,
      questions: {}
    });
  }, []);

  // Handle fill blanks test cancel
  const handleFillBlanksTestCancel = useCallback(() => {
    console.log('❌ Cancelling fill blanks test creation');
    setCurrentStep('typeSelection');
    setFormData({
      testName: '',
      numQuestions: 0,
      numOptions: 0,
      questions: {}
    });
  }, []);

  const handleFillBlanksTestSave = useCallback(async (testData) => {
    console.log('🎯 [DEBUG] handleFillBlanksTestSave called');
    console.log('🎯 [DEBUG] Received testData:', testData);
    
    setIsSavingTest(true);
    
    try {
      // Store the fill blanks test data
      setFormData(prev => ({
        ...prev,
        fillBlanksData: testData,
        numQuestions: testData.num_questions || testData.blanks?.length || 0
      }));
      
      // Move to assignment step (like drawing tests)
      setCurrentStep('testAssignment');
      showNotification('Fill blanks test created! Now assign it to classes.', 'success');
    } catch (error) {
      console.error('❌ Error saving fill blanks test:', error);
      showNotification('Error saving fill blanks test', 'error');
    } finally {
      setIsSavingTest(false);
    }
  }, [showNotification]);

  // Handle speaking test cancel
  const handleSpeakingTestCancel = useCallback(() => {
    console.log('❌ Cancelling speaking test creation');
    setCurrentStep('typeSelection');
    setFormData({
      testName: '',
      numQuestions: 0,
      numOptions: 0,
      questions: {}
    });
  }, []);

  const handleSpeakingTestSave = useCallback(async (testData) => {
    console.log('🎯 [DEBUG] handleSpeakingTestSave called');
    console.log('🎯 [DEBUG] Received testData:', testData);
    
    setIsSavingTest(true);
    
    try {
      // Store the speaking test data
      setFormData(prev => ({
        ...prev,
        speakingData: testData,
        numQuestions: testData.questions?.length || 0
      }));
      
      // Move to assignment step (like drawing tests)
      setCurrentStep('testAssignment');
      showNotification('Speaking test created! Now assign it to classes.', 'success');
    } catch (error) {
      console.error('❌ Error saving speaking test:', error);
      showNotification('Error saving speaking test', 'error');
    } finally {
      setIsSavingTest(false);
    }
  }, [showNotification]);
    
    return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {currentStep === 'typeSelection' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div className="flex items-center justify-between mb-4">
                  <Button
                    variant="outline"
                    onClick={() => window.history.back()}
                    className="flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Back to Main</span>
                  </Button>
                  <div className="flex-1"></div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Test</h2>
                <p className="text-gray-600">Choose the type of test you want to create</p>
              </div>
          
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { type: 'multipleChoice', title: 'Multiple Choice', description: 'Questions with multiple answer options', icon: '/pics/multiple-choice.png' },
                  { type: 'trueFalse', title: 'True/False', description: 'Questions with true or false answers', icon: '/pics/true-false.png' },
                  { type: 'input', title: 'Input', description: 'Questions requiring text input', icon: '/pics/input.png' },
                  { type: 'matching', title: 'Picture Matching', description: 'Labeling pictures', icon: '/pics/matching.png' },
                  { type: 'wordMatching', title: 'Word Matching', description: 'Matching word pairs by dragging or drawing arrows', icon: '/pics/matching-words.png' },
                  { type: 'drawing', title: 'Drawing Test', description: 'Interactive drawing tests with canvas for students', icon: '/pics/drawing.png' },
                  { type: 'fillBlanks', title: 'Fill Blanks', description: 'Text with multiple choice blanks', icon: '/pics/fill-blanks.png' },
                  { type: 'speaking', title: 'Speaking Test', description: 'Audio recording with AI-powered feedback', icon: '/pics/speaking.png' }
                ].map(({ type, title, description, icon }) => (
                  <motion.div
                    key={type}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="cursor-pointer"
                    onClick={() => handleTestTypeSelection(type)}
                  >
                    <Card className="h-full text-center hover:shadow-lg transition-shadow">
                      <div className="mb-3 flex justify-center">
                        <img src={icon} alt={title} className="w-12 h-12 object-contain" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                      <p className="text-sm text-gray-600">{description}</p>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {currentStep === 'formCreation' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={showTestTypeSelection}>
                      ← Back to Test Types
                    </Button>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Create {testType === 'multipleChoice' ? 'Multiple Choice' : testType === 'trueFalse' ? 'True/False' : testType === 'input' ? 'Input' : testType === 'drawing' ? 'Drawing' : testType === 'fillBlanks' ? 'Fill Blanks' : testType === 'wordMatching' ? 'Word Matching' : testType === 'speaking' ? 'Speaking' : 'Picture Matching'} Test</h2>
                    <p className="text-gray-600">Fill in the test details and questions</p>
                  </div>
                </div>
      </div>
          
              {/* Basic Test Information */}
              <Card>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Test Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
                    <input
                      type="text"
                      value={formData.testName}
                      onChange={(e) => handleFormDataChange('testName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter test name"
                    />
                  </div>
        
        {testType !== 'matching' && testType !== 'wordMatching' && testType !== 'drawing' && testType !== 'fillBlanks' && testType !== 'speaking' && (
          <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Number of Questions</label>
              <input
                type="number"
                        min="1"
                        max="50"
                        value={formData.numQuestions}
                        onChange={(e) => {
                          const numQuestions = parseInt(e.target.value) || 0;
                          handleFormDataChange('numQuestions', numQuestions);
                          if (numQuestions > 0) {
                            createTestQuestions(testType, formData.testName, numQuestions, formData.numOptions);
                          }
                        }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter number of questions"
              />
            </div>
        )}

                  {testType === 'multipleChoice' && (
          <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Number of Options per Question</label>
            <input
              type="number"
                        min="2"
                        max="6"
                        value={formData.numOptions}
              onChange={(e) => {
                          const numOptions = parseInt(e.target.value) || 0;
                          handleFormDataChange('numOptions', numOptions);
                          
                          // Show warning if user selects less than 2 options
                          if (numOptions > 0 && numOptions < 2) {
                            showNotification('Multiple choice tests require at least 2 options per question. Please enter 2 or more.', 'warning');
                          }
                          
                          if (formData.numQuestions > 0) {
                            createTestQuestions(testType, formData.testName, formData.numQuestions, numOptions);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter number of options (2-6)"
            />
          </div>
                  )}

                  {/* Timer settings - Hide for speaking tests */}
                  {testType !== 'speaking' && (
                    <div className="space-y-4">
                      {/* Timer checkbox - First line */}
                      <div className="flex items-center space-x-2">
                        <label className="inline-flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={!!formData.enableTimer}
                            onChange={(e) => handleFormDataChange('enableTimer', e.target.checked)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">Enable timer for this test</span>
                        </label>
                        {formData.enableTimer && (
                          <div className="flex items-center space-x-2">
                            <label className="text-sm text-gray-700">Time (minutes):</label>
                            <input
                              type="number"
                              min="1"
                              max="1440"
                              value={formData.timerMinutes}
                              onChange={(e) => handleFormDataChange('timerMinutes', e.target.value.replace(/[^0-9]/g, ''))}
                              className="w-28 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="e.g. 30"
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Shuffle checkbox - Second line - Hide for drawing, matching, word matching, fill blanks, and speaking tests */}
                      {testType !== 'drawing' && testType !== 'matching' && testType !== 'wordMatching' && testType !== 'fillBlanks' && testType !== 'speaking' && (
                        <div className="flex items-center space-x-2">
                          <label className="inline-flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={!!formData.isShuffled}
                              onChange={(e) => handleFormDataChange('isShuffled', e.target.checked)}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">Shuffle questions during test</span>
                          </label>
                        </div>
                      )}
                    </div>
                  )}
        </div>
              </Card>

              {/* Matching Test Interface */}
              {testType === 'matching' && (
                <Card>
                  <div className="space-y-4 text-center">
                    <h3 className="text-lg font-semibold text-gray-900">Create Picture Matching Test</h3>
                    <p className="text-sm text-gray-600">
                      Upload an image and create interactive matching blocks with words.
                    </p>
                    <MatchingTestCreator
                      testName={formData.testName}
                      onTestSaved={handleMatchingTestSave}
                      onCancel={handleMatchingTestCancel}
                      onBackToCabinet={returnToMainCabinet}
                      isSaving={isSavingTest}
                      validationErrors={{}}
                    />
                  </div>
                </Card>
              )}

              {testType === 'wordMatching' && (
                <Card>
                  <div className="space-y-4 text-center">
                    <h3 className="text-lg font-semibold text-gray-900">Create Word Matching Test</h3>
                    <p className="text-sm text-gray-600">
                      Create word pairs for students to match by dragging or drawing arrows.
                    </p>
                    <WordMatchingCreator
                      testName={formData.testName}
                      onTestSaved={handleWordMatchingTestSave}
                      onCancel={handleWordMatchingTestCancel}
                      onBackToCabinet={returnToMainCabinet}
                      isSaving={isSavingTest}
                      validationErrors={{}}
                    />
                  </div>
                </Card>
              )}

              {/* Drawing Test Interface */}
              {testType === 'drawing' && (
                <Card>
                  {console.log('🎨 Rendering DrawingTestCreator, testType:', testType)}
                  <DrawingTestCreator
                    testName={formData.testName}
                    onTestSaved={handleDrawingTestSave}
                    onCancel={handleDrawingTestCancel}
                    onBackToCabinet={returnToMainCabinet}
                    isSaving={isSavingTest}
                    validationErrors={{}}
                  />
                </Card>
              )}

              {/* Fill Blanks Test Interface */}
              {testType === 'fillBlanks' && (
                <Card>
                  {console.log('📝 Rendering FillBlanksTestCreator, testType:', testType)}
                  <FillBlanksTestCreator
                    testName={formData.testName}
                    allowedTime={formData.enableTimer ? parseInt(formData.timerMinutes) || null : null}
                    onTestSaved={handleFillBlanksTestSave}
                    onCancel={handleFillBlanksTestCancel}
                    onBackToCabinet={returnToMainCabinet}
                    isSaving={isSavingTest}
                    validationErrors={{}}
                  />
                </Card>
              )}

              {/* Speaking Test Interface */}
              {testType === 'speaking' && (
                <Card>
                  {console.log('🎤 Rendering SpeakingTestCreator, testType:', testType)}
                  <SpeakingTestCreator
                    testName={formData.testName}
                    onTestSaved={handleSpeakingTestSave}
                    onCancel={handleSpeakingTestCancel}
                    onBackToCabinet={returnToMainCabinet}
                    isSaving={isSavingTest}
                    validationErrors={{}}
                  />
                </Card>
              )}

              {/* Excel Upload Section - Only show for non-matching, non-drawing, non-fill-blanks, and non-speaking tests */}
              {testType !== 'matching' && testType !== 'drawing' && testType !== 'fillBlanks' && testType !== 'speaking' && formData.numQuestions > 0 && (
                <Card>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Excel Upload</h3>
                    <p className="text-sm text-gray-600">
                      Upload an Excel file to automatically populate questions, or fill them in manually below.
                    </p>
                    
                    {/* Excel Upload Buttons */}
                    <div className="space-y-6">
                      {testType === 'multipleChoice' && excelUploadState.multipleChoice?.buttonVisible && (
                        <div className="flex items-start space-x-4">
                          <div className="flex flex-col items-center">
                            <button
                              type="button"
                              className="excel-upload-btn px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-3 min-h-[60px] disabled:opacity-50 disabled:cursor-not-allowed"
                              data-test-type="multiple-choice"
                              disabled={isUploadingExcel}
                            >
                              {isUploadingExcel ? (
                                <>
                                  <LoadingSpinner size="sm" color="white" />
                                  <span className="font-medium">Processing...</span>
                                </>
                              ) : (
                                <>
                                  <img src="/pics/excel.png" alt="Excel" className="w-6 h-6 object-contain" />
                                  <span className="font-medium">Upload Excel</span>
                                </>
                              )}
                            </button>
                            <input
                              type="file"
                              accept=".xlsx,.xls"
                              className="excel-file-input hidden"
                              data-test-type="multiple-choice"
                            />
                          </div>
                          <div className="w-fit">
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md min-h-[60px] flex items-start">
                              <div className="text-sm text-blue-800">
                                <strong>Multiple Choice Format:</strong>
                                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                  <div>Column 1: Question</div>
                                  <div>Column 2: Correct Answer (A-F)</div>
                                  <div>Column 3: Option A text</div>
                                  <div>Column 4: Option B text</div>
                                  <div>Column 5: Option C text</div>
                                  <div>Column 6: Option D text</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {testType === 'trueFalse' && excelUploadState.trueFalse?.buttonVisible && (
                        <div className="flex items-start space-x-4">
                          <div className="flex flex-col items-center">
                            <button
                              type="button"
                              className="excel-upload-btn px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-3 min-h-[60px] disabled:opacity-50 disabled:cursor-not-allowed"
                              data-test-type="true-false"
                              disabled={isUploadingExcel}
                            >
                              {isUploadingExcel ? (
                                <>
                                  <LoadingSpinner size="sm" color="white" />
                                  <span className="font-medium">Processing...</span>
                                </>
                              ) : (
                                <>
                                  <img src="/pics/excel.png" alt="Excel" className="w-6 h-6 object-contain" />
                                  <span className="font-medium">Upload Excel</span>
                                </>
                              )}
                            </button>
                            <input
                              type="file"
                              accept=".xlsx,.xls"
                              className="excel-file-input hidden"
                              data-test-type="true-false"
                            />
                          </div>
                          <div className="w-fit">
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md min-h-[60px] flex items-start">
                              <div className="text-xs text-blue-800">
                                <div><strong>Format:</strong> Question | Answer (true/false)</div>
                                <div className="mt-1"><strong>Example:</strong> The Earth is round | true</div>
                                <div className="mt-1"><strong>Note:</strong> Headers are optional</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {testType === 'input' && excelUploadState.input?.buttonVisible && (
                        <div className="flex items-start space-x-4">
                          <div className="flex flex-col items-center">
                            <button
                              type="button"
                              className="excel-upload-btn px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-3 min-h-[60px] disabled:opacity-50 disabled:cursor-not-allowed"
                              data-test-type="input"
                              disabled={isUploadingExcel}
                            >
                              {isUploadingExcel ? (
                                <>
                                  <LoadingSpinner size="sm" color="white" />
                                  <span className="font-medium">Processing...</span>
                                </>
                              ) : (
                                <>
                                  <img src="/pics/excel.png" alt="Excel" className="w-6 h-6 object-contain" />
                                  <span className="font-medium">Upload Excel</span>
                                </>
                              )}
                            </button>
                            <input
                              type="file"
                              accept=".xlsx,.xls"
                              className="excel-file-input hidden"
                              data-test-type="input"
                            />
                          </div>
                          <div className="w-fit">
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md min-h-[60px] flex items-start">
                              <div className="text-sm text-blue-800">
                                <strong>Input Test Format:</strong>
                                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                  <div>Column 1: Question</div>
                                  <div>Column 2: Answer 1</div>
                                  <div>Column 3: Answer 2 (optional)</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {/* Manual Entry Section - Only show for non-matching, non-drawing, and non-fill-blanks tests */}
              {testType !== 'matching' && testType !== 'drawing' && testType !== 'fillBlanks' && formData.numQuestions > 0 && (
                <Card>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Manual Question Entry</h3>
                    <p className="text-sm text-gray-600">
                      Fill in the questions manually using the form below.
                    </p>
                  </div>
                </Card>
              )}
                
              {/* Questions Section */}
              {formData.numQuestions > 0 && (
                <Card>
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
                    <div className="space-y-6">
                      {Object.keys(formData.questions).map((questionId) => (
                        <div key={questionId} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">Question {questionId}</h4>
                          
                          <div className="space-y-3">
                  <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                              <div className="relative">
                    <textarea
                                value={formData.questions[questionId]?.question || ''}
                                onChange={(e) => handleQuestionChange(questionId, 'question', e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="2"
                                placeholder="Enter the question text"
                                id={`question_${questionId}`}
                    />
                    <MathEditorButton
                      showPreview={true}
                      inputRef={() => document.getElementById(`question_${questionId}`)}
                      onChange={(e) => handleQuestionChange(questionId, 'question', e.target.value)}
                    />
                              </div>
                  </div>
                  
                            {testType === 'multipleChoice' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Answer Options</label>
                    <div className="space-y-2">
                                  {formData.questions[questionId]?.options?.map((option, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                      <span className="w-6 text-sm font-medium text-gray-700">
                                        {String.fromCharCode(65 + index)}:
                          </span>
                          <div className="relative flex-1">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                                          const newOptions = [...formData.questions[questionId].options];
                                          newOptions[index] = e.target.value;
                                          handleQuestionChange(questionId, 'options', newOptions);
                            }}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                        id={`option_${questionId}_${index}`}
                                      />
                          <MathEditorButton
                      showPreview={true}
                            inputRef={() => document.getElementById(`option_${questionId}_${index}`)}
                            onChange={(e) => {
                              const newOptions = [...formData.questions[questionId].options];
                              newOptions[index] = e.target.value;
                              handleQuestionChange(questionId, 'options', newOptions);
                            }}
                          />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                            )}
                  
                  <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {testType === 'multipleChoice' ? 'Correct Answer' : 
                                 testType === 'trueFalse' ? 'Correct Answer' : 'Correct Answer'}
                              </label>
                              {testType === 'multipleChoice' ? (
                    <div>
                      <select
                        value={formData.questions[questionId]?.correctAnswer || ''}
                        onChange={(e) => handleQuestionChange(questionId, 'correctAnswer', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select correct answer</option>
                        {formData.questions[questionId]?.options?.map((_, index) => (
                          <option key={index} value={String.fromCharCode(65 + index)}>
                            {String.fromCharCode(65 + index)}
                          </option>
                        ))}
                      </select>
                    </div>
                              ) : testType === 'trueFalse' ? (
                    <select
                                  value={formData.questions[questionId]?.correctAnswer || ''}
                                  onChange={(e) => handleQuestionChange(questionId, 'correctAnswer', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select correct answer</option>
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                              ) : (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer(s)</label>
                    <div className="space-y-2">
                      {/* Primary answer */}
                      <div className="relative">
                      <input
                        type="text"
                        value={formData.questions[questionId]?.correct_answers?.[0] || ''}
                        onChange={(e) => {
                          const currentAnswers = formData.questions[questionId]?.correct_answers || [''];
                          const newAnswers = [...currentAnswers];
                          newAnswers[0] = e.target.value;
                          handleQuestionChange(questionId, 'correct_answers', newAnswers);
                        }}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter the primary correct answer"
                        id={`answer_${questionId}_0`}
                      />
                      <MathEditorButton
                      showPreview={true}
                        inputRef={() => document.getElementById(`answer_${questionId}_0`)}
                        onChange={(e) => {
                          const currentAnswers = formData.questions[questionId]?.correct_answers || [''];
                          const newAnswers = [...currentAnswers];
                          newAnswers[0] = e.target.value;
                          handleQuestionChange(questionId, 'correct_answers', newAnswers);
                        }}
                      />
                      </div>
                      
                      {/* Additional answers */}
                      {formData.questions[questionId]?.correct_answers?.slice(1).map((answer, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="relative flex-1">
                          <input
                            type="text"
                            value={answer}
                            onChange={(e) => {
                              const newAnswers = [...(formData.questions[questionId]?.correct_answers || [])];
                              newAnswers[index + 1] = e.target.value;
                              handleQuestionChange(questionId, 'correct_answers', newAnswers);
                            }}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={`Alternative answer ${index + 2}`}
                            id={`answer_${questionId}_${index + 1}`}
                          />
                          <MathEditorButton
                      showPreview={true}
                            inputRef={() => document.getElementById(`answer_${questionId}_${index + 1}`)}
                            onChange={(e) => {
                              const newAnswers = [...(formData.questions[questionId]?.correct_answers || [])];
                              newAnswers[index + 1] = e.target.value;
                              handleQuestionChange(questionId, 'correct_answers', newAnswers);
                            }}
                          />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newAnswers = [...(formData.questions[questionId]?.correct_answers || [])];
                              newAnswers.splice(index + 1, 1);
                              handleQuestionChange(questionId, 'correct_answers', newAnswers);
                            }}
                            className="px-2 py-1 text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      )) || []}
                      
                      {/* Add answer button */}
                      <button
                        type="button"
                        onClick={() => {
                          const currentAnswers = formData.questions[questionId]?.correct_answers || [''];
                          const newAnswers = [...currentAnswers, ''];
                          handleQuestionChange(questionId, 'correct_answers', newAnswers);
                        }}
                        className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm border border-blue-300 rounded-md hover:bg-blue-50"
                      >
                        + Add Alternative Answer
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      You can add multiple correct answers for the same question. Students will get credit for any of them.
                    </p>
                  </div>
                              )}
          </div>
          </div>
        </div>
                      ))}
        </div>
          </div>
                </Card>
              )}

              {/* Save Button */}
              {formData.testName && formData.numQuestions > 0 && (
                <div className="flex justify-end">
                  <Button
                    onClick={saveTest}
                    disabled={isSavingTest}
                    className="px-8"
                  >
                    {isSavingTest ? (
                      <>
                        <LoadingSpinner size="sm" color="white" className="mr-2" />
                        Saving Test...
                      </>
                    ) : (
                      'Save Test & Continue to Assignment'
                    )}
                  </Button>
          </div>
              )}
            </motion.div>
          )}

          {currentStep === 'testAssignment' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => window.history.back()}
                    className="flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Back to Main</span>
                  </Button>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Assign Test to Classes</h2>
                    <p className="text-gray-600">Select which classes should take this test</p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setCurrentStep('formCreation')}>
                  ← Back to Test Form
                </Button>
        </div>
        
              <Card>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Available Classes</h3>
                  
                  {availableClasses.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-6xl mb-4">📚</div>
                      <p className="text-gray-500 text-lg">No subjects available for assignment.</p>
                      <p className="text-sm text-gray-400 mt-2">You need to assign subjects to grades and classes first.</p>
                      <div className="mt-4">
                        <Button 
                          onClick={() => window.location.href = '/teacher/subjects'}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Go to Subjects Page
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {availableClasses.map((subject) => (
                        <div key={subject.subject_id} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">{subject.subject}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                            {subject.classes.map((classData) => (
                              <label key={`${classData.grade}-${classData.class}-${subject.subject_id}`} className="flex items-center space-x-2 cursor-pointer">
            <input
                                  type="checkbox"
                                  checked={selectedClasses.some(c => 
                                    c.grade === classData.grade && 
                                    c.class === classData.class && 
                                    c.subject_id === subject.subject_id
                                  )}
                                  onChange={(e) => handleClassSelection(
                                    classData.grade, 
                                    classData.class, 
                                    e.target.checked,
                                    subject.subject_id,
                                    subject.subject
                                  )}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">
                                  {classData.grade}/{classData.class}
                                </span>
                              </label>
                            ))}
          </div>
        </div>
                      ))}
          </div>
        )}
                </div>
              </Card>

              {/* Assignment Button */}
              {selectedClasses.length > 0 && (
                <div className="flex justify-end">
                  <Button
                    onClick={() => assignTestToClasses(testType, null)}
                    disabled={isLoading}
                    className="px-8"
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner size="sm" color="white" className="mr-2" />
                        Assigning Test...
                      </>
                    ) : (
                      `Assign Test to ${selectedClasses.length} Class${selectedClasses.length > 1 ? 'es' : ''}`
                    )}
                  </Button>
          </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        {/* Loading Overlay */}
        {console.log('🔍 Checking isAssigningTest:', isAssigningTest)}
        {isAssigningTest && (
          <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
              <p className="text-blue-600 font-semibold text-lg">Assigning test to classes...</p>
              <p className="text-gray-500 text-sm mt-1">Please wait while we process your assignment</p>
            </div>
          </div>
        )}

        {/* Save Test Loading Overlay */}
        {isSavingTest && (
          <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
              <p className="text-blue-600 font-semibold text-lg">Saving test...</p>
              <p className="text-gray-500 text-sm mt-1">Please wait while we save your test</p>
            </div>
          </div>
        )}

        {/* Notifications */}
        <div className="fixed top-4 right-4 space-y-2 z-50">
          {notifications.map(notification => (
            <Notification
              key={notification.id}
              type={notification.type}
              message={notification.message}
              duration={notification.duration}
              onClose={() => removeNotification(notification.id)}
            />
          ))}
        </div>
      </div>
    );
};

export default TeacherTests;

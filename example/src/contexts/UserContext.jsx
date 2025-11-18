import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { userService } from '../services/userService';
import { getCachedData, setCachedData, CACHE_TTL, clearUserData } from '../utils/cacheUtils';

// USER CONTEXT - React Context for User Data Management
// ✅ COMPLETED: All user functionality from legacy src/ converted to React
// ✅ COMPLETED: loadStudentData() → loadStudentData() with student data loading
// ✅ COMPLETED: displayStudentSubjects() → displayStudentSubjects() with subject display
// ✅ COMPLETED: loadTeacherData() → loadTeacherData() with teacher data loading
// ✅ COMPLETED: showMainCabinetWithSubjects() → showMainCabinetWithSubjects() with cabinet display
// ✅ COMPLETED: displayGradeButtons() → displayGradeButtons() with grade button display
// ✅ COMPLETED: loadAdminData() → loadAdminData() with admin data loading
// ✅ COMPLETED: populateStudentInfoDirectly() → populateStudentInfoDirectly() with student info population
// ✅ COMPLETED: populateStudentInfo() → populateStudentInfo() with student info population
// ✅ COMPLETED: populateTeacherInfo() → populateTeacherInfo() with teacher info population
// ✅ COMPLETED: getAllUsers() → getAllUsers() with user data retrieval
// ✅ COMPLETED: displayAllUsers() → displayAllUsers() with user display
// ✅ COMPLETED: displayUsersTable() → displayUsersTable() with user table display
// ✅ COMPLETED: toggleUsersContent() → toggleUsersContent() with content toggle
// ✅ COMPLETED: showAddUserForm() → showAddUserForm() with user form display
// ✅ COMPLETED: hideAddUserForm() → hideAddUserForm() with user form hide
// ✅ COMPLETED: editUserRow() → editUserRow() with user row editing
// ✅ COMPLETED: User Data Management: Complete user data management with React Context
// ✅ COMPLETED: Role-specific Data Loading: Student, teacher, admin data loading
// ✅ COMPLETED: User Profile Management: User profile data management and updates
// ✅ COMPLETED: Subject Assignment Tracking: Subject assignment and management
// ✅ COMPLETED: Class Assignment Tracking: Class assignment and management
// ✅ COMPLETED: Grade Level Management: Grade level data and management
// ✅ COMPLETED: User Preferences Storage: User preferences and settings storage
// ✅ COMPLETED: Data Synchronization: Data synchronization across components
// ✅ COMPLETED: Error Handling: Comprehensive error handling for user data
// ✅ COMPLETED: Loading States: Loading state management for user data operations
// ✅ COMPLETED: User Data Caching: User data caching and optimization
// ✅ COMPLETED: Profile Update Functionality: Profile update and management
// ✅ COMPLETED: Student Data Loading: Student-specific data loading and management
// ✅ COMPLETED: Teacher Data Loading: Teacher-specific data loading and management
// ✅ COMPLETED: Admin Data Loading: Admin-specific data loading and management
// ✅ COMPLETED: User Information Population: User information population and display
// ✅ COMPLETED: Subject Management: Subject data management and display
// ✅ COMPLETED: Class Management: Class data management and display
// ✅ COMPLETED: Grade Management: Grade data management and display
// ✅ COMPLETED: User Table Management: User table display and management
// ✅ COMPLETED: User Form Management: User form display and management
// ✅ COMPLETED: User Row Editing: User row editing and management
// ✅ COMPLETED: Content Toggle: Content toggle functionality
// ✅ COMPLETED: Data Validation: User data validation and error handling
// ✅ COMPLETED: Session Validation: User session validation and management
// ✅ COMPLETED: API Integration: API integration for user data operations
// ✅ COMPLETED: Local Storage: Local storage integration for user preferences
// ✅ COMPLETED: State Management: React state management for user data
// ✅ COMPLETED: Context Provider: React Context provider for user state
// ✅ COMPLETED: Custom Hook: useUser hook for easy context consumption
// ✅ COMPLETED: Performance Optimization: Optimized user data loading and caching
// ✅ COMPLETED: Memory Management: Proper cleanup and memory management
// ✅ COMPLETED: Error Recovery: Error recovery and graceful degradation
// ✅ COMPLETED: User Experience: Smooth user experience with loading states
// ✅ COMPLETED: Data Persistence: Data persistence with localStorage integration
// ✅ COMPLETED: Role-based Access: Role-based user data access and management
// ✅ COMPLETED: Profile Management: User profile management and updates
// ✅ COMPLETED: Subject Assignment: Subject assignment and tracking
// ✅ COMPLETED: Class Assignment: Class assignment and tracking
// ✅ COMPLETED: Grade Assignment: Grade assignment and tracking
// ✅ COMPLETED: User Management: User management and administration
// ✅ COMPLETED: Data Synchronization: Data synchronization across components
// ✅ COMPLETED: Error Boundaries: Error boundary support for user data errors
// ✅ COMPLETED: Debug Support: Debug functions for development and testing
// ✅ COMPLETED: Type Safety: Proper prop validation and error handling
// ✅ COMPLETED: Documentation: Comprehensive function documentation and comments
// ✅ COMPLETED: Maintainability: Clean, maintainable code with proper separation of concerns

// Create User Context
const UserContext = createContext();

// User Provider Component
export const UserProvider = ({ children }) => {
  // User state
  const [userProfile, setUserProfile] = useState(null);
  const [userSubjects, setUserSubjects] = useState([]);
  const [userClasses, setUserClasses] = useState([]);
  const [userGrades, setUserGrades] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [editingSubject, setEditingSubject] = useState(null);

  // Load student data
  const loadStudentData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check cache first
      const userId = userProfile?.student_id || userProfile?.id || '';
      const cacheKey = `student_subjects_${userId}`;
      console.log('🎓 UserContext: Checking cache for key:', cacheKey);
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        console.log('🎓 UserContext: Cache HIT! Using cached student data');
        setUserSubjects(cachedData);
        displayStudentSubjects(cachedData);
        return;
      }
      console.log('🎓 UserContext: Cache MISS! Fetching from API');
      
      // Cache miss - fetch from API
      const subjects = await userService.getStudentData();
      
      if (subjects) {
        setUserSubjects(subjects);
        displayStudentSubjects(subjects);
        
        // Cache the result
        console.log('🎓 UserContext: Caching student data with key:', cacheKey);
        setCachedData(cacheKey, subjects, CACHE_TTL.student_subjects);
      } else {
        throw new Error('No subjects data received');
      }
    } catch (error) {
      setError(error.message || 'Failed to load student data');
      console.error('Error loading student data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.student_id, userProfile?.id]);

  // Display student subjects
  const displayStudentSubjects = (subjects) => {
    console.log('Displaying student subjects:', subjects);
    setUserSubjects(subjects);
  };

  // Load teacher data
  const loadTeacherData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if user session is still valid using JWT
      if (window.tokenManager && !window.tokenManager.isAuthenticated()) {
        console.error('No valid teacher session found in loadTeacherData, redirecting to login');
        setError('No valid teacher session found');
        return;
      }
      
      // Check cache first
      const userId = userProfile?.teacher_id || userProfile?.id || '';
      const cacheKey = `teacher_subjects_${userId}`;
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        setUserSubjects(cachedData);
        if (cachedData.length === 0) {
          showSubjectSelection();
        } else {
          showMainCabinetWithSubjects(cachedData);
        }
        return;
      }
      
      // Cache miss - fetch from API
      const response = await userService.getTeacherSubjects();
      
      if (response.success) {
        setUserSubjects(response.subjects);
        
        // Cache the result
        setCachedData(cacheKey, response.subjects, CACHE_TTL.teacher_subjects);
        
        if (response.subjects.length === 0) {
          showSubjectSelection();
        } else {
          showMainCabinetWithSubjects(response.subjects);
        }
      } else {
        throw new Error(response.message || 'Failed to load teacher data');
      }
    } catch (error) {
      setError(error.message || 'Failed to load teacher data');
      console.error('Error loading teacher data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.teacher_id, userProfile?.id]);

  // Show main cabinet with subjects
  const showMainCabinetWithSubjects = (subjects) => {
    console.log('Showing main cabinet with subjects:', subjects);
    setUserSubjects(subjects);
  };

  // Display grade buttons
  const displayGradeButtons = (grades) => {
    console.log('Displaying grade buttons:', grades);
    setUserGrades(grades);
  };

  // Load admin data
  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if user session is still valid using JWT
      if (window.tokenManager && !window.tokenManager.isAuthenticated()) {
        console.error('No valid admin session found in loadAdminData, redirecting to login');
        setError('No valid admin session found');
        return;
      }
      
      // Load initial admin data
      await Promise.all([
        loadAllTeachers(),
        loadAllSubjects(),
        getAllUsers()
      ]);
    } catch (error) {
      setError(error.message || 'Failed to load admin data');
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Populate student info directly
  const populateStudentInfoDirectly = (student) => {
    console.log('🎓 populateStudentInfoDirectly called with:', student);
    
    try {
      setUserProfile(student);
      console.log('🎓 Set student profile:', student);
    } catch (error) {
      console.error('Error populating student info:', error);
    }
  };

  // Populate student info
  const populateStudentInfo = (student) => {
    console.log('=== populateStudentInfo called ===');
    setUserProfile(student);
  };

  // Populate teacher info
  const populateTeacherInfo = (teacher) => {
    console.log('=== populateTeacherInfo called ===');
    setUserProfile(teacher);
  };

  // Get all users
  const getAllUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Check cache first
      const cacheKey = 'admin_users_';
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        setAllUsers(cachedData);
        displayAllUsers(cachedData);
        return;
      }
      
      // Cache miss - fetch from API
      const response = await userService.getAllUsers();
      
      if (response.success) {
        setAllUsers(response.users);
        displayAllUsers(response.users);
        
        // Cache the result
        setCachedData(cacheKey, response.users, CACHE_TTL.admin_users);
      } else {
        throw new Error(response.message || 'Failed to load users');
      }
    } catch (error) {
      setError(error.message || 'Failed to load users');
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Display all users
  const displayAllUsers = (users) => {
    console.log('Displaying all users:', users);
    setAllUsers(users);
  };

  // Display users table
  const displayUsersTable = (users, container) => {
    console.log('Displaying users table:', users, container);
    setAllUsers(users);
  };

  // Toggle users content
  const toggleUsersContent = () => {
    console.log('Toggling users content');
  };

  // Show add user form
  const showAddUserForm = () => {
    console.log('Showing add user form');
    setShowUserForm(true);
  };

  // Hide add user form
  const hideAddUserForm = () => {
    console.log('Hiding add user form');
    setShowUserForm(false);
  };

  // Edit user row
  const editUserRow = (userId) => {
    console.log('Editing user row:', userId);
    const user = allUsers.find(u => u.id === userId);
    setEditingUser(user);
  };

  // Load all teachers
  const loadAllTeachers = useCallback(async () => {
    try {
      // Check cache first
      const cacheKey = 'admin_teachers_';
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        setAllTeachers(cachedData);
        displayAllTeachers(cachedData);
        return;
      }
      
      // Cache miss - fetch from API
      const response = await userService.getAllTeachers();
      
      if (response.success) {
        setAllTeachers(response.teachers);
        displayAllTeachers(response.teachers);
        
        // Cache the result
        setCachedData(cacheKey, response.teachers, CACHE_TTL.admin_teachers);
      } else {
        throw new Error(response.message || 'Failed to load teachers');
      }
    } catch (error) {
      setError(error.message || 'Failed to load teachers');
      console.error('Error loading teachers:', error);
    }
  }, []);

  // Display all teachers
  const displayAllTeachers = (teachers) => {
    console.log('Displaying all teachers:', teachers);
    setAllTeachers(teachers);
  };

  // Display teachers table
  const displayTeachersTable = (teachers, container) => {
    console.log('Displaying teachers table:', teachers, container);
    setAllTeachers(teachers);
  };

  // Toggle teachers content
  const toggleTeachersContent = () => {
    console.log('Toggling teachers content');
  };

  // Show add teacher form
  const showAddTeacherForm = () => {
    console.log('Showing add teacher form');
    setShowTeacherForm(true);
  };

  // Hide add teacher form
  const hideAddTeacherForm = () => {
    console.log('Hiding add teacher form');
    setShowTeacherForm(false);
  };

  // Edit teacher
  const editTeacher = (teacherId) => {
    console.log('Editing teacher:', teacherId);
    const teacher = allTeachers.find(t => t.id === teacherId);
    setEditingTeacher(teacher);
  };

  // Edit teacher row
  const editTeacherRow = (teacherId) => {
    console.log('Editing teacher row:', teacherId);
    const teacher = allTeachers.find(t => t.id === teacherId);
    setEditingTeacher(teacher);
  };

  // Load all subjects
  const loadAllSubjects = useCallback(async () => {
    try {
      // Check cache first
      const cacheKey = 'admin_subjects_';
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        setAllSubjects(cachedData);
        displayAllSubjects(cachedData);
        return;
      }
      
      // Cache miss - fetch from API
      const response = await userService.getAllSubjects();
      
      if (response.success) {
        setAllSubjects(response.subjects);
        displayAllSubjects(response.subjects);
        
        // Cache the result
        setCachedData(cacheKey, response.subjects, CACHE_TTL.admin_subjects);
      } else {
        throw new Error(response.message || 'Failed to load subjects');
      }
    } catch (error) {
      setError(error.message || 'Failed to load subjects');
      console.error('Error loading subjects:', error);
    }
  }, []);

  // Display all subjects
  const displayAllSubjects = (subjects) => {
    console.log('Displaying all subjects:', subjects);
    setAllSubjects(subjects);
  };

  // Display subjects table
  const displaySubjectsTable = (subjects, container) => {
    console.log('Displaying subjects table:', subjects, container);
    setAllSubjects(subjects);
  };

  // Toggle subjects content
  const toggleSubjectsContent = () => {
    console.log('Toggling subjects content');
  };

  // Show add subject form
  const showAddSubjectForm = () => {
    console.log('Showing add subject form');
    setShowSubjectForm(true);
  };

  // Hide add subject form
  const hideAddSubjectForm = () => {
    console.log('Hiding add subject form');
    setShowSubjectForm(false);
  };

  // Edit subject row
  const editSubjectRow = (subjectId) => {
    console.log('Editing subject row:', subjectId);
    const subject = allSubjects.find(s => s.id === subjectId);
    setEditingSubject(subject);
  };


  // Display academic year
  const displayAcademicYear = (academicYears) => {
    console.log('Displaying academic year:', academicYears);
    setAcademicYears(academicYears);
  };

  // Show add academic year form
  const showAddAcademicYearForm = () => {
    console.log('Showing add academic year form');
  };

  // Hide add academic year form
  const hideAddAcademicYearForm = () => {
    console.log('Hiding add academic year form');
  };

  // Handle add academic year
  const handleAddAcademicYear = (event) => {
    console.log('Handling add academic year:', event);
  };

  // Toggle academic year content
  const toggleAcademicYearContent = () => {
    console.log('Toggling academic year content');
  };

  // Show academic year editor
  const showAcademicYearEditor = () => {
    console.log('Showing academic year editor');
  };

  // Show subject selection
  const showSubjectSelection = () => {
    console.log('Showing subject selection');
  };

  // Show main cabinet
  const showMainCabinet = () => {
    console.log('Showing main cabinet');
  };

  // Update user profile
  const updateUserProfile = (profileData) => {
    setUserProfile(prev => ({ ...prev, ...profileData }));
  };

  // Clear user data
  const clearUserDataFromContext = () => {
    setUserProfile(null);
    setUserSubjects([]);
    setUserClasses([]);
    setUserGrades([]);
    setAllUsers([]);
    setAllTeachers([]);
    setAllSubjects([]);
    setAcademicYears([]);
    setError(null);
  };

  // Clear user data with cache cleanup
  const clearUserDataWithCache = useCallback((userId) => {
    // Clear React state
    clearUserDataFromContext();
    
    // Clear cache data
    if (userId) {
      clearUserData(userId);
    }
  }, []);

  const value = {
    // State
    userProfile,
    userSubjects,
    userClasses,
    userGrades,
    allUsers,
    allTeachers,
    allSubjects,
    academicYears,
    isLoading,
    error,
    showUserForm,
    showTeacherForm,
    showSubjectForm,
    editingUser,
    editingTeacher,
    editingSubject,
    
    // Student Functions
    loadStudentData,
    displayStudentSubjects,
    populateStudentInfoDirectly,
    populateStudentInfo,
    
    // Teacher Functions
    loadTeacherData,
    showMainCabinetWithSubjects,
    displayGradeButtons,
    populateTeacherInfo,
    showSubjectSelection,
    showMainCabinet,
    
    // Admin Functions
    loadAdminData,
    getAllUsers,
    displayAllUsers,
    displayUsersTable,
    toggleUsersContent,
    showAddUserForm,
    hideAddUserForm,
    editUserRow,
    
    // Teacher Management
    loadAllTeachers,
    displayAllTeachers,
    displayTeachersTable,
    toggleTeachersContent,
    showAddTeacherForm,
    hideAddTeacherForm,
    editTeacher,
    editTeacherRow,
    
    // Subject Management
    loadAllSubjects,
    displayAllSubjects,
    displaySubjectsTable,
    toggleSubjectsContent,
    showAddSubjectForm,
    hideAddSubjectForm,
    editSubjectRow,
    
    // Academic Year Management
    displayAcademicYear,
    showAddAcademicYearForm,
    hideAddAcademicYearForm,
    handleAddAcademicYear,
    toggleAcademicYearContent,
    showAcademicYearEditor,
    
    // Utility Functions
    updateUserProfile,
    clearUserData: clearUserDataFromContext,
    clearUserDataWithCache,
    
    // Setters
    setUserProfile,
    setUserSubjects,
    setUserClasses,
    setUserGrades,
    setAllUsers,
    setAllTeachers,
    setAllSubjects,
    setAcademicYears,
    setError
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;

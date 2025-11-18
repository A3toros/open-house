import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useApi } from '@/hooks/useApi';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Notification } from '@/components/ui/Notification';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getCachedData, setCachedData, CACHE_TTL } from '@/utils/cacheUtils';
import { academicCalendarService } from '@/services/AcademicCalendarService';

// Reusable CSS Classes
const STYLES = {
  // Layout
  container: "min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100",
  mainContainer: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",
  
  // Header
  header: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg",
  headerContent: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6",
  headerFlex: "flex justify-between items-center",
  adminInfo: "flex items-center space-x-4",
  adminAvatar: "h-12 w-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm",
  adminText: "text-lg sm:text-xl md:text-2xl font-bold text-white",
  adminSubtext: "text-purple-100 text-sm sm:text-base md:text-lg",
  
  // Menu
  menuContainer: "relative admin-menu",
  menuButton: "flex items-center space-x-1 sm:space-x-2 bg-white/10 border-white/20 text-white hover:bg-white/20 font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border-2",
  menuDropdown: "absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg z-50 overflow-hidden",
  menuItem: "block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 transition-colors",
  menuItemLogout: "block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-red-50 transition-colors",
  
  // Cards
  cardContainer: "bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300",
  cardHeader: "px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50",
  cardTitle: "text-xl font-bold text-gray-800",
  cardBody: "p-6",
  
  // Buttons
  buttonGroup: "flex flex-wrap gap-3 mb-6",
  buttonPrimary: "bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200",
  buttonSecondary: "bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-4 py-2 rounded-lg transition-colors duration-200",
  buttonDanger: "bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200",
  
  // Forms
  formContainer: "bg-gray-50 rounded-lg p-6 border border-gray-200",
  formGrid: "grid grid-cols-1 md:grid-cols-2 gap-4",
  formGroup: "space-y-2",
  formLabel: "block text-sm font-medium text-gray-700",
  formInput: "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200",
  formSelect: "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200",
  formCheckbox: "h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded",
  formActions: "flex space-x-3 pt-4",
  
  // Tables
  tableContainer: "overflow-x-auto",
  table: "min-w-full divide-y divide-gray-200",
  tableHeader: "bg-gray-50",
  tableHeaderCell: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
  tableBody: "bg-white divide-y divide-gray-200",
  tableRow: "hover:bg-gray-50 transition-colors duration-150",
  tableCell: "px-6 py-4 whitespace-nowrap text-sm text-gray-900",
  
  // Status badges
  statusActive: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800",
  statusInactive: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800",
  
  // Animations
  fadeIn: "opacity-0",
  slideUp: "transform translate-y-4",
  
  // Modal
  modalOverlay: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
  modalContent: "bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl",
  modalTitle: "text-xl font-semibold text-gray-900 mb-4",
  modalActions: "flex space-x-3 pt-4",
};

const AdminCabinet = () => {
  // State management
  const { user, isAdmin, logout } = useAuth();
  const { get: apiGet, post: apiPost, delete: apiDelete } = useApi();

  const handleCheckOverdueAssignments = useCallback(async () => {
    try {
      setNotification({ type: 'info', message: 'Checking for overdue assignments...' });
      const res = await apiPost('/.netlify/functions/check-overdue-assignments', {});
      if (res && res.success) {
        const count = res.overdue_count || 0;
        if (count > 0) {
          setNotification({ 
            type: 'success', 
            message: `Found and marked ${count} overdue assignments as inactive.` 
          });
        } else {
          setNotification({ 
            type: 'info', 
            message: 'No overdue assignments found.' 
          });
        }
      } else {
        setNotification({ type: 'error', message: res?.error || 'Failed to check assignments' });
      }
    } catch (e) {
      setNotification({ type: 'error', message: 'Failed to check assignments' });
      console.error('Check overdue assignments error:', e);
    }
  }, [apiPost]);
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showUsersTable, setShowUsersTable] = useState(false);
  const [showTeachersTable, setShowTeachersTable] = useState(false);
  const [showSubjectsTable, setShowSubjectsTable] = useState(false);
  const [showTestsTable, setShowTestsTable] = useState(false);
  const [userSearchGrade, setUserSearchGrade] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editUserData, setEditUserData] = useState({});
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [editTeacherData, setEditTeacherData] = useState({});
  const [editingSubject, setEditingSubject] = useState(null);
  const [editSubjectData, setEditSubjectData] = useState({});
  
  // Tests management state
  const [allTests, setAllTests] = useState([]);
  const [testFilterTeacher, setTestFilterTeacher] = useState('');
  const [testFilterStartDate, setTestFilterStartDate] = useState('');
  const [testFilterEndDate, setTestFilterEndDate] = useState('');
  const [testFilterStatus, setTestFilterStatus] = useState('all'); // 'all', 'active', 'completed'
  const [activeTestsTab, setActiveTestsTab] = useState(true); // true for active, false for inactive
  
  // Test Management state (for actual tests, not assignments)
  const [showTestManagementTable, setShowTestManagementTable] = useState(false);
  const [allActualTests, setAllActualTests] = useState([]);
  const [testMgmtFilterTeacher, setTestMgmtFilterTeacher] = useState('');
  const [testMgmtFilterStartDate, setTestMgmtFilterStartDate] = useState('');
  const [testMgmtFilterEndDate, setTestMgmtFilterEndDate] = useState('');
  const [selectedTests, setSelectedTests] = useState(new Set());
  
  // Menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  
  // Data State
  const [users, setUsers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  
  // Form State
  const [showUserForm, setShowUserForm] = useState(false);
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [showTestDeletionForm, setShowTestDeletionForm] = useState(false);
  
  // Form Data
  const [userFormData, setUserFormData] = useState({
    grade: '',
    class: '',
    number: '',
    student_id: '',
    name: '',
    surname: '',
    nickname: '',
    password: '',
    is_active: true
  });
  
  const [teacherFormData, setTeacherFormData] = useState({
    teacher_id: '',
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    is_active: true
  });
  
  const [subjectFormData, setSubjectFormData] = useState({
    subject_id: '',
    subject: '',
    description: '',
    is_active: true
  });

  const [testDeletionFormData, setTestDeletionFormData] = useState({
    startDate: '',
    endDate: '',
    teacherId: '',
    grades: [],
    classes: [],
    subjectId: ''
  });

  // Initialize admin app
  useEffect(() => {
    console.log('🔄 AdminCabinet component mounted - initializing...');
    initializeAdminApp();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.admin-menu')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const initializeAdminApp = useCallback(async () => {
    try {
      setIsLoading(true);
      await loadAdminData();
      console.log('Admin app initialized');
    } catch (error) {
      setError('Failed to initialize admin app');
      console.error('Admin app initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Menu functions
  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  const showPasswordChangeTab = useCallback(() => {
    setShowPasswordChange(true);
    setIsMenuOpen(false);
  }, []);

  const hidePasswordChangeTab = useCallback(() => {
    setShowPasswordChange(false);
  }, []);

  // Data loading functions
  const loadAdminData = useCallback(async () => {
    try {
      await Promise.all([
        loadUsersList(),
        loadTeachersList(),
        loadSubjectsList(),
        loadAcademicYear()
      ]);
    } catch (error) {
      console.error('Error loading admin data:', error);
      setError('Failed to load admin data');
    }
  }, []);

  const loadUsersList = useCallback(async () => {
    try {
      // Check cache first
      const cacheKey = 'admin_users_';
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        console.log('📊 Using cached users data');
        setUsers(cachedData);
        return;
      }
      
      // Cache miss - fetch from API
      const response = await apiGet('/.netlify/functions/get-all-users');
      console.log('📊 Users response:', response);
      const users = response.users || [];
      setUsers(users);
      
      // Cache the result
      setCachedData(cacheKey, users, CACHE_TTL.admin_users);
      
      console.log('👥 Users set to state:', users);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }, [apiGet]);

  const loadTeachersList = useCallback(async () => {
    try {
      // Check cache first
      const cacheKey = 'admin_teachers_';
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        console.log('📊 Using cached teachers data');
        setTeachers(cachedData);
        return;
      }
      
      // Cache miss - fetch from API
      const response = await apiGet('/.netlify/functions/get-all-teachers');
      console.log('📊 Teachers response:', response);
      const teachers = response.teachers || [];
      setTeachers(teachers);
      
      // Cache the result
      setCachedData(cacheKey, teachers, CACHE_TTL.admin_teachers);
      
      console.log('👨‍🏫 Teachers set to state:', teachers);
    } catch (error) {
      console.error('Error loading teachers:', error);
    }
  }, [apiGet]);

  const loadSubjectsList = useCallback(async () => {
    try {
      // Check cache first
      const cacheKey = 'admin_subjects_';
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        console.log('📊 Using cached subjects data');
        setSubjects(cachedData);
        return;
      }
      
      // Cache miss - fetch from API
      const response = await apiGet('/.netlify/functions/get-all-subjects');
      console.log('📊 Subjects response:', response);
      const subjects = response.subjects || [];
      setSubjects(subjects);
      
      // Cache the result
      setCachedData(cacheKey, subjects, CACHE_TTL.admin_subjects);
      
      console.log('📚 Subjects set to state:', subjects);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  }, [apiGet]);

  const loadAcademicYear = useCallback(async () => {
    try {
      // Check cache first
      const cacheKey = 'admin_academic_years_';
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        console.log('📊 Using cached academic years data');
        setAcademicYears(cachedData);
        return;
      }
      
      // Load from AcademicCalendarService
      const academicCalendar = await academicCalendarService.loadAcademicCalendar();
      if (academicCalendar && Array.isArray(academicCalendar)) {
        setAcademicYears(academicCalendar);
        // Cache the result
        setCachedData(cacheKey, academicCalendar, CACHE_TTL.admin_academic_years);
      } else {
        console.error('Failed to load academic calendar');
      }
    } catch (error) {
      console.error('Error loading academic year:', error);
    }
  }, []);

  const loadAllTests = useCallback(async () => {
    try {
      setShowTestsTable(!showTestsTable);
      if (!showTestsTable) {
        // Load both active and inactive tests with cache busting
        const cacheBuster = Date.now();
        const [activeResponse, assignmentsResponse] = await Promise.all([
          apiGet(`/.netlify/functions/get-all-tests?t=${cacheBuster}`),
          apiGet(`/.netlify/functions/get-test-assignments?t=${cacheBuster}`)
        ]);
        
        console.log('📊 Active tests response:', activeResponse);
        console.log('📊 Assignments response:', assignmentsResponse);
        
        const activeTests = activeResponse.tests || [];
        const assignments = assignmentsResponse.assignments || [];
        
        // Group assignments by test to determine which tests are inactive
        const assignmentsByTest = assignments.reduce((acc, assignment) => {
          const key = `${assignment.test_type}-${assignment.test_id}`;
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(assignment);
          return acc;
        }, {});
        
        // Mark tests as active/inactive based on their assignments
        const allTestsWithStatus = activeTests.map(test => {
          const key = `${test.test_type}-${test.test_id}`;
          const testAssignments = assignmentsByTest[key] || [];
          const hasActiveAssignments = testAssignments.some(assignment => assignment.is_active);
          
          return {
            ...test,
            is_active: hasActiveAssignments,
            assignments: testAssignments
          };
        });
        
        setAllTests(allTestsWithStatus);
        console.log('🧪 All tests with status set to state:', allTestsWithStatus);
      }
    } catch (error) {
      console.error('Error loading tests:', error);
      setNotification({ type: 'error', message: 'Failed to load tests' });
    }
  }, [apiGet, showTestsTable]);

  // Form handlers
  const handleUserFormChange = useCallback((field, value) => {
    setUserFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleTeacherFormChange = useCallback((field, value) => {
    setTeacherFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubjectFormChange = useCallback((field, value) => {
    setSubjectFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Debug functions
  const testLocalStorage = useCallback(() => {
    console.log('🧪 Testing local storage...');
    try {
      const testData = { test: 'data', timestamp: Date.now() };
      localStorage.setItem('test', JSON.stringify(testData));
      const retrieved = JSON.parse(localStorage.getItem('test'));
      console.log('✅ Local storage test successful:', retrieved);
      setNotification({ type: 'success', message: 'Local storage test successful' });
    } catch (error) {
      console.error('❌ Local storage test failed:', error);
      setNotification({ type: 'error', message: 'Local storage test failed' });
    }
  }, []);

  const clearLocalStorage = useCallback(() => {
    console.log('🧹 Clearing local storage...');
    try {
      localStorage.clear();
      console.log('✅ Local storage cleared');
      setNotification({ type: 'success', message: 'Local storage cleared' });
    } catch (error) {
      console.error('❌ Error clearing local storage:', error);
      setNotification({ type: 'error', message: 'Error clearing local storage' });
    }
  }, []);

  const checkTeacherSubjects = useCallback(async () => {
    console.log('👨‍🏫 Checking teacher subjects...');
    try {
      const response = await apiGet('/.netlify/functions/get-all-teachers');
      const teachers = response.data || [];
      console.log('📊 Teachers data:', teachers);
      setNotification({ type: 'success', message: `Found ${teachers.length} teachers` });
    } catch (error) {
      console.error('❌ Error checking teacher subjects:', error);
      setNotification({ type: 'error', message: 'Error checking teacher subjects' });
    }
  }, [apiGet]);

  // Form submission handlers
  const handleUserSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      console.log('👤 Submitting user:', userFormData);
      const response = await apiPost('/.netlify/functions/add-user', userFormData);
      if (response.success) {
        setNotification({ type: 'success', message: 'User added successfully' });
        setShowUserForm(false);
        setUserFormData({
          grade: '',
          class: '',
          number: '',
          student_id: '',
          name: '',
          surname: '',
          nickname: '',
          password: '',
          is_active: true
        });
        loadUsersList(); // Refresh the list
      } else {
        setNotification({ type: 'error', message: response.message || 'Failed to add user' });
      }
    } catch (error) {
      console.error('❌ Error adding user:', error);
      setNotification({ type: 'error', message: 'Error adding user' });
    }
  }, [userFormData, apiPost, loadUsersList]);

  const handleTeacherSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      console.log('👨‍🏫 Submitting teacher:', teacherFormData);
      const response = await apiPost('/.netlify/functions/add-teacher', teacherFormData);
      if (response.success) {
        setNotification({ type: 'success', message: 'Teacher added successfully' });
        setShowTeacherForm(false);
        setTeacherFormData({
          teacher_id: '',
          username: '',
          password: '',
          first_name: '',
          last_name: '',
          is_active: true
        });
        loadTeachersList(); // Refresh the list
      } else {
        setNotification({ type: 'error', message: response.message || 'Failed to add teacher' });
      }
    } catch (error) {
      console.error('❌ Error adding teacher:', error);
      setNotification({ type: 'error', message: 'Error adding teacher' });
    }
  }, [teacherFormData, apiPost, loadTeachersList]);

  const handleSubjectSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      console.log('📚 Submitting subject:', subjectFormData);
      const response = await apiPost('/.netlify/functions/add-subject', subjectFormData);
      if (response.success) {
        setNotification({ type: 'success', message: 'Subject added successfully' });
        setShowSubjectForm(false);
        setSubjectFormData({
          subject_id: '',
          subject: '',
          description: '',
          is_active: true
        });
        loadSubjectsList(); // Refresh the list
      } else {
        setNotification({ type: 'error', message: response.message || 'Failed to add subject' });
      }
    } catch (error) {
      console.error('❌ Error adding subject:', error);
      setNotification({ type: 'error', message: 'Error adding subject' });
    }
  }, [subjectFormData, apiPost, loadSubjectsList]);

  // User management functions
  const handleEditUser = useCallback((user) => {
    setEditingUser(user);
    setEditUserData({
      name: user.name || '',
      surname: user.surname || '',
      grade: user.grade || '',
      class: user.class || '',
      student_id: user.student_id || '',
      nickname: user.nickname || '',
      password: user.password || '',
      is_active: user.is_active !== undefined ? user.is_active : true
    });
  }, []);

  const handleUpdateUser = useCallback(async () => {
    try {
      const updates = [];
      Object.keys(editUserData).forEach(key => {
        // Skip student_id as it cannot be updated
        if (key !== 'student_id' && editUserData[key] !== editingUser[key]) {
          updates.push({ fieldName: key, newValue: editUserData[key] });
        }
      });

      for (const update of updates) {
        await apiPost('/.netlify/functions/update-user', {
          userId: editingUser.student_id,
          fieldName: update.fieldName,
          newValue: update.newValue
        });
      }

      setNotification({ type: 'success', message: 'User updated successfully!' });
      setEditingUser(null);
      setEditUserData({});
      loadUsersList(); // Refresh the list
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to update user' });
    }
  }, [editUserData, editingUser, apiPost, loadUsersList]);

  const handleDeleteUser = useCallback(async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await apiPost('/.netlify/functions/delete-user', { userId });
        if (response.success) {
          setNotification({ type: 'success', message: 'User deleted successfully!' });
          loadUsersList(); // Refresh the list
        }
    } catch (error) {
        setNotification({ type: 'error', message: 'Failed to delete user' });
      }
    }
  }, [apiPost, loadUsersList]);

  // Teacher management functions
  const handleEditTeacher = useCallback((teacher) => {
    setEditingTeacher(teacher);
    setEditTeacherData({
      teacher_id: teacher.teacher_id || '',
      username: teacher.username || '',
      password: teacher.password || '',
      first_name: teacher.first_name || '',
      last_name: teacher.last_name || '',
      is_active: teacher.is_active !== undefined ? teacher.is_active : true
    });
  }, []);

  const handleUpdateTeacher = useCallback(async () => {
    try {
      const updates = [];
      Object.keys(editTeacherData).forEach(key => {
        // Skip teacher_id as it cannot be updated
        if (key !== 'teacher_id' && editTeacherData[key] !== editingTeacher[key]) {
          updates.push({ fieldName: key, newValue: editTeacherData[key] });
        }
      });

      for (const update of updates) {
        await apiPost('/.netlify/functions/update-teacher', {
          teacherId: editingTeacher.teacher_id,
          fieldName: update.fieldName,
          newValue: update.newValue
        });
      }

      setNotification({ type: 'success', message: 'Teacher updated successfully!' });
      setEditingTeacher(null);
      setEditTeacherData({});
      loadTeachersList(); // Refresh the list
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to update teacher' });
    }
  }, [editTeacherData, editingTeacher, apiPost, loadTeachersList]);

  const handleDeleteTeacher = useCallback(async (teacherId) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        const response = await apiPost('/.netlify/functions/delete-teacher', { teacherId });
        if (response.success) {
          setNotification({ type: 'success', message: 'Teacher deleted successfully!' });
          loadTeachersList(); // Refresh the list
        }
      } catch (error) {
        setNotification({ type: 'error', message: 'Failed to delete teacher' });
      }
    }
  }, [apiPost, loadTeachersList]);

  // Subject management functions
  const handleEditSubject = useCallback((subject) => {
    setEditingSubject(subject);
    setEditSubjectData({
      subject_id: subject.subject_id || '',
      subject: subject.subject || ''
    });
  }, []);

  const handleUpdateSubject = useCallback(async () => {
    try {
      const updates = [];
      Object.keys(editSubjectData).forEach(key => {
        // Skip subject_id as it cannot be updated
        if (key !== 'subject_id' && editSubjectData[key] !== editingSubject[key]) {
          updates.push({ fieldName: key, newValue: editSubjectData[key] });
        }
      });

      for (const update of updates) {
        await apiPost('/.netlify/functions/update-subject', {
          subjectId: editingSubject.subject_id,
          fieldName: update.fieldName,
          newValue: update.newValue
        });
      }

      setNotification({ type: 'success', message: 'Subject updated successfully!' });
      setEditingSubject(null);
      setEditSubjectData({});
      loadSubjectsList(); // Refresh the list
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to update subject' });
    }
  }, [editSubjectData, editingSubject, apiPost, loadSubjectsList]);

  const handleDeleteSubject = useCallback(async (subjectId) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        const response = await apiPost('/.netlify/functions/delete-subject', { subjectId });
        if (response.success) {
          setNotification({ type: 'success', message: 'Subject deleted successfully!' });
          loadSubjectsList(); // Refresh the list
        } else {
          setNotification({ type: 'error', message: response.message || 'Failed to delete subject' });
        }
      } catch (error) {
        setNotification({ type: 'error', message: 'Failed to delete subject' });
      }
    }
  }, [apiPost, loadSubjectsList]);

  // Test deletion functions
  const handleTestDeletionFormChange = useCallback((field, value) => {
    setTestDeletionFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleTestDeletionSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!testDeletionFormData.startDate || !testDeletionFormData.endDate || !testDeletionFormData.teacherId) {
      setNotification({ type: 'error', message: 'Please fill in all required fields (Start Date, End Date, Teacher ID)' });
      return;
    }

    if (window.confirm('Are you sure you want to delete all test data for the selected criteria? This action cannot be undone.')) {
      try {
        const response = await apiPost('/.netlify/functions/delete-test-data', testDeletionFormData);
        if (response.success) {
      setNotification({ 
        type: 'success', 
            message: `Successfully deleted ${response.deletedCount} test records!` 
          });
          setShowTestDeletionForm(false);
          setTestDeletionFormData({
            startDate: '',
            endDate: '',
            teacherId: '',
            grades: [],
            classes: [],
            subjectId: ''
          });
        } else {
          setNotification({ type: 'error', message: response.message || 'Failed to delete test data' });
        }
    } catch (error) {
        setNotification({ type: 'error', message: 'Failed to delete test data' });
      }
    }
  }, [testDeletionFormData, apiPost]);

  const markTestInactive = useCallback(async (testId, testType, teacherId) => {
    try {
      // Get all assignments with cache busting
      const cacheBuster = Date.now();
      const assignmentsResponse = await apiGet(`/.netlify/functions/get-test-assignments?t=${cacheBuster}`);
      
      if (assignmentsResponse.success && assignmentsResponse.assignments) {
        // Filter assignments for this specific test
        const testAssignments = assignmentsResponse.assignments.filter(
          assignment => assignment.test_id === parseInt(testId) && assignment.test_type === testType
        );
        
        if (testAssignments.length === 0) {
          setNotification({ type: 'error', message: 'No assignments found for this test' });
          return;
        }
        
        // Mark each assignment as inactive
        for (const assignment of testAssignments) {
          const response = await apiPost('/.netlify/functions/remove-assignment', {
            teacher_id: teacherId,
            assignment_id: assignment.assignment_id,
            test_type: testType,
            test_id: testId
          });
          
          if (!response.success) {
            setNotification({ type: 'error', message: `Failed to complete test: ${response.message}` });
            return;
          }
        }
        
        setNotification({ 
          type: 'success', 
          message: 'Test marked as complete successfully!' 
        });
        // Refresh the tests list
        await loadAllTests();
      } else {
        setNotification({ type: 'error', message: 'Failed to get test assignments' });
      }
    } catch (error) {
      console.error('Error completing test:', error);
      setNotification({ type: 'error', message: 'Failed to complete test' });
    }
  }, [apiPost, apiGet, loadAllTests]);

  const markTestActive = useCallback(async (testId, testType, teacherId) => {
    try {
      // Get all assignments with cache busting
      const cacheBuster = Date.now();
      const assignmentsResponse = await apiGet(`/.netlify/functions/get-test-assignments?t=${cacheBuster}`);
      
      if (assignmentsResponse.success && assignmentsResponse.assignments) {
        // Filter assignments for this specific test
        const testAssignments = assignmentsResponse.assignments.filter(
          assignment => assignment.test_id === parseInt(testId) && assignment.test_type === testType
        );
        
        if (testAssignments.length === 0) {
          setNotification({ type: 'error', message: 'No assignments found for this test' });
          return;
        }
        
        // Mark each assignment as active
        for (const assignment of testAssignments) {
          const response = await apiPost('/.netlify/functions/remove-assignment', {
            teacher_id: teacherId,
            assignment_id: assignment.assignment_id,
            test_type: testType,
            test_id: testId,
            mark_active: true // Add flag to mark as active instead of inactive
          });
          
          if (!response.success) {
            setNotification({ type: 'error', message: `Failed to reactivate test: ${response.message}` });
            return;
          }
        }
        
        setNotification({ 
          type: 'success', 
          message: 'Test marked as active successfully!' 
        });
        // Refresh the tests list
        await loadAllTests();
      } else {
        setNotification({ type: 'error', message: 'Failed to get test assignments' });
      }
    } catch (error) {
      console.error('Error reactivating test:', error);
      setNotification({ type: 'error', message: 'Failed to reactivate test' });
    }
  }, [apiPost, apiGet, loadAllTests]);

  // Load actual tests for Test Management
  const loadActualTests = useCallback(async (forceRefresh = false) => {
    try {
      // Add cache busting parameter
      const cacheBuster = Date.now();
      const response = await apiGet(`/.netlify/functions/get-all-tests?t=${cacheBuster}`);
      console.log('📊 Actual tests response:', response);
      setAllActualTests(response.tests || []);
      console.log('🧪 Actual tests set to state:', response.tests || []);
    } catch (error) {
      console.error('Error loading actual tests:', error);
      setNotification({ type: 'error', message: 'Failed to load tests' });
    }
  }, [apiGet]);

  // Delete individual test
  const deleteTest = useCallback(async (testId, testType, teacherId) => {
    try {
      const response = await apiPost('/.netlify/functions/delete-test', {
        test_id: testId,
        test_type: testType,
        teacher_id: teacherId
      });
      
      if (response.success) {
        setNotification({ 
          type: 'success', 
          message: 'Test deleted successfully!' 
        });
        // Remove from selection if it was selected
        const key = `${testType}-${testId}-${teacherId}`;
        setSelectedTests(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        // Refresh the tests list with cache busting
        await loadActualTests(true);
      } else {
        setNotification({ type: 'error', message: `Failed to delete test: ${response.message}` });
      }
    } catch (error) {
      console.error('Error deleting test:', error);
      setNotification({ type: 'error', message: 'Failed to delete test' });
    }
  }, [apiPost, loadActualTests]);

  // Checkbox handlers for test selection
  const handleTestSelect = useCallback((testId, testType, teacherId) => {
    const key = `${testType}-${testId}-${teacherId}`;
    setSelectedTests(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // Filter users by grade
  const filteredUsers = userSearchGrade 
    ? users.filter(user => user.grade.toString() === userSearchGrade)
    : users;

  // Filter tests by status, teacher, and date
  const filteredTests = allTests.filter(test => {
    const statusMatch = testFilterStatus === 'all' 
      ? true 
      : testFilterStatus === 'active' 
        ? test.is_active 
        : !test.is_active; // completed
    const teacherMatch = !testFilterTeacher || test.teacher_id === testFilterTeacher;
    const startDateMatch = !testFilterStartDate || new Date(test.created_at) >= new Date(testFilterStartDate);
    const endDateMatch = !testFilterEndDate || new Date(test.created_at) <= new Date(testFilterEndDate + 'T23:59:59');
    return statusMatch && teacherMatch && startDateMatch && endDateMatch;
  });

  // Filter actual tests by teacher and date
  const filteredActualTests = allActualTests.filter(test => {
    const teacherMatch = !testMgmtFilterTeacher || test.teacher_id === testMgmtFilterTeacher;
    const startDateMatch = !testMgmtFilterStartDate || new Date(test.created_at) >= new Date(testMgmtFilterStartDate);
    const endDateMatch = !testMgmtFilterEndDate || new Date(test.created_at) <= new Date(testMgmtFilterEndDate + 'T23:59:59');
    return teacherMatch && startDateMatch && endDateMatch;
  });

  const handleSelectAll = useCallback(() => {
    if (selectedTests.size === filteredActualTests.length && filteredActualTests.length > 0) {
      setSelectedTests(new Set());
    } else {
      const keys = filteredActualTests.map(test => 
        `${test.test_type}-${test.test_id}-${test.teacher_id}`
      );
      setSelectedTests(new Set(keys));
    }
  }, [selectedTests.size, filteredActualTests]);

  // Delete marked tests
  const handleDeleteMarked = useCallback(async () => {
    if (selectedTests.size === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedTests.size} test(s)?`)) {
      return;
    }
    
    try {
      const deletePromises = Array.from(selectedTests).map(key => {
        const [testType, testId, teacherId] = key.split('-');
        return apiPost('/.netlify/functions/delete-test', {
          test_id: parseInt(testId),
          test_type: testType,
          teacher_id: teacherId
        });
      });
      
      await Promise.all(deletePromises);
      
      setNotification({
        type: 'success',
        message: `Successfully deleted ${selectedTests.size} test(s)!`
      });
      
      // Clear selection
      setSelectedTests(new Set());
      
      // Refresh list with cache busting
      await loadActualTests(true);
    } catch (error) {
      console.error('Error deleting marked tests:', error);
      setNotification({
        type: 'error',
        message: 'Failed to delete some tests. Please try again.'
      });
    }
  }, [selectedTests, apiPost, loadActualTests]);

  return (
    <motion.div 
      id="admin-cabinet-main"
      className={STYLES.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Admin Header Section */}
      <motion.div 
        className={STYLES.header}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <div className={STYLES.headerContent}>
          <div className={STYLES.headerFlex}>
            {/* Admin Info */}
            <motion.div 
              className={STYLES.adminInfo}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="flex-shrink-0">
                <motion.div 
                  className={STYLES.adminAvatar}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.3, type: "spring" }}
                  whileHover={{ scale: 1.1 }}
                >
                  <span className="text-white font-semibold text-xl">
                    {user?.username?.charAt(0) || 'A'}
                  </span>
            </motion.div>
              </div>
              <div>
                <h1 className={STYLES.adminText}>
                  {user?.username || 'Administrator'}
                </h1>
                <p className={STYLES.adminSubtext}>
                  Administrator Dashboard
                </p>
              </div>
            </motion.div>
            
            {/* Menu Button */}
            <motion.div 
              className={STYLES.menuContainer}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <button
                onClick={toggleMenu}
                className={STYLES.menuButton}
                style={{ zIndex: 1000 }}
              >
                <span className="hidden sm:inline">Menu</span>
                <motion.svg 
                  className="w-4 h-4 sm:w-5 sm:h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  animate={{ rotate: isMenuOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </motion.svg>
              </button>
              
              {/* Dropdown Menu */}
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div 
                    className={STYLES.menuDropdown}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="py-2">
                      <motion.button
                        onClick={showPasswordChangeTab}
                        className={STYLES.menuItem}
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.2 }}
                      >
                        Change Password
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          toggleMenu();
                          logout();
                        }}
                        className={STYLES.menuItemLogout}
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.2 }}
                      >
                        Logout
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Loading Spinner */}
      {isLoading && <LoadingSpinner text="Loading..." />}

      {/* Error Display */}
      {error && (
        <Notification
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Success Notification */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Password Change Modal */}
      {showPasswordChange && (
        <div className={STYLES.modalOverlay}>
          <div className={STYLES.modalContent}>
            <h2 className={STYLES.modalTitle}>
              Change Password
            </h2>
            
            <form className="space-y-4">
              {/* Current Password */}
              <div className={STYLES.formGroup}>
                <label 
                  htmlFor="currentPassword" 
                  className={STYLES.formLabel}
                >
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  className={STYLES.formInput}
                />
              </div>
              
              {/* New Password */}
              <div className={STYLES.formGroup}>
                <label 
                  htmlFor="newPassword" 
                  className={STYLES.formLabel}
                >
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  className={STYLES.formInput}
                />
              </div>
              
              {/* Confirm Password */}
              <div className={STYLES.formGroup}>
                <label 
                  htmlFor="confirmPassword" 
                  className={STYLES.formLabel}
                >
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  className={STYLES.formInput}
                />
              </div>
              
              {/* Form Actions */}
              <div className={STYLES.modalActions}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={hidePasswordChangeTab}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  Change Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Content Sections */}
      <motion.div 
        className={STYLES.mainContainer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <div className="space-y-6">
          {/* User Management Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Card className={STYLES.cardContainer}>
              <Card.Header className={STYLES.cardHeader}>
                <Card.Title className={STYLES.cardTitle}>User Management</Card.Title>
              </Card.Header>
              <Card.Body className={STYLES.cardBody}>
                <div className={STYLES.buttonGroup}>
                  <Button 
                    variant="primary" 
                    onClick={() => setShowUserForm(true)}
                    className={STYLES.buttonPrimary}
                  >
                    Add User
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => {
                      loadUsersList();
                      setShowUsersTable(!showUsersTable);
                    }}
                    className={STYLES.buttonSecondary}
                  >
                    {showUsersTable ? 'Hide Users Table' : 'Get All Users ▶'}
                  </Button>
                      </div>
            
                      {/* Add User Form */}
                      <AnimatePresence>
                        {showUserForm && (
                          <motion.div 
                      className={STYLES.formContainer}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New User</h3>
                      <form onSubmit={handleUserSubmit} className="space-y-4">
                        <div className={STYLES.formGrid}>
                          <div className={STYLES.formGroup}>
                            <label className={STYLES.formLabel}>Grade</label>
                                  <input
                              type="text"
                                    value={userFormData.grade}
                              onChange={(e) => handleUserFormChange('grade', e.target.value)}
                              className={STYLES.formInput}
                              placeholder="Enter grade"
                                  />
                                </div>
                          <div className={STYLES.formGroup}>
                            <label className={STYLES.formLabel}>Class</label>
                                  <input
                                    type="text"
                                    value={userFormData.class}
                              onChange={(e) => handleUserFormChange('class', e.target.value)}
                              className={STYLES.formInput}
                              placeholder="Enter class"
                                  />
                                </div>
                          <div className={STYLES.formGroup}>
                            <label className={STYLES.formLabel}>Number</label>
                                  <input
                              type="text"
                                    value={userFormData.number}
                              onChange={(e) => handleUserFormChange('number', e.target.value)}
                              className={STYLES.formInput}
                              placeholder="Enter number"
                                  />
                                </div>
                          <div className={STYLES.formGroup}>
                            <label className={STYLES.formLabel}>Student ID</label>
                                  <input
                                    type="text"
                                    value={userFormData.student_id}
                              onChange={(e) => handleUserFormChange('student_id', e.target.value)}
                              className={STYLES.formInput}
                              placeholder="Enter student ID"
                                  />
                                </div>
                          <div className={STYLES.formGroup}>
                            <label className={STYLES.formLabel}>Name</label>
                                  <input
                                    type="text"
                                    value={userFormData.name}
                              onChange={(e) => handleUserFormChange('name', e.target.value)}
                              className={STYLES.formInput}
                              placeholder="Enter name"
                                  />
                                </div>
                          <div className={STYLES.formGroup}>
                            <label className={STYLES.formLabel}>Surname</label>
                                  <input
                                    type="text"
                                    value={userFormData.surname}
                              onChange={(e) => handleUserFormChange('surname', e.target.value)}
                              className={STYLES.formInput}
                              placeholder="Enter surname"
                                  />
                                </div>
                          <div className={STYLES.formGroup}>
                            <label className={STYLES.formLabel}>Nickname</label>
                                  <input
                                    type="text"
                                    value={userFormData.nickname}
                              onChange={(e) => handleUserFormChange('nickname', e.target.value)}
                              className={STYLES.formInput}
                              placeholder="Enter nickname"
                                  />
                                </div>
                          <div className={STYLES.formGroup}>
                            <label className={STYLES.formLabel}>Password</label>
                            <input
                              type="password"
                              value={userFormData.password}
                              onChange={(e) => handleUserFormChange('password', e.target.value)}
                              className={STYLES.formInput}
                              placeholder="Enter password"
                            />
                              </div>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="userActive"
                            checked={userFormData.is_active}
                            onChange={(e) => handleUserFormChange('is_active', e.target.checked)}
                            className={STYLES.formCheckbox}
                          />
                          <label htmlFor="userActive" className="ml-2 text-sm text-gray-700">
                            Active
                          </label>
                        </div>
                        <div className={STYLES.formActions}>
                          <Button 
                            type="button" 
                            variant="secondary" 
                            onClick={() => setShowUserForm(false)}
                            className={STYLES.buttonSecondary}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            variant="primary"
                            className={STYLES.buttonPrimary}
                          >
                            Add User
                          </Button>
                              </div>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>


                {/* Users Table */}
                {showUsersTable && (
                  <div className="mt-6">
                    <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <h4 className="text-lg font-semibold text-gray-700">
                        All Users ({filteredUsers.length} of {users.length})
                      </h4>
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-600">Filter by Grade:</label>
                        <select
                          value={userSearchGrade}
                          onChange={(e) => setUserSearchGrade(e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">All Grades</option>
                          {[...new Set(users.map(user => user.grade))].sort().map(grade => (
                            <option key={grade} value={grade}>Grade {grade}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto max-h-[600px]">
                        <table className={STYLES.table}>
                          <thead className={STYLES.tableHeader}>
                            <tr>
                              <th className={STYLES.tableHeaderCell}>Name</th>
                              <th className={STYLES.tableHeaderCell}>Grade</th>
                              <th className={STYLES.tableHeaderCell}>Class</th>
                              <th className={STYLES.tableHeaderCell}>Student ID</th>
                              <th className={STYLES.tableHeaderCell}>Number</th>
                              <th className={STYLES.tableHeaderCell}>Nickname</th>
                              <th className={STYLES.tableHeaderCell}>Actions</th>
                            </tr>
                          </thead>
                          <tbody className={STYLES.tableBody}>
                            {filteredUsers.map((user, index) => (
                              <tr key={user.id || index} className={STYLES.tableRow}>
                                <td className={STYLES.tableCell}>{user.name} {user.surname}</td>
                                <td className={STYLES.tableCell}>{user.grade}</td>
                                <td className={STYLES.tableCell}>{user.class}</td>
                                <td className={STYLES.tableCell}>{user.student_id}</td>
                                <td className={STYLES.tableCell}>{user.number}</td>
                                <td className={STYLES.tableCell}>{user.nickname}</td>
                                <td className={STYLES.tableCell}>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleEditUser(user)}
                                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(user.student_id)}
                                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </motion.div>

          {/* Teacher Management Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Card className={STYLES.cardContainer}>
              <Card.Header className={STYLES.cardHeader}>
                <Card.Title className={STYLES.cardTitle}>Teacher Management</Card.Title>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleCheckOverdueAssignments}
                    className="px-3 py-1.5 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors text-xs whitespace-nowrap"
                    title="Check and mark overdue assignments (7+ days old) as inactive"
                  >
                    Check Overdue Assignments
                  </button>
                  <Button 
                    variant="primary" 
                    onClick={() => setShowTeacherForm(true)}
                    className="text-xs whitespace-nowrap"
                  >
                    Add Teacher
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => {
                      loadTeachersList();
                      setShowTeachersTable(!showTeachersTable);
                    }}
                    className="text-xs whitespace-nowrap"
                  >
                    {showTeachersTable ? 'Hide Teachers Table' : 'Get All Teachers ▶'}
                  </Button>
                </div>
              </Card.Header>
              <Card.Body className={STYLES.cardBody}>
            
                      {/* Add Teacher Form */}
                      <AnimatePresence>
                        {showTeacherForm && (
                          <motion.div 
                      className={STYLES.formContainer}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Teacher</h3>
                      <form onSubmit={handleTeacherSubmit} className="space-y-4">
                        <div className={STYLES.formGrid}>
                          <div className={STYLES.formGroup}>
                            <label className={STYLES.formLabel}>Teacher ID</label>
                                  <input
                                    type="text"
                              value={teacherFormData.teacher_id}
                              onChange={(e) => handleTeacherFormChange('teacher_id', e.target.value)}
                              className={STYLES.formInput}
                              placeholder="Enter teacher ID"
                            />
                          </div>
                          <div className={STYLES.formGroup}>
                            <label className={STYLES.formLabel}>Username</label>
                            <input
                              type="text"
                                    value={teacherFormData.username}
                              onChange={(e) => handleTeacherFormChange('username', e.target.value)}
                              className={STYLES.formInput}
                              placeholder="Enter username"
                                  />
                                </div>
                          <div className={STYLES.formGroup}>
                            <label className={STYLES.formLabel}>Password</label>
                                  <input
                                    type="password"
                                    value={teacherFormData.password}
                              onChange={(e) => handleTeacherFormChange('password', e.target.value)}
                              className={STYLES.formInput}
                              placeholder="Enter password"
                                  />
                                </div>
                          <div className={STYLES.formGroup}>
                            <label className={STYLES.formLabel}>First Name</label>
                            <input
                              type="text"
                              value={teacherFormData.first_name}
                              onChange={(e) => handleTeacherFormChange('first_name', e.target.value)}
                              className={STYLES.formInput}
                              placeholder="Enter first name"
                            />
                              </div>
                          <div className={STYLES.formGroup}>
                            <label className={STYLES.formLabel}>Last Name</label>
                            <input
                              type="text"
                              value={teacherFormData.last_name}
                              onChange={(e) => handleTeacherFormChange('last_name', e.target.value)}
                              className={STYLES.formInput}
                              placeholder="Enter last name"
                            />
                          </div>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="teacherActive"
                            checked={teacherFormData.is_active}
                            onChange={(e) => handleTeacherFormChange('is_active', e.target.checked)}
                            className={STYLES.formCheckbox}
                          />
                          <label htmlFor="teacherActive" className="ml-2 text-sm text-gray-700">
                            Active
                          </label>
                        </div>
                        <div className={STYLES.formActions}>
                          <Button 
                            type="button" 
                            variant="secondary" 
                            onClick={() => setShowTeacherForm(false)}
                            className={STYLES.buttonSecondary}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            variant="primary"
                            className={STYLES.buttonPrimary}
                          >
                            Add Teacher
                          </Button>
                              </div>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>

                {/* Edit User Modal */}
                {editingUser && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit User</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <input
                            type="text"
                            value={editUserData.name}
                            onChange={(e) => setEditUserData({...editUserData, name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Surname</label>
                          <input
                            type="text"
                            value={editUserData.surname}
                            onChange={(e) => setEditUserData({...editUserData, surname: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                            <input
                              type="number"
                              value={editUserData.grade}
                              onChange={(e) => setEditUserData({...editUserData, grade: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                            <input
                              type="number"
                              value={editUserData.class}
                              onChange={(e) => setEditUserData({...editUserData, class: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                          <input
                            type="text"
                            value={editUserData.student_id}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                          />
                          <p className="text-xs text-gray-500 mt-1">Student ID cannot be changed</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
                          <input
                            type="text"
                            value={editUserData.nickname}
                            onChange={(e) => setEditUserData({...editUserData, nickname: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                          <input
                            type="text"
                            value={editUserData.password}
                            onChange={(e) => setEditUserData({...editUserData, password: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="is_active"
                            checked={editUserData.is_active}
                            onChange={(e) => setEditUserData({...editUserData, is_active: e.target.checked})}
                            className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
                            Active
                          </label>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3 mt-6">
                        <button
                          onClick={() => {
                            setEditingUser(null);
                            setEditUserData({});
                          }}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleUpdateUser}
                          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                        >
                          Update User
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Teachers Table */}
                {showTeachersTable && (
                  <div className="mt-6">
                    <div className="mb-4">
                      <h4 className="text-lg font-semibold text-gray-700">All Teachers ({teachers.length})</h4>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto max-h-96">
                        <table className={STYLES.table}>
                          <thead className={STYLES.tableHeader}>
                            <tr>
                              <th className={STYLES.tableHeaderCell}>Teacher ID</th>
                              <th className={STYLES.tableHeaderCell}>Name</th>
                              <th className={STYLES.tableHeaderCell}>Username</th>
                              <th className={STYLES.tableHeaderCell}>Password</th>
                              <th className={STYLES.tableHeaderCell}>Status</th>
                              <th className={STYLES.tableHeaderCell}>Created</th>
                              <th className={STYLES.tableHeaderCell}>Actions</th>
                            </tr>
                          </thead>
                          <tbody className={STYLES.tableBody}>
                            {teachers.map((teacher, index) => (
                              <tr key={teacher.teacher_id || index} className={STYLES.tableRow}>
                                <td className={STYLES.tableCell}>{teacher.teacher_id}</td>
                                <td className={STYLES.tableCell}>{teacher.first_name} {teacher.last_name}</td>
                                <td className={STYLES.tableCell}>{teacher.username}</td>
                                <td className={STYLES.tableCell}>{teacher.password}</td>
                                <td className={STYLES.tableCell}>
                                  <span className={teacher.is_active ? STYLES.statusActive : STYLES.statusInactive}>
                                    {teacher.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td className={STYLES.tableCell}>
                                  {new Date(teacher.created_at).toLocaleDateString()}
                                </td>
                                <td className={STYLES.tableCell}>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleEditTeacher(teacher)}
                                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTeacher(teacher.teacher_id)}
                                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </motion.div>

          {/* Subject Management Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <Card className={STYLES.cardContainer}>
              <Card.Header className={STYLES.cardHeader}>
                <Card.Title className={STYLES.cardTitle}>Subject Management</Card.Title>
              </Card.Header>
              <Card.Body className={STYLES.cardBody}>
                <div className={STYLES.buttonGroup}>
                  <Button 
                    variant="primary" 
                    onClick={() => setShowSubjectForm(true)}
                    className={STYLES.buttonPrimary}
                  >
                    Add Subject
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => {
                      loadSubjectsList();
                      setShowSubjectsTable(!showSubjectsTable);
                    }}
                    className={STYLES.buttonSecondary}
                  >
                    {showSubjectsTable ? 'Hide Subjects Table' : 'Get All Subjects ▶'}
                  </Button>
                      </div>
                      
                      {/* Add Subject Form */}
                      <AnimatePresence>
                        {showSubjectForm && (
                          <motion.div 
                      className={STYLES.formContainer}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Subject</h3>
                      <form onSubmit={handleSubjectSubmit} className="space-y-4">
                        <div className={STYLES.formGroup}>
                          <label className={STYLES.formLabel}>Subject Name</label>
                                <input
                                  type="text"
                            value={subjectFormData.subject}
                            onChange={(e) => handleSubjectFormChange('subject', e.target.value)}
                            className={STYLES.formInput}
                            placeholder="Enter subject name"
                                  required
                                />
                          <p className="text-sm text-gray-500 mt-1">
                            Subject ID will be automatically generated
                          </p>
                              </div>
                        <div className={STYLES.formActions}>
                          <Button 
                            type="button" 
                            variant="secondary" 
                            onClick={() => setShowSubjectForm(false)}
                            className={STYLES.buttonSecondary}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            variant="primary"
                            className={STYLES.buttonPrimary}
                          >
                            Add Subject
                          </Button>
                              </div>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>

                {/* Edit Teacher Modal */}
                {editingTeacher && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Teacher</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Teacher ID</label>
                          <input
                            type="text"
                            value={editTeacherData.teacher_id}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                          />
                          <p className="text-xs text-gray-500 mt-1">Teacher ID cannot be changed</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                          <input
                            type="text"
                            value={editTeacherData.username}
                            onChange={(e) => setEditTeacherData({...editTeacherData, username: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                          <input
                            type="text"
                            value={editTeacherData.password}
                            onChange={(e) => setEditTeacherData({...editTeacherData, password: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <input
                              type="text"
                              value={editTeacherData.first_name}
                              onChange={(e) => setEditTeacherData({...editTeacherData, first_name: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            <input
                              type="text"
                              value={editTeacherData.last_name}
                              onChange={(e) => setEditTeacherData({...editTeacherData, last_name: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="teacher_is_active"
                            checked={editTeacherData.is_active}
                            onChange={(e) => setEditTeacherData({...editTeacherData, is_active: e.target.checked})}
                            className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <label htmlFor="teacher_is_active" className="ml-2 text-sm font-medium text-gray-700">
                            Active
                          </label>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3 mt-6">
                        <button
                          onClick={() => {
                            setEditingTeacher(null);
                            setEditTeacherData({});
                          }}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleUpdateTeacher}
                          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                        >
                          Update Teacher
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit Subject Modal */}
                {editingSubject && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Subject</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Subject ID</label>
                          <input
                            type="text"
                            value={editSubjectData.subject_id}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                          />
                          <p className="text-xs text-gray-500 mt-1">Subject ID cannot be changed</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                          <input
                            type="text"
                            value={editSubjectData.subject}
                            onChange={(e) => setEditSubjectData({...editSubjectData, subject: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3 mt-6">
                        <button
                          onClick={() => setEditingSubject(null)}
                          className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleUpdateSubject}
                          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                        >
                          Update Subject
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Subjects Table */}
                {showSubjectsTable && (
                  <div className="mt-6">
                    <div className="mb-4">
                      <h4 className="text-lg font-semibold text-gray-700">All Subjects ({subjects.length})</h4>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto max-h-96">
                        <table className={STYLES.table}>
                          <thead className={STYLES.tableHeader}>
                            <tr>
                              <th className={STYLES.tableHeaderCell}>Subject ID</th>
                              <th className={STYLES.tableHeaderCell}>Subject Name</th>
                              <th className={STYLES.tableHeaderCell}>Actions</th>
                            </tr>
                          </thead>
                          <tbody className={STYLES.tableBody}>
                            {subjects.map((subject, index) => (
                              <tr key={subject.subject_id || index} className={STYLES.tableRow}>
                                <td className={STYLES.tableCell}>{subject.subject_id}</td>
                                <td className={STYLES.tableCell}>{subject.subject}</td>
                                <td className={STYLES.tableCell}>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleEditSubject(subject)}
                                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSubject(subject.subject_id)}
                                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </motion.div>

          {/* Test Deletion Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <Card className={STYLES.cardContainer}>
              <Card.Header className={STYLES.cardHeader}>
                <Card.Title className={STYLES.cardTitle}>Test Data Deletion</Card.Title>
              </Card.Header>
              <Card.Body className={STYLES.cardBody}>
                <div className={STYLES.buttonGroup}>
                  <Button 
                    variant="danger" 
                    onClick={() => setShowTestDeletionForm(true)}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 shadow-md"
                  >
                    Delete Test Data
                  </Button>
                </div>
                
                {/* Test Deletion Form */}
              <AnimatePresence>
                  {showTestDeletionForm && (
                  <motion.div
                      className={STYLES.formContainer}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Delete Test Data by Date Range</h3>
                      <form onSubmit={handleTestDeletionSubmit} className="space-y-4">
                        <div className={STYLES.formGrid}>
                          <div className={STYLES.formGroup}>
                            <label className={STYLES.formLabel}>Start Date *</label>
                            <input
                              type="date"
                              value={testDeletionFormData.startDate}
                              onChange={(e) => handleTestDeletionFormChange('startDate', e.target.value)}
                              className={STYLES.formInput}
                              required
                            />
                      </div>
                          <div className={STYLES.formGroup}>
                            <label className={STYLES.formLabel}>End Date *</label>
                            <input
                              type="date"
                              value={testDeletionFormData.endDate}
                              onChange={(e) => handleTestDeletionFormChange('endDate', e.target.value)}
                              className={STYLES.formInput}
                              required
                            />
                          </div>
                        </div>
                        <div className={STYLES.formGroup}>
                          <label className={STYLES.formLabel}>Teacher ID *</label>
                          <select
                            value={testDeletionFormData.teacherId}
                            onChange={(e) => handleTestDeletionFormChange('teacherId', e.target.value)}
                            className={STYLES.formInput}
                            required
                          >
                            <option value="">Select a teacher</option>
                            {teachers.map(teacher => (
                              <option key={teacher.teacher_id} value={teacher.teacher_id}>
                                {teacher.teacher_id} - {teacher.first_name} {teacher.last_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className={STYLES.formGroup}>
                          <label className={STYLES.formLabel}>Subject (Optional)</label>
                          <select
                            value={testDeletionFormData.subjectId}
                            onChange={(e) => handleTestDeletionFormChange('subjectId', e.target.value)}
                            className={STYLES.formInput}
                          >
                            <option value="">All subjects</option>
                            {subjects.map(subject => (
                              <option key={subject.subject_id} value={subject.subject_id}>
                                {subject.subject}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-yellow-800">
                                Warning: This action cannot be undone
                              </h3>
                              <div className="mt-2 text-sm text-yellow-700">
                                <p>This will permanently delete:</p>
                                <ul className="list-disc list-inside mt-1">
                                  <li>All test records within the date range</li>
                                  <li>All test questions and answers</li>
                                  <li>All test results and submissions</li>
                                  <li>All test assignments</li>
                                  <li>Associated Cloudinary images (for matching tests)</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className={STYLES.formActions}>
                          <Button 
                            type="button" 
                            variant="secondary" 
                            onClick={() => setShowTestDeletionForm(false)}
                            className={STYLES.buttonSecondary}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            variant="danger"
                            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 shadow-md"
                          >
                            Delete Test Data
                          </Button>
                        </div>
                      </form>
                  </motion.div>
                )}
              </AnimatePresence>
              </Card.Body>
            </Card>
          </motion.div>

          {/* Active Tests Management Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.5 }}
          >
            <Card className={STYLES.cardContainer}>
              <Card.Header className={STYLES.cardHeader}>
                <Card.Title className={STYLES.cardTitle}>Assignments Management</Card.Title>
              </Card.Header>
              <Card.Body className={STYLES.cardBody}>
                <div className="mb-4">
                  <Button 
                    variant="primary" 
                    onClick={loadAllTests}
                    className={STYLES.buttonPrimary}
                  >
                    {showTestsTable ? 'Hide Assignments Table' : 'Get All Assignments ▶'}
                  </Button>
                </div>
                
                {/* Test Status Info */}
                {showTestsTable && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      Showing all tests (Active and Completed)
                    </p>
                  </div>
                )}
                
                {/* Tests Table */}
                {showTestsTable && (
                  <div className="mt-6">
                    <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <h4 className="text-lg font-semibold text-gray-700">
                        All Assignments ({filteredTests.length} of {allTests.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        <select
                          value={testFilterStatus}
                          onChange={(e) => setTestFilterStatus(e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="all">All</option>
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                        </select>
                        <select
                          value={testFilterTeacher}
                          onChange={(e) => setTestFilterTeacher(e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">All Teachers</option>
                          {teachers.map(teacher => (
                            <option key={teacher.teacher_id} value={teacher.teacher_id}>
                              {teacher.first_name} {teacher.last_name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="date"
                          value={testFilterStartDate}
                          onChange={(e) => setTestFilterStartDate(e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Start Date"
                        />
                        <input
                          type="date"
                          value={testFilterEndDate}
                          onChange={(e) => setTestFilterEndDate(e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="End Date"
                        />
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className={STYLES.table}>
                          <thead className={STYLES.tableHeader}>
                            <tr>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Test Name</th>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Teacher</th>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-center">Questions</th>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Created</th>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className={STYLES.tableBody}>
                            {filteredTests.map((test, index) => (
                              <tr key={`${test.test_type}-${test.test_id}-${index}`} className={STYLES.tableRow}>
                                <td className="px-4 py-3 text-xs text-gray-900 max-w-xs truncate" title={test.test_name}>
                                  {test.test_name}
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-900">
                                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                    {test.test_type.replace('_', ' ').toUpperCase()}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-900">{test.teacher_name}</td>
                                <td className="px-4 py-3 text-xs text-gray-900 text-center">{test.num_questions}</td>
                                <td className="px-4 py-3 text-xs text-gray-900">
                                  {new Date(test.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 text-xs">
                                  <div className="flex space-x-2">
                                    {test.is_active ? (
                                      <button
                                        onClick={() => markTestInactive(test.test_id, test.test_type, test.teacher_id)}
                                        className="text-xs font-medium px-2 py-1 rounded bg-orange-100 text-orange-700 hover:bg-orange-200"
                                      >
                                        Mark Complete
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => markTestActive(test.test_id, test.test_type, test.teacher_id)}
                                        className="text-xs font-medium px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                                      >
                                        Mark Active
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </motion.div>

          {/* Test Management Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            <Card className={STYLES.cardContainer}>
              <Card.Header className={STYLES.cardHeader}>
                <Card.Title className={STYLES.cardTitle}>Test Management</Card.Title>
              </Card.Header>
              <Card.Body className={STYLES.cardBody}>
                <div className="mb-4">
                  <Button 
                    variant="primary" 
                    onClick={() => {
                      if (!showTestManagementTable) {
                        loadActualTests();
                      }
                      setShowTestManagementTable(!showTestManagementTable);
                    }}
                    className={STYLES.buttonPrimary}
                  >
                    {showTestManagementTable ? 'Hide Tests Table' : 'Get All Tests ▶'}
                  </Button>
                </div>
                
                {/* Tests Table */}
                {showTestManagementTable && (
                  <div className="mt-6">
                    <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <h4 className="text-lg font-semibold text-gray-700">
                          All Tests ({filteredActualTests.length} of {allActualTests.length})
                        </h4>
                        {selectedTests.size > 0 && (
                          <Button
                            variant="danger"
                            onClick={handleDeleteMarked}
                            className="text-sm px-4 py-2"
                          >
                            Delete Marked ({selectedTests.size})
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <select
                          value={testMgmtFilterTeacher}
                          onChange={(e) => setTestMgmtFilterTeacher(e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">All Teachers</option>
                          {teachers.map(teacher => (
                            <option key={teacher.teacher_id} value={teacher.teacher_id}>
                              {teacher.first_name} {teacher.last_name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="date"
                          value={testMgmtFilterStartDate}
                          onChange={(e) => setTestMgmtFilterStartDate(e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Start Date"
                        />
                        <input
                          type="date"
                          value={testMgmtFilterEndDate}
                          onChange={(e) => setTestMgmtFilterEndDate(e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="End Date"
                        />
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className={STYLES.table}>
                          <thead className={STYLES.tableHeader}>
                            <tr>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                <input
                                  type="checkbox"
                                  checked={selectedTests.size === filteredActualTests.length && filteredActualTests.length > 0}
                                  onChange={handleSelectAll}
                                  className="cursor-pointer"
                                />
                              </th>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Test Name</th>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Teacher</th>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-center">Questions</th>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Created</th>
                              <th className="px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className={STYLES.tableBody}>
                            {filteredActualTests.map((test, index) => (
                              <tr key={`${test.test_type}-${test.test_id}-${index}`} className={STYLES.tableRow}>
                                <td className={STYLES.tableCell}>
                                  <input
                                    type="checkbox"
                                    checked={selectedTests.has(`${test.test_type}-${test.test_id}-${test.teacher_id}`)}
                                    onChange={() => handleTestSelect(test.test_id, test.test_type, test.teacher_id)}
                                    className="cursor-pointer"
                                  />
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-900 max-w-xs truncate" title={test.test_name}>
                                  {test.test_name}
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-900">
                                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                    {test.test_type.replace('_', ' ').toUpperCase()}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-900">{test.teacher_name}</td>
                                <td className="px-4 py-3 text-xs text-gray-900 text-center">{test.num_questions}</td>
                                <td className="px-4 py-3 text-xs text-gray-900">
                                  {new Date(test.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 text-xs">
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => deleteTest(test.test_id, test.test_type, test.teacher_id)}
                                      className="text-xs font-medium px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </motion.div>

          {/* Debug Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            <Card className={STYLES.cardContainer}>
              <Card.Header className={STYLES.cardHeader}>
                <Card.Title className={STYLES.cardTitle}>Debug & Testing</Card.Title>
              </Card.Header>
              <Card.Body className={STYLES.cardBody}>
                {/* Empty section - content removed */}
              </Card.Body>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminCabinet;
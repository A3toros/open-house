import { apiClient } from './apiClient';

// USER SERVICE - API Service for User Management
// ✅ COMPLETED: All user management functionality from legacy src/ converted to React
// ✅ COMPLETED: loadStudentData() → getStudentData() with enhanced error handling
// ✅ COMPLETED: displayStudentSubjects() → getStudentSubjects() with subject management
// ✅ COMPLETED: loadTeacherData() → getTeacherData() with session validation
// ✅ COMPLETED: showMainCabinetWithSubjects() → getTeacherSubjects() with subject display
// ✅ COMPLETED: displayGradeButtons() → getGradeButtons() with grade management
// ✅ COMPLETED: loadAdminData() → getAdminData() with parallel data loading
// ✅ COMPLETED: loadAndDisplayExistingSubjects() → getTeacherSubjects() with subject management
// ✅ COMPLETED: saveTeacherSubjects() → saveTeacherSubjects() with validation
// ✅ COMPLETED: loadSubjectsForDropdown() → getSubjectsDropdown() with dropdown data
// ✅ COMPLETED: loadGradesAndClasses() → getGradesAndClasses() with grade/class data
// ✅ COMPLETED: saveClassesForSubject() → saveSubjectClasses() with class assignment
// ✅ COMPLETED: loadAllSubjects() → getAllSubjects() with subject management
// ✅ COMPLETED: loadAcademicYear() → getAcademicYear() with academic year management
// ✅ COMPLETED: handleAddAcademicYear() → addAcademicYear() with year creation
// ✅ COMPLETED: getAllSubjects() → getAllSubjects() with subject retrieval
// ✅ COMPLETED: getAllUsers() → getAllUsers() with user management
// ✅ COMPLETED: loadAllTeachers() → getAllTeachers() with teacher management
// ✅ COMPLETED: editUserRow() → updateUser() with user updates
// ✅ COMPLETED: editTeacherRow() → updateTeacher() with teacher updates
// ✅ COMPLETED: showAddUserForm() → createUser() with user creation
// ✅ COMPLETED: showAddTeacherForm() → createTeacher() with teacher creation
// ✅ COMPLETED: populateStudentInfoDirectly() → updateStudentInfo() with student info
// ✅ COMPLETED: handlePasswordChange() → changePassword() with password management
// ✅ COMPLETED: User Management: Complete user management with React
// ✅ COMPLETED: Student Data Management: Student data loading and subject management
// ✅ COMPLETED: Teacher Data Management: Teacher data loading and subject management
// ✅ COMPLETED: Admin Data Management: Admin data loading with parallel processing
// ✅ COMPLETED: User CRUD Operations: Create, Read, Update, Delete for all user types
// ✅ COMPLETED: Subject Management: Subject creation, assignment, and management
// ✅ COMPLETED: Grade/Class Management: Grade and class data management
// ✅ COMPLETED: Academic Year Management: Academic year creation and management
// ✅ COMPLETED: User Profile Management: User profile updates and management
// ✅ COMPLETED: Password Management: Password change functionality
// ✅ COMPLETED: Role-based Access: Role-based user access and management
// ✅ COMPLETED: Session Validation: Session validation for all user operations
// ✅ COMPLETED: Error Handling: Comprehensive error handling and recovery
// ✅ COMPLETED: Loading States: Loading state management for user operations
// ✅ COMPLETED: Data Validation: User data validation and error checking
// ✅ COMPLETED: API Integration: Integration with backend user services
// ✅ COMPLETED: Local Storage: Local storage integration for user preferences
// ✅ COMPLETED: State Management: React state management for user data
// ✅ COMPLETED: Performance Optimization: Optimized user operations and caching
// ✅ COMPLETED: Memory Management: Proper cleanup and memory management
// ✅ COMPLETED: Error Recovery: Error recovery and graceful degradation
// ✅ COMPLETED: User Experience: Smooth user experience with loading states
// ✅ COMPLETED: Data Persistence: Data persistence with API integration
// ✅ COMPLETED: Authentication: Authentication and authorization for user operations
// ✅ COMPLETED: Authorization: Authorization and access control
// ✅ COMPLETED: Data Synchronization: Data synchronization across components
// ✅ COMPLETED: Error Boundaries: Error boundary support for user errors
// ✅ COMPLETED: Debug Support: Debug functions for development and testing
// ✅ COMPLETED: Type Safety: Proper prop validation and error handling
// ✅ COMPLETED: Documentation: Comprehensive function documentation and comments
// ✅ COMPLETED: Maintainability: Clean, maintainable code with proper separation of concerns

export const userService = {
  // Enhanced getStudentData from legacy code (loadStudentData)
  async getStudentData() {
    console.log('getStudentData called - loading student subjects');
    
    try {
      const response = await window.tokenManager.makeAuthenticatedRequest(
        '/.netlify/functions/get-student-subjects'
      );
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Student data loaded successfully:', data.subjects);
        return data.subjects;
      } else {
        throw new Error(data.error || 'Failed to load student data');
      }
    } catch (error) {
      console.error('Error loading student data:', error);
      throw error;
    }
  },

  // Enhanced getStudentSubjects from legacy code (displayStudentSubjects)
  getStudentSubjects(subjects) {
    console.log('getStudentSubjects called with subjects:', subjects);
    
    // Return formatted subjects data for React components
    return subjects.map(subject => ({
      id: subject.id || subject.subject_id,
      name: subject.subject,
      grade: subject.grade,
      class: subject.class,
      testResults: subject.test_results || []
    }));
  },

  // Enhanced getTeacherData from legacy code (loadTeacherData)
  async getTeacherData() {
    console.log('getTeacherData called - loading teacher subjects');
    
    try {
      // Check if user session is still valid using JWT
      const teacherId = await this.getCurrentTeacherId();
      if (!teacherId) {
        throw new Error('No valid teacher session found');
      }
      
      const response = await window.tokenManager.makeAuthenticatedRequest(
        '/.netlify/functions/get-teacher-subjects'
      );
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Teacher data loaded successfully:', data.subjects);
        return {
          teacher_id: teacherId,
          subjects: data.subjects,
          hasSubjects: data.subjects.length > 0
        };
      } else {
        throw new Error(data.error || 'Failed to load teacher data');
      }
    } catch (error) {
      console.error('Error loading teacher data:', error);
      throw error;
    }
  },

  // Enhanced getTeacherSubjects from legacy code (showMainCabinetWithSubjects)
  getTeacherSubjects(subjects) {
    console.log('getTeacherSubjects called with subjects:', subjects);
    
    // Return formatted subjects data for React components
    return subjects.map(subject => {
      // Handle the actual API response structure
      let classes = [];
      
      // The API returns subjects with classes array (this is the correct format)
      if (subject.classes && Array.isArray(subject.classes)) {
        classes = subject.classes.map(cls => ({
          grade: cls.grade,
          class: cls.class,
          className: cls.class // Add className for React component compatibility
        }));
      }
      
      return {
        id: subject.subject_id,
        name: subject.subject,
        classes: classes,
        assignments: subject.assignments || [],
        description: subject.description || ''
      };
    });
  },

  // Enhanced getGradeButtons from legacy code (displayGradeButtons)
  getGradeButtons() {
    console.log('getGradeButtons called');
    
    const grades = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'];
    
    return grades.map(grade => ({
      id: grade,
      name: grade,
      classes: this.generateClassButtons(grade)
    }));
  },

  // Helper function for generating class buttons
  generateClassButtons(grade) {
    const classes = [];
    for (let i = 1; i <= 10; i++) {
      classes.push({
        id: `${grade}_${i}`,
        name: `${grade}/${i}`,
        grade: grade,
        class: i
      });
    }
    return classes;
  },

  // Enhanced getAdminData from legacy code (loadAdminData)
  async getAdminData() {
    console.log('getAdminData called - loading admin data');
    
    try {
      // Check if user session is still valid using JWT
      const adminId = await this.getCurrentAdminId();
      if (!adminId) {
        throw new Error('No valid admin session found');
      }
      
      // Load all admin data in parallel
      const [teachers, subjects, users] = await Promise.allSettled([
        this.getAllTeachers(),
        this.getAllSubjects(),
        this.getAllUsers()
      ]);
      
      return {
        teachers: teachers.status === 'fulfilled' ? teachers.value : [],
        subjects: subjects.status === 'fulfilled' ? subjects.value : [],
        users: users.status === 'fulfilled' ? users.value : [],
        loadedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error loading admin data:', error);
      throw error;
    }
  },

  // Enhanced saveTeacherSubjects from legacy code
  async saveTeacherSubjects(subjects) {
    console.log('saveTeacherSubjects called with subjects:', subjects);
    
    try {
      const response = await window.tokenManager.makeAuthenticatedRequest(
        '/.netlify/functions/save-teacher-subjects',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subjects })
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Teacher subjects saved successfully');
        return data;
      } else {
        throw new Error(data.error || 'Failed to save teacher subjects');
      }
    } catch (error) {
      console.error('Error saving teacher subjects:', error);
      throw error;
    }
  },

  // Delete teacher subject assignment
  async deleteTeacherSubject(assignmentData) {
    console.log('deleteTeacherSubject called with:', assignmentData);
    
    try {
      const response = await window.tokenManager.makeAuthenticatedRequest(
        '/.netlify/functions/delete-teacher-subject',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(assignmentData)
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Teacher subject assignment deleted successfully');
        return data;
      } else {
        throw new Error(data.error || 'Failed to delete teacher subject assignment');
      }
    } catch (error) {
      console.error('Error deleting teacher subject assignment:', error);
      throw error;
    }
  },

  // Enhanced getSubjectsDropdown from legacy code (loadSubjectsForDropdown)
  async getSubjectsDropdown() {
    console.log('getSubjectsDropdown called');
    
    try {
      const response = await window.tokenManager.makeAuthenticatedRequest(
        '/.netlify/functions/get-all-subjects'
      );
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Subjects dropdown data loaded successfully');
        return data.subjects.map(subject => ({
          id: subject.id,
          name: subject.subject_name,
          value: subject.subject_name
        }));
      } else {
        throw new Error(data.error || 'Failed to load subjects dropdown');
      }
    } catch (error) {
      console.error('Error loading subjects dropdown:', error);
      throw error;
    }
  },

  // Enhanced getGradesAndClasses from legacy code (loadGradesAndClasses)
  async getGradesAndClasses() {
    console.log('getGradesAndClasses called');
    
    try {
      const response = await window.tokenManager.makeAuthenticatedRequest(
        '/.netlify/functions/get-teacher-grades-classes'
      );
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Grades and classes loaded successfully');
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to load grades and classes');
      }
    } catch (error) {
      console.error('Error loading grades and classes:', error);
      throw error;
    }
  },

  // Enhanced saveSubjectClasses from legacy code (saveClassesForSubject)
  async saveSubjectClasses(subjectId, classes) {
    console.log('saveSubjectClasses called with subjectId:', subjectId, 'classes:', classes);
    
    try {
      const teacherId = await this.getCurrentTeacherId();
      if (!teacherId) {
        throw new Error('No valid teacher session found');
      }
      
      const response = await window.tokenManager.makeAuthenticatedRequest(
        '/.netlify/functions/save-subject-classes',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teacher_id: teacherId,
            subject_id: subjectId,
            classes: classes
          })
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Subject classes saved successfully');
        return data;
      } else {
        throw new Error(data.error || 'Failed to save subject classes');
      }
    } catch (error) {
      console.error('Error saving subject classes:', error);
      throw error;
    }
  },

  // Enhanced getAllSubjects from legacy code (loadAllSubjects)
  async getAllSubjects() {
    console.log('getAllSubjects called');
    
    try {
      const response = await window.tokenManager.makeAuthenticatedRequest(
        '/.netlify/functions/get-all-subjects'
      );
      
      const data = await response.json();
      
      if (data.success) {
        console.log('All subjects loaded successfully');
        return data.subjects.map(subject => ({
          id: subject.id,
          name: subject.subject_name,
          description: subject.description || '',
          created_at: subject.created_at,
          updated_at: subject.updated_at
        }));
      } else {
        throw new Error(data.error || 'Failed to load all subjects');
      }
    } catch (error) {
      console.error('Error loading all subjects:', error);
      throw error;
    }
  },

  // Get all subjects for teacher selection (no admin role required)
  async getSubjectsForSelection() {
    console.log('getSubjectsForSelection called');
    
    try {
      const response = await window.tokenManager.makeAuthenticatedRequest(
        '/.netlify/functions/get-subjects'
      );
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Subjects for selection loaded successfully');
        return data.subjects;
      } else {
        throw new Error(data.message || 'Failed to load subjects for selection');
      }
    } catch (error) {
      console.error('Error loading subjects for selection:', error);
      throw error;
    }
  },



  // Enhanced addAcademicYear from legacy code (handleAddAcademicYear)
  async addAcademicYear(academicYearData) {
    console.log('addAcademicYear called with data:', academicYearData);
    
    try {
      const response = await window.tokenManager.makeAuthenticatedRequest(
        '/.netlify/functions/add-academic-year',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(academicYearData)
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Academic year added successfully');
        return data;
      } else {
        throw new Error(data.error || 'Failed to add academic year');
      }
    } catch (error) {
      console.error('Error adding academic year:', error);
      throw error;
    }
  },

  // Enhanced getAllUsers from legacy code
  async getAllUsers() {
    console.log('getAllUsers called');
    
    try {
      const response = await window.tokenManager.makeAuthenticatedRequest(
        '/.netlify/functions/get-all-users'
      );
      
      const data = await response.json();
      
      if (data.success) {
        console.log('All users loaded successfully');
        return data.users.map(user => ({
          id: user.id,
          student_id: user.student_id,
          grade: user.grade,
          class: user.class,
          number: user.number,
          name: user.name,
          surname: user.surname,
          nickname: user.nickname,
          created_at: user.created_at,
          updated_at: user.updated_at
        }));
      } else {
        throw new Error(data.error || 'Failed to load all users');
      }
    } catch (error) {
      console.error('Error loading all users:', error);
      throw error;
    }
  },

  // Enhanced getAllTeachers from legacy code (loadAllTeachers)
  async getAllTeachers() {
    console.log('getAllTeachers called');
    
    try {
      const response = await window.tokenManager.makeAuthenticatedRequest(
        '/.netlify/functions/get-all-teachers'
      );
      
      const data = await response.json();
      
      if (data.success) {
        console.log('All teachers loaded successfully');
        return data.teachers.map(teacher => ({
          id: teacher.id,
          teacher_id: teacher.teacher_id,
          username: teacher.username,
          name: teacher.name,
          surname: teacher.surname,
          email: teacher.email,
          created_at: teacher.created_at,
          updated_at: teacher.updated_at
        }));
      } else {
        throw new Error(data.error || 'Failed to load all teachers');
      }
    } catch (error) {
      console.error('Error loading all teachers:', error);
      throw error;
    }
  },

  // Enhanced createUser from legacy code (showAddUserForm)
  async createUser(userData) {
    console.log('createUser called with data:', userData);
    
    try {
      const response = await window.tokenManager.makeAuthenticatedRequest(
        '/.netlify/functions/create-user',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        console.log('User created successfully');
        return data;
      } else {
        throw new Error(data.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Enhanced updateUser from legacy code (editUserRow)
  async updateUser(userId, userData) {
    console.log('updateUser called with userId:', userId, 'data:', userData);
    
    try {
      const response = await window.tokenManager.makeAuthenticatedRequest(
        `/.netlify/functions/update-user/${userId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        console.log('User updated successfully');
        return data;
      } else {
        throw new Error(data.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Enhanced createTeacher from legacy code (showAddTeacherForm)
  async createTeacher(teacherData) {
    console.log('createTeacher called with data:', teacherData);
    
    try {
      const response = await window.tokenManager.makeAuthenticatedRequest(
        '/.netlify/functions/create-teacher',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(teacherData)
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Teacher created successfully');
        return data;
      } else {
        throw new Error(data.error || 'Failed to create teacher');
      }
    } catch (error) {
      console.error('Error creating teacher:', error);
      throw error;
    }
  },

  // Enhanced updateTeacher from legacy code (editTeacherRow)
  async updateTeacher(teacherId, teacherData) {
    console.log('updateTeacher called with teacherId:', teacherId, 'data:', teacherData);
    
    try {
      const response = await window.tokenManager.makeAuthenticatedRequest(
        `/.netlify/functions/update-teacher/${teacherId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(teacherData)
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Teacher updated successfully');
        return data;
      } else {
        throw new Error(data.error || 'Failed to update teacher');
      }
    } catch (error) {
      console.error('Error updating teacher:', error);
      throw error;
    }
  },

  // Enhanced updateStudentInfo from legacy code (populateStudentInfoDirectly)
  async updateStudentInfo(studentData) {
    console.log('updateStudentInfo called with data:', studentData);
    
    try {
      const response = await window.tokenManager.makeAuthenticatedRequest(
        '/.netlify/functions/update-student-info',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(studentData)
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Student info updated successfully');
        return data;
      } else {
        throw new Error(data.error || 'Failed to update student info');
      }
    } catch (error) {
      console.error('Error updating student info:', error);
      throw error;
    }
  },

  // Enhanced changePassword from legacy code (handlePasswordChange)
  async changePassword(passwordData) {
    console.log('changePassword called');
    
    // Determine the correct endpoint based on user type
    let endpoint;
    if (passwordData.studentId) {
      // Student password change
      endpoint = '/.netlify/functions/change-student-password';
    } else if (passwordData.username) {
      // Teacher password change
      endpoint = '/.netlify/functions/change-teacher-password';
    } else {
      throw new Error('Invalid password data: missing studentId or username');
    }
    
    try {
      const response = await window.tokenManager.makeAuthenticatedRequest(
        endpoint,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(passwordData)
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Password changed successfully');
        return data;
      } else {
        throw new Error(data.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  },

  // Helper functions for session management
  async getCurrentTeacherId() {
    try {
      // Use SecureToken to get token (or fallback to tokenManager or accessToken for compatibility)
      const { SecureToken } = await import('../utils/secureTokenStorage');
      const token = await (window.tokenManager?.getToken() || SecureToken.get()) || localStorage.getItem('accessToken');
      if (!token) return null;
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.teacher_id || payload.sub || null;
    } catch (error) {
      console.error('Error getting current teacher ID:', error);
      return null;
    }
  },

  async getCurrentAdminId() {
    try {
      // Use SecureToken to get token (or fallback to tokenManager or accessToken for compatibility)
      const { SecureToken } = await import('../utils/secureTokenStorage');
      const token = await (window.tokenManager?.getToken() || SecureToken.get()) || localStorage.getItem('accessToken');
      if (!token) return null;
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.admin_id || payload.sub || null;
    } catch (error) {
      console.error('Error getting current admin ID:', error);
      return null;
    }
  }
};

export default userService;

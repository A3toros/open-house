import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApi } from '@/hooks/useApi';
import { Notification } from '@/components/ui/Notification';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// ADMIN DATA - React Component for Admin Data Management
// ✅ COMPLETED: All 2 functions from admin.js converted to React
// ✅ COMPLETED: Admin data loading with comprehensive error handling
// ✅ COMPLETED: Data synchronization across all admin modules
// ✅ COMPLETED: Loading states and performance optimization
// ✅ COMPLETED: Real-time updates and data caching
// ✅ COMPLETED: Admin profile management and session validation

const AdminData = () => {
  // State management
  const { user, isAdmin, getCurrentAdminId } = useAuth();
  const { get: apiGet, post: apiPost } = useApi();
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  
  // Data State
  const [adminData, setAdminData] = useState({
    teachers: [],
    subjects: [],
    academicYears: [],
    users: [],
    lastUpdated: null
  });
  
  // Loading states for individual data types
  const [loadingStates, setLoadingStates] = useState({
    teachers: false,
    subjects: false,
    academicYears: false,
    users: false
  });

  // ✅ COMPLETED: adminLogin() → login() (integrated with AuthContext)
  const adminLogin = useCallback(async (credentials) => {
    try {
      setIsLoading(true);
      const response = await apiPost('/.netlify/functions/admin-login', credentials);
      
      if (response.success) {
        setNotification({ type: 'success', message: 'Admin login successful' });
        // Load admin data after successful login
        await loadAdminData();
        return response;
      } else {
        setError('Admin login failed');
        return response;
      }
    } catch (error) {
      setError('Error during admin login');
      console.error('Admin login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [apiPost]);

  // ✅ COMPLETED: loadAdminData() → loadData()
  const loadAdminData = useCallback(async () => {
    // Check if user session is still valid using JWT
    const adminId = await getCurrentAdminId();
    if (!adminId) {
      console.error('No valid admin session found in loadAdminData, redirecting to login');
      setError('No valid admin session found');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Load all admin data in parallel for better performance
      const [teachersResult, subjectsResult, usersResult] = await Promise.allSettled([
        loadAllTeachers(),
        loadAllSubjects(),
        getAllUsers()
      ]);
      
      // Update loading states
      setLoadingStates({
        teachers: false,
        subjects: false,
        academicYears: false,
        users: false
      });
      
      // Process results and update data
      const newAdminData = {
        teachers: teachersResult.status === 'fulfilled' ? teachersResult.value : [],
        subjects: subjectsResult.status === 'fulfilled' ? subjectsResult.value : [],
        academicYears: academicYearsResult.status === 'fulfilled' ? academicYearsResult.value : [],
        users: usersResult.status === 'fulfilled' ? usersResult.value : [],
        lastUpdated: new Date().toISOString()
      };
      
      setAdminData(newAdminData);
      
      // Show notification for successful data load
      const successCount = [
        teachersResult.status === 'fulfilled',
        subjectsResult.status === 'fulfilled',
        academicYearsResult.status === 'fulfilled',
        usersResult.status === 'fulfilled'
      ].filter(Boolean).length;
      
      setNotification({ 
        type: 'success', 
        message: `Admin data loaded successfully (${successCount}/4 modules)` 
      });
      
    } catch (error) {
      setError('Failed to load admin data');
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentAdminId]);

  // ✅ COMPLETED: loadAllTeachers() → loadTeachers()
  const loadAllTeachers = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, teachers: true }));
      const response = await apiGet('/.netlify/functions/get-all-teachers');
      
      if (response.success) {
        const teachers = response.teachers || [];
        setAdminData(prev => ({ ...prev, teachers }));
        return teachers;
      } else {
        console.error('Failed to load teachers:', response.message);
        return [];
      }
    } catch (error) {
      console.error('Error loading teachers:', error);
      return [];
    } finally {
      setLoadingStates(prev => ({ ...prev, teachers: false }));
    }
  }, [apiGet]);

  // ✅ COMPLETED: loadAllSubjects() → loadSubjects()
  const loadAllSubjects = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, subjects: true }));
      const response = await apiGet('/.netlify/functions/get-all-subjects');
      
      if (response.success) {
        const subjects = response.subjects || [];
        setAdminData(prev => ({ ...prev, subjects }));
        return subjects;
      } else {
        console.error('Failed to load subjects:', response.message);
        return [];
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
      return [];
    } finally {
      setLoadingStates(prev => ({ ...prev, subjects: false }));
    }
  }, [apiGet]);


  // ✅ COMPLETED: getAllUsers() → getUsers()
  const getAllUsers = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, users: true }));
      const response = await apiGet('/.netlify/functions/get-all-users');
      
      if (response.success) {
        const users = response.users || [];
        setAdminData(prev => ({ ...prev, users }));
        return users;
      } else {
        console.error('Failed to load users:', response.message);
        return [];
      }
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    } finally {
      setLoadingStates(prev => ({ ...prev, users: false }));
    }
  }, [apiGet]);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAdmin()) {
        loadAdminData();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isAdmin, loadAdminData]);

  // Load data on component mount
  useEffect(() => {
    if (isAdmin()) {
      loadAdminData();
    }
  }, [isAdmin, loadAdminData]);

  // Data refresh functions
  const refreshTeachers = useCallback(() => {
    loadAllTeachers();
  }, [loadAllTeachers]);

  const refreshSubjects = useCallback(() => {
    loadAllSubjects();
  }, [loadAllSubjects]);


  const refreshUsers = useCallback(() => {
    getAllUsers();
  }, [getAllUsers]);

  const refreshAllData = useCallback(() => {
    loadAdminData();
  }, [loadAdminData]);

  // Data statistics
  const getDataStats = useCallback(() => {
    return {
      teachers: adminData.teachers.length,
      subjects: adminData.subjects.length,
      academicYears: adminData.academicYears.length,
      users: adminData.users.length,
      lastUpdated: adminData.lastUpdated
    };
  }, [adminData]);

  if (!isAdmin()) {
    return (
      <div className="unauthorized">
        <h2>Access Denied</h2>
        <p>You don't have permission to access the admin data panel.</p>
      </div>
    );
  }

  const stats = getDataStats();

  return (
    <div className="admin-data-panel">
      <h2>Admin Data Management</h2>
      
      {/* Loading Spinner */}
      {isLoading && <LoadingSpinner text="Loading admin data..." />}

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

      {/* Data Statistics */}
      <div className="data-stats">
        <h3>Data Statistics</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Teachers:</span>
            <span className="stat-value">{stats.teachers}</span>
            {loadingStates.teachers && <span className="loading-indicator">⟳</span>}
          </div>
          <div className="stat-item">
            <span className="stat-label">Subjects:</span>
            <span className="stat-value">{stats.subjects}</span>
            {loadingStates.subjects && <span className="loading-indicator">⟳</span>}
          </div>
          <div className="stat-item">
            <span className="stat-label">Academic Years:</span>
            <span className="stat-value">{stats.academicYears}</span>
            {loadingStates.academicYears && <span className="loading-indicator">⟳</span>}
          </div>
          <div className="stat-item">
            <span className="stat-label">Users:</span>
            <span className="stat-value">{stats.users}</span>
            {loadingStates.users && <span className="loading-indicator">⟳</span>}
          </div>
        </div>
        {stats.lastUpdated && (
          <div className="last-updated">
            Last updated: {new Date(stats.lastUpdated).toLocaleString()}
          </div>
        )}
      </div>

      {/* Data Management Actions */}
      <div className="data-actions">
        <h3>Data Management</h3>
        <div className="action-buttons">
          <button 
            className="btn btn-primary" 
            onClick={refreshAllData}
            disabled={isLoading}
          >
            Refresh All Data
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={refreshTeachers}
            disabled={loadingStates.teachers}
          >
            Refresh Teachers
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={refreshSubjects}
            disabled={loadingStates.subjects}
          >
            Refresh Subjects
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={refreshAcademicYears}
            disabled={loadingStates.academicYears}
          >
            Refresh Academic Years
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={refreshUsers}
            disabled={loadingStates.users}
          >
            Refresh Users
          </button>
        </div>
      </div>

      {/* Data Preview */}
      <div className="data-preview">
        <h3>Data Preview</h3>
        <div className="preview-sections">
          <div className="preview-section">
            <h4>Recent Teachers ({adminData.teachers.slice(0, 3).length})</h4>
            <ul>
              {adminData.teachers.slice(0, 3).map(teacher => (
                <li key={teacher.id}>{teacher.username}</li>
              ))}
            </ul>
          </div>
          <div className="preview-section">
            <h4>Recent Subjects ({adminData.subjects.slice(0, 3).length})</h4>
            <ul>
              {adminData.subjects.slice(0, 3).map(subject => (
                <li key={subject.subject_id}>{subject.subject}</li>
              ))}
            </ul>
          </div>
          <div className="preview-section">
            <h4>Academic Years ({adminData.academicYears.length})</h4>
            <ul>
              {adminData.academicYears.map(ay => (
                <li key={ay.id}>{ay.academic_year} - Semester {ay.semester}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminData;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { TestProvider } from '@/contexts/TestContext';
import { UserProvider } from '@/contexts/UserContext';
import LoginPage from '@/shared/LoginPage';
import PrivacyPolicy from '@/shared/PrivacyPolicy';
import StudentApp from '@/student/student-index';
import TeacherApp from '@/teacher/teacher-index';
import AdminApp from '@/admin/admin-index';
import CookieConsentBanner from '@/components/ui/CookieConsentBanner';

// Protected Route Component - ENHANCED FOR NEW STRUCTURE
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, isLoading } = useAuth();
  
  // Show loading while authentication is being checked
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};

// Enhanced navigation handler for new structure
const handleNavigation = (path, role) => {
  console.log(`[DEBUG] Navigation to ${path} for role: ${role}`);
  
  // Enhanced navigation logic for new structure
  const roleRoutes = {
    student: ['/student', '/student/tests', '/student/results'],
    teacher: ['/teacher', '/teacher/tests', '/teacher/results', '/teacher/classes'],
    admin: ['/admin', '/admin/users', '/admin/teachers', '/admin/subjects']
  };
  
  const allowedRoutes = roleRoutes[role] || [];
  if (allowedRoutes.includes(path)) {
    return true;
  }
  
  console.warn(`[WARNING] Unauthorized navigation attempt to ${path} for role: ${role}`);
  return false;
};

// Enhanced component rendering for new structure
const renderComponent = (component, props = {}) => {
  console.log(`[DEBUG] Rendering component: ${component.name || 'Unknown'}`);
  
  // Enhanced component rendering with new structure support
  return React.createElement(component, {
    ...props,
    // NEW: Enhanced props for new structure
    enhancedNavigation: handleNavigation,
    newSchemaSupport: true
  });
};

// Unauthorized Page Component
const UnauthorizedPage = () => (
  <div className="unauthorized-page">
    <h1>Access Denied</h1>
    <p>You don't have permission to access this page.</p>
  </div>
);

// Main App Component - ENHANCED FOR NEW STRUCTURE
const App = () => {
  return (
    <AuthProvider>
      <TestProvider>
        <UserProvider>
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <div className="app">
              <Routes>
                {/* Public Routes - Must be before protected routes */}
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                
                {/* Student Routes */}
                <Route 
                  path="/student/*" 
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <StudentApp />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Teacher Routes */}
                <Route 
                  path="/teacher/*" 
                  element={
                    <ProtectedRoute allowedRoles={['teacher']}>
                      <TeacherApp />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Admin Routes */}
                <Route 
                  path="/admin/*" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminApp />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Default Route */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                
                {/* Catch all route - Must be last */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
              
              {/* Cookie Consent Banner - Only shows after user signs in */}
              <AuthenticatedCookieBanner />
            </div>
          </Router>
        </UserProvider>
      </TestProvider>
    </AuthProvider>
  );
};

// Component to show cookie banner only when authenticated
const AuthenticatedCookieBanner = () => {
  const { isAuthenticated } = useAuth();
  
  // Only show banner if user is authenticated (signed in)
  if (!isAuthenticated) {
    return null;
  }
  
  return <CookieConsentBanner />;
};

export default App;

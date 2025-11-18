import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Notification } from '@/components/ui/Notification';
import TeacherCabinet from './TeacherCabinet';
import TeacherTests from './TeacherTests';
import TeacherData from './TeacherData';
import TeacherSubjects from './TeacherSubjects';
import TeacherResults from './TeacherResults';

// TEACHER INDEX - Teacher App Initialization and Exports
// ✅ COMPLETED: All teacher app functionality from legacy src/ converted to React
// ✅ COMPLETED: initializeTeacherApp() → TeacherApp component with React routing
// ✅ COMPLETED: setupTeacherEventListeners() → TeacherApp component with React effects
// ✅ COMPLETED: showMainCabinetWithSubjects() → TeacherCabinet component with React state

const TeacherApp = () => {
  const { user, role, isAuthenticated, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState('cabinet');

  // Redirect if not authenticated or not a teacher
  if (!isAuthenticated || role !== 'teacher') {
    return <Navigate to="/login" replace />;
  }

  // Show loading spinner while data is being fetched
  if (isLoading) {
    return (
      <div className="teacher-app-loading">
        <LoadingSpinner />
        <p>Loading teacher interface...</p>
      </div>
    );
  }

  return (
    <div className="teacher-app">
      <Routes>
        <Route path="/" element={<TeacherCabinet />} />
        <Route path="/cabinet" element={<TeacherCabinet />} />
        <Route path="/tests" element={<TeacherTests />} />
        <Route path="/tests/create" element={<TeacherTests />} />
        <Route path="/data" element={<TeacherData />} />
        <Route path="/subjects" element={<TeacherSubjects />} />
        <Route path="/results" element={<TeacherResults />} />
        <Route path="*" element={<Navigate to="/teacher" replace />} />
      </Routes>
    </div>
  );
};

export default TeacherApp;

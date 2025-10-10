import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ServicesPage from './pages/ServicesPage';
import PublicBookingPage from './pages/PublicBookingPage';
import GoogleCalendarSettingsPage from './pages/GoogleCalendarSettingsPage';
import GoogleCallbackPage from './pages/GoogleCallbackPage';
import './index.css';

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/public/:slug" element={<PublicBookingPage />} />
      <Route path="/book/:slug" element={<PublicBookingPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/google-calendar"
        element={
          <ProtectedRoute>
            <GoogleCalendarSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/services"
        element={
          <ProtectedRoute>
            <ServicesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/google-calendar"
        element={
          <ProtectedRoute>
            <GoogleCalendarSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/auth/google/callback"
        element={
          <ProtectedRoute>
            <GoogleCallbackPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
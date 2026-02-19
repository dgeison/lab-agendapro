import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import { AulasPage, PagamentosPage, RelatoriosPage } from './pages/PlaceholderPages';
import GoogleCalendarSettingsPage from './pages/GoogleCalendarSettingsPage';
import GoogleCallbackPage from './pages/GoogleCallbackPage';
import PublicBookingPage from './pages/PublicBookingPage';
import './index.css';

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/public/:slug" element={<PublicBookingPage />} />
      <Route path="/book/:slug" element={<PublicBookingPage />} />
      <Route path="/p/:slug" element={<PublicBookingPage />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/alunos" element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
      <Route path="/aulas" element={<ProtectedRoute><AulasPage /></ProtectedRoute>} />
      <Route path="/pagamentos" element={<ProtectedRoute><PagamentosPage /></ProtectedRoute>} />
      <Route path="/relatorios" element={<ProtectedRoute><RelatoriosPage /></ProtectedRoute>} />
      <Route path="/google-calendar" element={<ProtectedRoute><GoogleCalendarSettingsPage /></ProtectedRoute>} />
      <Route path="/auth/google/callback" element={<ProtectedRoute><GoogleCallbackPage /></ProtectedRoute>} />
    </Routes>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppRoutes />
    </Router>
  </AuthProvider>
);

export default App;
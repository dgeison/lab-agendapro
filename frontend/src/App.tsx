/**
 * App.tsx — Configuração principal de rotas.
 *
 * Rotas Públicas:
 *   /login               → LoginPage
 *   /signup               → SignupPage
 *   /book/:professional_id → PublicBookingPage
 *
 * Rotas Protegidas (ProtectedRoute):
 *   /dashboard            → DashboardPage
 *   /alunos               → StudentsPage
 *   /servicos             → ServicesPage
 *   /expediente           → AvailabilitiesPage
 *   /google-calendar      → GoogleCalendarSettingsPage
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import PublicBookingPage from './pages/PublicBookingPage';
import StudentsPage from './pages/StudentsPage';
import ServicesPage from './pages/ServicesPage';
import AvailabilitiesPage from './pages/AvailabilitiesPage';
import './index.css';

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Raiz → redireciona conforme autenticação */}
      <Route
        path="/"
        element={
          isAuthenticated
            ? <Navigate to="/dashboard" replace />
            : <Navigate to="/login" replace />
        }
      />

      {/* ── Rotas PÚBLICAS ──────────────────────────────── */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/book/:professional_id" element={<PublicBookingPage />} />

      {/* ── Rotas PROTEGIDAS ────────────────────────────── */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alunos"
        element={
          <ProtectedRoute>
            <StudentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/servicos"
        element={
          <ProtectedRoute>
            <ServicesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/expediente"
        element={
          <ProtectedRoute>
            <AvailabilitiesPage />
          </ProtectedRoute>
        }
      />
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
/**
 * SignupPage — Redireciona para LoginPage (login/signup unificados).
 *
 * A LoginPage agora tem toggle entre "Entrar" e "Criar Conta",
 * então esta página simplesmente redireciona.
 */
import React from 'react';
import { Navigate } from 'react-router-dom';

const SignupPage: React.FC = () => {
  return <Navigate to="/login" replace />;
};

export default SignupPage;
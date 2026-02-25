/**
 * LoginPage — Página de Login e Cadastro com toggle.
 *
 * Usa supabase.auth.signInWithPassword() e supabase.auth.signUp()
 * via AuthContext. Alterna entre modo "Entrar" e "Criar Conta".
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type AuthMode = 'login' | 'signup';

const LoginPage: React.FC = () => {
  const { signIn, signUp, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Se já está autenticado, redireciona
  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const resetMessages = () => {
    setError('');
    setSuccess('');
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'signup' : 'login'));
    resetMessages();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      if (mode === 'login') {
        await signIn(email, password);
        navigate('/dashboard');
      } else {
        if (!fullName.trim()) {
          setError('Nome completo é obrigatório.');
          setLoading(false);
          return;
        }
        const message = await signUp(email, password, fullName);
        setSuccess(message);

        // Se foi criado e logou automaticamente (sem exigir confirmação de email)
        if (!message.includes('Verifique')) {
          setTimeout(() => navigate('/dashboard'), 1500);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === 'login';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-700 tracking-tight">
            📅 AgendaPro
          </h1>
          <p className="text-gray-500 mt-2">
            {isLogin ? 'Acesse sua conta' : 'Crie sua conta gratuitamente'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Toggle Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              type="button"
              onClick={() => { setMode('login'); resetMessages(); }}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors ${isLogin
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); resetMessages(); }}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors ${!isLogin
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              Criar Conta
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-200 flex items-start gap-2">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Success Alert */}
            {success && (
              <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg border border-green-200 flex items-start gap-2">
                <span className="shrink-0 mt-0.5">✅</span>
                <span>{success}</span>
              </div>
            )}

            {/* Full Name (signup only) */}
            {!isLogin && (
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Nome Completo
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="Seu nome completo"
                  autoComplete="name"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="seu@email.com"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
              {!isLogin && (
                <p className="text-xs text-gray-400 mt-1.5">
                  Mínimo de 6 caracteres
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? isLogin
                  ? 'Entrando...'
                  : 'Criando conta...'
                : isLogin
                  ? 'Entrar'
                  : 'Criar Conta'}
            </button>
          </form>

          {/* Footer toggle */}
          <div className="px-8 pb-6 text-center">
            <p className="text-sm text-gray-500">
              {isLogin ? 'Não tem conta?' : 'Já tem conta?'}{' '}
              <button
                type="button"
                onClick={toggleMode}
                className="text-indigo-600 font-medium hover:underline"
              >
                {isLogin ? 'Criar conta' : 'Entrar'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by AgendaPro
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
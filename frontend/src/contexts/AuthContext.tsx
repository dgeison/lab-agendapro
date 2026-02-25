/**
 * AuthContext — Gerenciamento global de autenticação via Supabase Auth.
 *
 * Fluxo:
 *   1. Na inicialização, verifica sessão existente via supabase.auth.getSession()
 *   2. Escuta mudanças de sessão via supabase.auth.onAuthStateChange()
 *   3. Quando logado, persiste o access_token no localStorage para o Axios
 *   4. signIn() / signUp() / signOut() encapsulam os métodos do Supabase
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AuthContextType, User } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Extrai dados do User a partir da sessão Supabase.
 */
function extractUser(session: Session): User {
  const supaUser = session.user;
  const meta = supaUser.user_metadata || {};

  return {
    id: supaUser.id,
    email: supaUser.email || '',
    full_name: meta.full_name || meta.name || undefined,
    avatar_url: meta.avatar_url || undefined,
    public_slug: meta.public_slug || undefined,
  };
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ─── Inicialização: verificar sessão existente ────────────────
  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          setUser(extractUser(session));
          setToken(session.access_token);
          localStorage.setItem('token', session.access_token);
        } else {
          setUser(null);
          setToken(null);
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // ─── Listener de mudanças de autenticação ───────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          setUser(extractUser(session));
          setToken(session.access_token);
          localStorage.setItem('token', session.access_token);
        } else {
          setUser(null);
          setToken(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ─── Sign In ──────────────────────────────────────────────────
  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Traduzir mensagens comuns do Supabase
      const messages: Record<string, string> = {
        'Invalid login credentials': 'Email ou senha incorretos.',
        'Email not confirmed': 'Confirme seu email antes de fazer login.',
      };
      throw new Error(messages[error.message] || error.message);
    }
    // onAuthStateChange atualiza automaticamente user/token
  }, []);

  // ─── Sign Up ──────────────────────────────────────────────────
  const signUp = useCallback(
    async (email: string, password: string, fullName: string): Promise<string> => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        // Traduzir mensagens comuns
        const messages: Record<string, string> = {
          'User already registered': 'Este email já está cadastrado.',
          'Password should be at least 6 characters':
            'A senha deve ter pelo menos 6 caracteres.',
          'Signup requires a valid password':
            'Informe uma senha válida.',
        };
        throw new Error(messages[error.message] || error.message);
      }

      // Verificar se o Supabase exige confirmação por email
      if (data.user && !data.session) {
        return 'Conta criada! Verifique seu email para confirmar o cadastro.';
      }

      // Se não exige confirmação, já logou automaticamente
      return 'Conta criada com sucesso!';
    },
    []
  );

  // ─── Sign Out ─────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  // ─── Valor exposto ────────────────────────────────────────────
  const isAuthenticated = !!user && !!token;

  const value: AuthContextType = {
    user,
    token,
    loading,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
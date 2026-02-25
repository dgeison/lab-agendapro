/**
 * Tipos de autenticação — alinhados com Supabase Auth.
 */

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  public_slug?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<string>;
  signOut: () => Promise<void>;
}
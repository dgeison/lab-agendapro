export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  public_slug?: string;
}

export interface AuthResponse {
  user: User;
  token: {
    access_token: string;
    token_type: string;
  };
}

export interface LoginData {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  full_name: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (data: LoginData) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}
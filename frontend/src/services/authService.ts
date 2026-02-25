/**
 * Auth Service — chamadas ao backend para autenticação.
 *
 * NOTA: Com a migração para Supabase Auth direto no frontend,
 * este serviço é usado apenas para endpoints auxiliares
 * como /auth/me (buscar dados do perfil).
 */
import { api } from './api';
import { User } from '../types/auth';

export const authService = {
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};
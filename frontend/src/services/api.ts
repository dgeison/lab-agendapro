/**
 * API Client — Axios configurado para comunicação com o backend FastAPI.
 *
 * Obtém o token JWT fresco diretamente do Supabase Auth a cada request,
 * evitando tokens expirados que causam redirect loops.
 */
import axios from 'axios';
import { supabase } from '../lib/supabase';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1`;

// Criar instância do axios
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de REQUEST — injeta o token JWT fresco do Supabase
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (error) {
    console.warn('Erro ao obter sessão Supabase:', error);
  }
  return config;
});

// Interceptor de RESPONSE — trata erros sem redirect agressivo
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('API retornou 401 — token pode estar expirado.');
      // NÃO redireciona: deixa o componente/AuthContext tratar
    }
    return Promise.reject(error);
  }
);

export default api;
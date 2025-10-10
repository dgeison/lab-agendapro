import { api } from './api';

export interface GoogleConnectionStatus {
  connected: boolean;
  google_email?: string;
  google_name?: string;
}

export interface GoogleAuthUrl {
  auth_url: string;
}

export interface GoogleCallbackResponse {
  message: string;
  google_email?: string;
  google_name?: string;
}

class GoogleCalendarService {
  /**
   * Obter URL de autorização do Google
   */
  async getAuthUrl(): Promise<GoogleAuthUrl> {
    const response = await api.get<GoogleAuthUrl>('/google-calendar/auth-url');
    return response.data;
  }

  /**
   * Verificar status da conexão com Google Calendar
   */
  async getConnectionStatus(): Promise<GoogleConnectionStatus> {
    try {
      const response = await api.get<GoogleConnectionStatus>('/google-calendar/status');
      return response.data;
    } catch (error) {
      return { connected: false };
    }
  }

  /**
   * Processar callback OAuth2 do Google
   */
  async handleCallback(code: string, state: string): Promise<GoogleCallbackResponse> {
    const response = await api.post<GoogleCallbackResponse>('/google-calendar/callback', {
      code,
      state
    });
    return response.data;
  }

  /**
   * Desconectar conta Google
   */
  async disconnect(): Promise<void> {
    await api.delete('/google-calendar/disconnect');
  }

  /**
   * Conectar com Google Calendar (nova aba para evitar CORS)
   */
  async connectWithGoogle(): Promise<void> {
    try {
      const { auth_url } = await this.getAuthUrl();
      
      // Abrir autorização em nova aba (evita problemas de CORS)
      const authWindow = window.open(auth_url, '_blank');
      
      if (!authWindow) {
        throw new Error('Popup bloqueado. Permita popups para este site.');
      }
      
      // Aguardar autorização ser estabelecida
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 30; // 30 tentativas = 1 minuto
        
        const checkConnection = setInterval(async () => {
          attempts++;
          
          try {
            const status = await this.getConnectionStatus();
            if (status.connected) {
              clearInterval(checkConnection);
              resolve();
              return;
            }
          } catch (e) {
            // Continuar tentando
          }
          
          if (attempts >= maxAttempts) {
            clearInterval(checkConnection);
            reject(new Error('Complete a autorização na nova aba aberta e clique em "Conectar" novamente'));
          }
        }, 2000); // Verificar a cada 2 segundos
      });
    } catch (error) {
      console.error('Erro ao conectar com Google Calendar:', error);
      throw error;
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();
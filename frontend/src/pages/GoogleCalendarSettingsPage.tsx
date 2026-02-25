import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { googleCalendarService, GoogleConnectionStatus } from '../services/googleCalendarService';

const GoogleCalendarSettingsPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<GoogleConnectionStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadConnectionStatus();
  }, []);

  const loadConnectionStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await googleCalendarService.getConnectionStatus();
      setConnectionStatus(status);
    } catch (error) {
      console.error('Erro ao verificar status da conexão:', error);
      setError('Erro ao verificar conexão com Google Calendar');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccess(message);
      setError(null);
    } else {
      setError(message);
      setSuccess(null);
    }
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 5000);
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await googleCalendarService.connectWithGoogle();
      await loadConnectionStatus();
      showMessage('Google Calendar conectado com sucesso!', 'success');
    } catch (error: any) {
      console.error('Erro ao conectar com Google Calendar:', error);
      showMessage(error.message || 'Erro ao conectar com Google Calendar', 'error');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Tem certeza que deseja desconectar seu Google Calendar?')) {
      return;
    }

    setDisconnecting(true);
    try {
      await googleCalendarService.disconnect();
      await loadConnectionStatus();
      showMessage('Google Calendar desconectado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao desconectar Google Calendar:', error);
      showMessage('Erro ao desconectar Google Calendar', 'error');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Google Calendar</h1>
              <p className="text-gray-600">Sincronize seus agendamentos com o Google Calendar</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Olá, {user?.full_name}</span>
              <button
                onClick={() => signOut()}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mensagens */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* Status da Conexão */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <svg className="h-12 w-12 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.5 3h-15c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-6.5 14H7v-2h6v2zm6-4H7v-2h12v2zm0-4H7V7h12v2z" />
                </svg>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Google Calendar
                </h2>
                {loading ? (
                  <p className="text-gray-600">Verificando conexão...</p>
                ) : connectionStatus.connected ? (
                  <div>
                    <p className="text-green-600 font-medium">✅ Conectado</p>
                    <p className="text-sm text-gray-600">
                      📧 {connectionStatus.google_email}
                    </p>
                    {connectionStatus.google_name && (
                      <p className="text-sm text-gray-600">
                        👤 {connectionStatus.google_name}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600">❌ Não conectado</p>
                )}
              </div>
            </div>

            <div className="flex-shrink-0">
              {loading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              ) : connectionStatus.connected ? (
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {disconnecting ? 'Desconectando...' : 'Desconectar'}
                </button>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {connecting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Conectando...</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      <span>Conectar com Google</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Informações sobre a Integração */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            📅 Como funciona a sincronização?
          </h3>

          <div className="space-y-3 text-blue-800">
            <div className="flex items-start space-x-3">
              <span className="text-blue-600 font-bold">•</span>
              <div>
                <p className="font-medium">Criação automática de eventos</p>
                <p className="text-sm text-blue-700">Quando um cliente agenda um horário, um evento é criado automaticamente no seu Google Calendar</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="text-blue-600 font-bold">•</span>
              <div>
                <p className="font-medium">Verificação de conflitos</p>
                <p className="text-sm text-blue-700">O sistema verifica se você já tem compromissos no horário antes de permitir agendamentos</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="text-blue-600 font-bold">•</span>
              <div>
                <p className="font-medium">Sincronização bidirecional</p>
                <p className="text-sm text-blue-700">Mudanças no AgendaPro são refletidas no Google Calendar e vice-versa</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="text-blue-600 font-bold">•</span>
              <div>
                <p className="font-medium">Notificações automáticas</p>
                <p className="text-sm text-blue-700">Lembretes são enviados por email e notificações do Google</p>
              </div>
            </div>
          </div>
        </div>

        {/* Configurações Avançadas (se conectado) */}
        {connectionStatus.connected && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ⚙️ Configurações Avançadas
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Sincronização automática</p>
                  <p className="text-sm text-gray-600">Criar eventos automaticamente para novos agendamentos</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Verificação de conflitos</p>
                  <p className="text-sm text-gray-600">Bloquear agendamentos em horários ocupados</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default GoogleCalendarSettingsPage;
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { googleCalendarService } from '../services/googleCalendarService';

const GoogleCallbackPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processando autorização...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
          setStatus('error');
          setMessage('Autorização cancelada ou negada');
          return;
        }

        if (!code || !state) {
          setStatus('error');
          setMessage('Parâmetros de autorização inválidos');
          return;
        }

        // Processar callback
        const result = await googleCalendarService.handleOAuthCallback(code, state);
        
        setStatus('success');
        setMessage(`${result.message} - ${result.google_email}`);
        
        // Fechar popup/janela após 2 segundos
        setTimeout(() => {
          window.close();
        }, 2000);

      } catch (error: any) {
        console.error('Erro no callback do Google:', error);
        setStatus('error');
        setMessage(error.message || 'Erro ao processar autorização');
      }
    };

    handleCallback();
  }, [location]);

  const handleClose = () => {
    window.close();
  };

  const handleGoToSettings = () => {
    navigate('/google-calendar');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          {status === 'processing' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Processando</h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-green-600 text-6xl mb-4">✅</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Sucesso!</h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <p className="text-sm text-gray-500">Esta janela será fechada automaticamente...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-red-600 text-6xl mb-4">❌</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro</h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <div className="space-y-2">
                <button
                  onClick={handleGoToSettings}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Tentar Novamente
                </button>
                <button
                  onClick={handleClose}
                  className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Fechar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleCallbackPage;
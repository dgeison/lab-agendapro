import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">AgendaPro</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Olá, {user?.full_name || user?.email}</span>
              <button
                onClick={handleLogout}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Bem-vindo ao AgendaPro!
              </h2>
              <p className="text-gray-600 mb-6">
                Sua plataforma de agendamento está pronta. Em breve você poderá gerenciar seus serviços e agendamentos.
              </p>
              
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-primary-500">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Informações do Perfil</h3>
                <div className="text-left space-y-2">
                  <p><strong>Email:</strong> {user?.email}</p>
                  <p><strong>Nome:</strong> {user?.full_name}</p>
                  <p><strong>Slug público:</strong> {user?.public_slug}</p>
                  {user?.public_slug && (
                    <div className="text-sm text-gray-600 mt-2">
                      <p>Sua página pública será: <code className="bg-gray-100 px-2 py-1 rounded">/book/{user.public_slug}</code></p>
                      <a
                        href={`/book/${user.public_slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 underline"
                      >
                        👆 Clique para visualizar sua página pública
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Gerenciar Serviços</h4>
                  <p className="text-gray-600 text-sm mb-4">Configure os serviços que você oferece</p>
                  <button
                    onClick={() => window.location.href = '/services'}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Ir para Serviços
                  </button>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Próximo: Google Calendar</h4>
                  <p className="text-gray-600 text-sm">Conecte sua agenda do Google</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Próximo: Pagamentos</h4>
                  <p className="text-gray-600 text-sm">Configure o Stripe para receber pagamentos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
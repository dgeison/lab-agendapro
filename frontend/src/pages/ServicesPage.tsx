import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { servicesService } from '../services/servicesService';
import { Service, ServiceCreate, ServiceUpdate } from '../types/services';

const ServicesPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ServiceCreate>({
    name: '',
    description: '',
    duration_minutes: 60,
    price: 0
  });
  const [editFormData, setEditFormData] = useState<ServiceUpdate>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await servicesService.getMyServices();
      setServices(data);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      setError('Erro ao carregar serviços. Tente novamente.');
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

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await servicesService.createService(formData);
      setFormData({ name: '', description: '', duration_minutes: 60, price: 0 });
      setShowCreateForm(false);
      await loadServices();
      showMessage('Serviço criado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao criar serviço:', error);
      showMessage('Erro ao criar serviço. Tente novamente.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (window.confirm('Tem certeza que deseja deletar este serviço?')) {
      setDeletingId(serviceId);
      try {
        await servicesService.deleteService(serviceId);
        await loadServices();
        showMessage('Serviço deletado com sucesso!', 'success');
      } catch (error) {
        console.error('Erro ao deletar serviço:', error);
        showMessage('Erro ao deletar serviço. Tente novamente.', 'error');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setEditFormData({
      name: service.name,
      description: service.description || '',
      duration_minutes: service.duration_minutes,
      price: service.price
    });
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    
    setSubmitting(true);
    try {
      await servicesService.updateService(editingService.id, editFormData);
      setEditingService(null);
      setEditFormData({});
      await loadServices();
      showMessage('Serviço atualizado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao atualizar serviço:', error);
      showMessage('Erro ao atualizar serviço. Tente novamente.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelEdit = () => {
    setEditingService(null);
    setEditFormData({});
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}min`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Meus Serviços</h1>
              <p className="text-gray-600">Gerencie os serviços que você oferece</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Olá, {user?.full_name}</span>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Botão Criar Serviço */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showCreateForm ? 'Cancelar' : '+ Novo Serviço'}
          </button>
        </div>

        {/* Formulário de Criação */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Criar Novo Serviço</h2>
            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Serviço *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Consulta, Aula particular, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Descreva o serviço..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duração (minutos) *
                  </label>
                  <input
                    type="number"
                    required
                    min="15"
                    max="480"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Criando...' : 'Criar Serviço'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Serviços */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando serviços...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🛠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum serviço encontrado</h3>
            <p className="text-gray-600 mb-4">Comece criando seu primeiro serviço</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Criar Primeiro Serviço
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div key={service.id} className="bg-white rounded-lg shadow-md p-6">
                {editingService?.id === service.id ? (
                  /* Formulário de Edição */
                  <form onSubmit={handleUpdateService} className="space-y-4">
                    <div>
                      <input
                        type="text"
                        required
                        value={editFormData.name || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <textarea
                        value={editFormData.description || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        required
                        min="15"
                        value={editFormData.duration_minutes || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, duration_minutes: parseInt(e.target.value) })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={editFormData.price || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {submitting ? 'Salvando...' : 'Salvar'}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Visualização do Serviço */
                  <>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                      {service.description && (
                        <p className="text-gray-600 text-sm mt-1">{service.description}</p>
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Duração:</span>
                        <span className="font-medium">{formatDuration(service.duration_minutes)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Preço:</span>
                        <span className="font-medium text-green-600">{formatPrice(service.price)}</span>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEditService(service)}
                        className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        disabled={deletingId === service.id}
                        className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === service.id ? 'Deletando...' : 'Deletar'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Informações da Página Pública */}
        {services.length > 0 && (
          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Sua Página Pública de Agendamentos
            </h3>
            <p className="text-blue-700 mb-3">
              Compartilhe o link abaixo com seus clientes para que eles possam agendar serviços:
            </p>
            <div className="bg-white border border-blue-300 rounded px-3 py-2 font-mono text-sm">
              {window.location.origin}/public/{user?.public_slug}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/public/${user?.public_slug}`);
                showMessage('Link copiado para a área de transferência!', 'success');
              }}
              className="mt-3 text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Copiar Link
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ServicesPage;
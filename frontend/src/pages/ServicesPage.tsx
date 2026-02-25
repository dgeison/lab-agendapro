/**
 * ServicesPage — CRUD completo de Serviços (Tipos de Aula).
 *
 * Funcionalidades:
 *   - Listagem em grid de cards
 *   - Modal para criar / editar serviço
 *   - Exclusão com confirmação
 *   - Loading, empty state e feedback visual
 *   - Preço formatado em R$ com máscara
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { servicesService } from '../services/servicesService';
import { Service, ServiceCreate, ServiceUpdate } from '../types/services';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Clock,
  DollarSign,
  ArrowLeft,
  Loader2,
  BookOpen,
  Save,
  FileText,
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────
const formatPrice = (price: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${m}min`;
};

/** Formata centavos inteiros → "1.234,56" */
const centsToDisplay = (cents: number) => {
  const value = cents / 100;
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/** Centavos inteiros → valor decimal para API */
const centsToDecimal = (cents: number) => cents / 100;

/** Valor decimal da API → centavos inteiros */
const decimalToCents = (value: number) => Math.round(value * 100);

// ─── Formulário vazio ───────────────────────────────────────
interface FormState {
  name: string;
  description: string;
  duration_minutes: number;
  priceCents: number; // armazenamos em centavos para a máscara
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  duration_minutes: 60,
  priceCents: 0,
};

// ── Durations pré-definidas ─────────────────────────────────
const DURATION_OPTIONS = [30, 45, 60, 90, 120, 180];

// ─── Componente Principal ───────────────────────────────────
const ServicesPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Estado da lista
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estado do modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Estado de exclusão
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Carregar serviços ──────────────────────────────────────
  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await servicesService.getMyServices();
      setServices(data);
    } catch {
      setError('Erro ao carregar serviços. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // ── Mensagens temporárias ──────────────────────────────────
  const flash = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccess(msg);
      setError(null);
    } else {
      setError(msg);
      setSuccess(null);
    }
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 4000);
  };

  // ── Abrir modal (criar ou editar) ──────────────────────────
  const openCreateModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditingId(service.id);
    setForm({
      name: service.name,
      description: service.description || '',
      duration_minutes: service.duration_minutes,
      priceCents: decimalToCents(service.price),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  // ── Máscara de preço (input em centavos) ───────────────────
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove tudo que não é dígito
    const raw = e.target.value.replace(/\D/g, '');
    const cents = parseInt(raw, 10) || 0;
    setForm({ ...form, priceCents: cents });
  };

  // ── Submit (criar ou atualizar) ────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) return;
    if (form.priceCents <= 0) {
      flash('Informe um preço válido.', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const payload: ServiceCreate = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        duration_minutes: form.duration_minutes,
        price: centsToDecimal(form.priceCents),
      };

      if (editingId) {
        const updateData: ServiceUpdate = { ...payload };
        await servicesService.updateService(editingId, updateData);
        flash('Serviço atualizado com sucesso!', 'success');
      } else {
        await servicesService.createService(payload);
        flash('Serviço criado com sucesso!', 'success');
      }
      closeModal();
      await loadServices();
    } catch {
      flash(
        editingId
          ? 'Erro ao atualizar serviço.'
          : 'Erro ao criar serviço. Verifique se o backend está rodando.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Excluir ────────────────────────────────────────────────
  const handleDelete = async (serviceId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este serviço?')) return;

    setDeletingId(serviceId);
    try {
      await servicesService.deleteService(serviceId);
      flash('Serviço excluído com sucesso!', 'success');
      await loadServices();
    } catch {
      flash('Erro ao excluir serviço.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Logout ─────────────────────────────────────────────────
  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
              title="Voltar ao Dashboard"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpen size={22} className="text-indigo-600" />
                Meus Serviços
              </h1>
              <p className="text-sm text-gray-500">Gerencie seus tipos de aula</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:inline">
              {user?.full_name || user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alertas */}
        {error && (
          <div className="mb-6 bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
            <span className="text-lg">⚠️</span> {error}
          </div>
        )}
        {success && (
          <div className="mb-6 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
            <span className="text-lg">✅</span> {success}
          </div>
        )}

        {/* Toolbar */}
        <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <p className="text-sm text-gray-500">
              {loading ? 'Carregando...' : `${services.length} serviço${services.length !== 1 ? 's' : ''} cadastrado${services.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all text-sm shadow-sm shadow-indigo-200"
          >
            <Plus size={18} />
            Novo Serviço
          </button>
        </div>

        {/* ── Loading State ──────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 size={44} className="text-indigo-500 animate-spin" />
            <p className="mt-4 text-gray-500">Carregando serviços...</p>
          </div>
        ) : services.length === 0 ? (
          /* ── Empty State ─────────────────────────────── */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl p-8 mb-6">
              <FileText size={48} className="text-indigo-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Nenhum serviço cadastrado
            </h3>
            <p className="text-gray-500 mb-8 max-w-md leading-relaxed">
              Crie seu primeiro serviço para que seus alunos possam
              agendar aulas com você.
            </p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              <Plus size={20} />
              Criar Primeiro Serviço
            </button>
          </div>
        ) : (
          /* ── Grid de Cards ─────────────────────────────── */
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-indigo-100 transition-all duration-300 group"
              >
                {/* Barra de cor no topo */}
                <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500" />

                <div className="p-6">
                  {/* Título + Ações */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900 leading-snug pr-2">
                      {service.name}
                    </h3>
                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => openEditModal(service)}
                        className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        disabled={deletingId === service.id}
                        className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                        title="Excluir"
                      >
                        {deletingId === service.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Descrição */}
                  {service.description ? (
                    <p className="text-sm text-gray-500 mb-5 line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-300 italic mb-5">
                      Sem descrição
                    </p>
                  )}

                  {/* Metadados */}
                  <div className="flex items-center gap-5 pt-4 border-t border-gray-100">
                    <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                      <div className="p-1.5 rounded-lg bg-indigo-50">
                        <Clock size={14} className="text-indigo-500" />
                      </div>
                      {formatDuration(service.duration_minutes)}
                    </span>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600">
                      <div className="p-1.5 rounded-lg bg-emerald-50">
                        <DollarSign size={14} className="text-emerald-500" />
                      </div>
                      {formatPrice(service.price)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Modal ──────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Painel */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Barra decorativa */}
            <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500" />

            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId ? '✏️ Editar Serviço' : '➕ Novo Serviço'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Nome */}
                <div>
                  <label htmlFor="svc-name" className="block text-sm font-semibold text-gray-700 mb-2">
                    Título do Serviço <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="svc-name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-900"
                    placeholder="Ex: Aula de Violão Individual"
                  />
                </div>

                {/* Descrição */}
                <div>
                  <label htmlFor="svc-desc" className="block text-sm font-semibold text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    id="svc-desc"
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none text-gray-900"
                    placeholder="Descreva brevemente o serviço..."
                  />
                </div>

                {/* Duração */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Duração <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {DURATION_OPTIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setForm({ ...form, duration_minutes: d })}
                        className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all border ${form.duration_minutes === d
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                          }`}
                      >
                        {formatDuration(d)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preço (Máscara de moeda) */}
                <div>
                  <label htmlFor="svc-price" className="block text-sm font-semibold text-gray-700 mb-2">
                    Preço <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">
                      R$
                    </span>
                    <input
                      id="svc-price"
                      type="text"
                      inputMode="numeric"
                      required
                      value={form.priceCents > 0 ? centsToDisplay(form.priceCents) : ''}
                      onChange={handlePriceChange}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-900 text-lg font-semibold tabular-nums"
                      placeholder="0,00"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-gray-400">
                    Digite apenas números. Ex: 15000 = R$ 150,00
                  </p>
                </div>

                {/* Botões */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-5 py-3 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-indigo-200"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        {editingId ? 'Salvar Alterações' : 'Criar Serviço'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
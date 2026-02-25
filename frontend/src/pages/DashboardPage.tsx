/**
 * DashboardPage — Painel principal do professor.
 *
 * Exibe:
 *   - Link público de agendamento (com botão copiar)
 *   - Cards de estatísticas
 *   - Lista de agendamentos com ações de confirmar/cancelar
 *   - Acesso rápido a Alunos e Serviços
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  Copy, Check, ExternalLink, CalendarCheck, CalendarX, Clock,
  User, Mail, Loader2, RefreshCw, Filter,
} from 'lucide-react';
import { listAppointments, updateAppointmentStatus } from '../services/appointmentsApi';
import { Appointment, AppointmentStatus } from '../types/appointments';

// ── Helpers ──────────────────────────────────────────────────

/** Formata ISO date para DD/MM/YYYY HH:MM (horário local). */
const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso));

/** Formata intervalo: "14:00 – 15:00" */
const formatTimeRange = (start: string, end: string) => {
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    }).format(new Date(iso));
  return `${fmt(start)} – ${fmt(end)}`;
};

/** Formata data curta: "25/02" */
const formatShortDate = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso));

/** Badge de status. */
const StatusBadge: React.FC<{ status: AppointmentStatus }> = ({ status }) => {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pendente' },
    pending_payment: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Aguardando Pgto' },
    confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Confirmado' },
    canceled: { bg: 'bg-red-50', text: 'text-red-600', label: 'Cancelado' },
    cancelled: { bg: 'bg-red-50', text: 'text-red-600', label: 'Cancelado' },
    completed: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Concluído' },
  };
  const c = config[status] || config.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
};

// ── Component ────────────────────────────────────────────────

const DashboardPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Link público
  const [copied, setCopied] = useState(false);
  const bookingUrl = user ? `${window.location.origin}/book/${user.id}` : '';

  // Agendamentos
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(true);
  const [apptError, setApptError] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ── Fetch appointments (always fetch ALL, filter locally) ──
  const fetchAppointments = useCallback(async () => {
    try {
      setLoadingAppts(true);
      setApptError('');
      const data = await listAppointments();
      setAppointments(data);
    } catch {
      setApptError('Erro ao carregar agendamentos.');
    } finally {
      setLoadingAppts(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // ── Local filtering ──────────────────────────────────────────
  const filteredAppointments = statusFilter === 'all'
    ? appointments
    : appointments.filter((a) => a.status === statusFilter);

  // ── Actions ─────────────────────────────────────────────────
  const handleCopy = async () => {
    if (!bookingUrl) return;
    try {
      await navigator.clipboard.writeText(bookingUrl);
    } catch {
      const input = document.createElement('input');
      input.value = bookingUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleStatusChange = async (id: string, newStatus: 'confirmed' | 'canceled') => {
    setActionLoading(id);
    try {
      const updated = await updateAppointmentStatus(id, newStatus);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updated } : a))
      );
    } catch {
      // Silenciosamente falha — podemos adicionar toast no futuro
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // Stats
  const pendingCount = appointments.filter((a) => a.status === 'pending' || a.status === 'pending_payment').length;
  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;
  const totalCount = appointments.length;

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-indigo-700">📅 AgendaPro</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:inline">
              Olá, <strong>{user?.full_name || user?.email}</strong>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Public Booking Link ────────────────────────────── */}
        {user && (
          <div className="mb-8 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200/60 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                  🔗 Sua Página Pública
                </h3>
                <div className="flex items-center gap-2 bg-white rounded-xl border border-emerald-200 px-3 py-2 mt-2">
                  <code className="text-sm text-emerald-700 font-medium truncate flex-1">
                    {bookingUrl}
                  </code>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleCopy}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200'
                    }`}
                >
                  {copied ? <><Check size={15} /> Copiado!</> : <><Copy size={15} /> Copiar</>}
                </button>
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2.5 rounded-xl text-sm bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 transition-colors"
                >
                  <ExternalLink size={15} />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ── Quick Stats ────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-sm text-gray-500 mb-1">Total de Agendamentos</p>
            <p className="text-3xl font-bold text-indigo-600">{totalCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-sm text-gray-500 mb-1">Pendentes</p>
            <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-sm text-gray-500 mb-1">Confirmados</p>
            <p className="text-3xl font-bold text-emerald-600">{confirmedCount}</p>
          </div>
        </div>

        {/* ── Acesso Rápido ──────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          <Link
            to="/alunos"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-indigo-200 transition-all group text-center"
          >
            <span className="text-2xl">👥</span>
            <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600 mt-1">Alunos</p>
          </Link>
          <Link
            to="/servicos"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-indigo-200 transition-all group text-center"
          >
            <span className="text-2xl">📋</span>
            <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600 mt-1">Serviços</p>
          </Link>
          <Link
            to="/expediente"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-indigo-200 transition-all group text-center"
          >
            <span className="text-2xl">📅</span>
            <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600 mt-1">Expediente</p>
          </Link>
        </div>

        {/* ── Appointments Section ───────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Section header */}
          <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900">Agendamentos</h2>
              <p className="text-sm text-gray-500">Gerencie seus agendamentos recebidos</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Filter pills */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <Filter size={14} className="text-gray-400 ml-2" />
                {(['all', 'pending', 'confirmed', 'canceled'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${statusFilter === f
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendentes' : f === 'confirmed' ? 'Confirmados' : 'Cancelados'}
                  </button>
                ))}
              </div>
              <button
                onClick={fetchAppointments}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="Atualizar"
              >
                <RefreshCw size={16} className={loadingAppts ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Content */}
          {loadingAppts ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-indigo-500" />
            </div>
          ) : apptError ? (
            <div className="text-center py-16">
              <p className="text-red-500 text-sm mb-3">{apptError}</p>
              <button
                onClick={fetchAppointments}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Tentar novamente
              </button>
            </div>
          ) : filteredAppointments.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CalendarCheck size={28} className="text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                Nenhum agendamento encontrado
              </h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                Quando seus alunos agendarem pela sua página pública,
                os agendamentos aparecerão aqui.
              </p>
            </div>
          ) : (
            /* Appointments List */
            <div className="divide-y divide-gray-50">
              {filteredAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="px-5 sm:px-6 py-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Left: Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">
                          {apt.client_name || 'Aluno'}
                        </span>
                        <StatusBadge status={apt.status} />
                      </div>

                      <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500">
                        {apt.client_email && (
                          <span className="inline-flex items-center gap-1">
                            <Mail size={13} className="text-gray-400" />
                            {apt.client_email}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <CalendarCheck size={13} className="text-indigo-400" />
                          {formatShortDate(apt.start_time)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock size={13} className="text-teal-400" />
                          {formatTimeRange(apt.start_time, apt.end_time)}
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    {(apt.status === 'pending' || apt.status === 'pending_payment') && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleStatusChange(apt.id, 'confirmed')}
                          disabled={actionLoading === apt.id}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === apt.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <CalendarCheck size={14} />
                          )}
                          Confirmar
                        </button>
                        <button
                          onClick={() => handleStatusChange(apt.id, 'canceled')}
                          disabled={actionLoading === apt.id}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === apt.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <CalendarX size={14} />
                          )}
                          Cancelar
                        </button>
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="text-xs text-gray-400 shrink-0 hidden lg:block">
                      Criado em {formatDateTime(apt.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
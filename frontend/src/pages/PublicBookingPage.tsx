/**
 * PublicBookingPage — Vitrine pública do professor.
 *
 * Rota: /book/:professional_id
 * Sem autenticação — qualquer pessoa pode acessar.
 *
 * Exibe os serviços ativos do professor e permite
 * que o aluno solicite um agendamento via BookingModal.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Service } from '../types/services';
import { fetchPublicServices } from '../services/publicApi';
import BookingModal from '../components/BookingModal';
import { Clock, DollarSign, Loader2, CalendarCheck, Sparkles } from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────
const formatPrice = (price: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
};

// ─── Componente Principal ───────────────────────────────────
const PublicBookingPage: React.FC = () => {
  const { professional_id } = useParams<{ professional_id: string }>();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // ── Carregar serviços ──────────────────────────────────────
  const loadServices = useCallback(async () => {
    if (!professional_id) return;
    try {
      setLoading(true);
      setError('');
      const data = await fetchPublicServices(professional_id);
      setServices(data);
    } catch {
      setError('Profissional não encontrado ou sem serviços disponíveis.');
    } finally {
      setLoading(false);
    }
  }, [professional_id]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);



  // ── Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 animate-pulse" />
            <Loader2 size={24} className="absolute inset-0 m-auto text-white animate-spin" />
          </div>
          <p className="text-gray-400 text-sm font-medium">Carregando serviços...</p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-red-50/30 px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">😕</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Oops! Algo deu errado
          </h2>
          <p className="text-gray-500 leading-relaxed mb-6">{error}</p>
          <button
            onClick={loadServices}
            className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // ── Main ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      {/* ── Hero Header ────────────────────────────────────── */}
      <header className="relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 25% 50%, white 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />

        <div className="relative max-w-3xl mx-auto px-4 py-10 sm:py-14 text-center">
          {/* Branding */}
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white/90 text-sm font-medium px-4 py-2 rounded-full mb-6">
            <Sparkles size={14} />
            AgendaPro
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Agende seu horário
          </h1>
          <p className="text-white/70 mt-3 text-base sm:text-lg max-w-md mx-auto">
            Escolha um serviço abaixo e selecione o melhor horário para você
          </p>

          {/* Stats pill */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/80 text-sm px-4 py-2 rounded-full mt-6">
            <CalendarCheck size={15} />
            {services.length} serviço{services.length !== 1 ? 's' : ''} disponíve{services.length !== 1 ? 'is' : 'l'}
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path
              d="M0 60V20C240 50 480 0 720 20C960 40 1200 10 1440 30V60H0Z"
              className="fill-slate-50"
            />
          </svg>
        </div>
      </header>

      {/* ── Services Grid ──────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12 -mt-2">
        {services.length === 0 ? (
          /* Empty */
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">📋</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Nenhum serviço disponível
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Este profissional ainda não publicou seus serviços.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {services.map((service, index) => (
              <div
                key={service.id}
                className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-emerald-200/60 transition-all duration-300"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="p-6 sm:p-7">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    {/* Left: info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                        {service.name}
                      </h3>

                      {service.description && (
                        <p className="text-sm text-gray-500 mt-2 leading-relaxed line-clamp-2">
                          {service.description}
                        </p>
                      )}

                      {/* Meta chips */}
                      <div className="flex items-center gap-3 mt-4">
                        <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                          <Clock size={14} className="text-teal-500" />
                          {formatDuration(service.duration_minutes)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
                          <DollarSign size={14} className="text-emerald-500" />
                          {formatPrice(service.price)}
                        </span>
                      </div>
                    </div>

                    {/* Right: CTA */}
                    <div className="sm:ml-6 shrink-0">
                      <button
                        onClick={() => setSelectedService(service)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3.5 rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 focus:ring-4 focus:ring-teal-200 transition-all shadow-lg shadow-emerald-200/40 group-hover:shadow-emerald-300/50 text-sm"
                      >
                        <CalendarCheck size={18} />
                        Selecionar Horário
                      </button>
                    </div>
                  </div>
                </div>

                {/* Hover accent line */}
                <div className="h-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 pb-6">
          <p className="text-xs text-gray-400">
            Powered by{' '}
            <span className="font-semibold text-emerald-600">AgendaPro</span>
          </p>
        </div>
      </main>

      {/* ── Booking Modal ──────────────────────────────────── */}
      {selectedService && professional_id && (
        <BookingModal
          service={selectedService}
          professionalId={professional_id}
          onClose={() => setSelectedService(null)}
        />
      )}
    </div>
  );
};

export default PublicBookingPage;
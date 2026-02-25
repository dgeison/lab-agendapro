/**
 * BookingModal — Formulário de agendamento conectado ao backend.
 *
 * Coleta: Nome, Email, Telefone, Data e Hora.
 * Converte para UTC antes de enviar ao backend.
 * Trata erros (409 = horário indisponível, etc).
 */
import React, { useState } from 'react';
import { X, Loader2, CalendarDays, User, Mail, Phone, Clock, Send } from 'lucide-react';
import { Service } from '../types/services';
import { createPublicBooking } from '../services/publicApi';

interface BookingModalProps {
    service: Service;
    professionalId: string;
    onClose: () => void;
}

const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}h` : `${h}h${m}min`;
};

/** Retorna a data de hoje no formato YYYY-MM-DD (local). */
const today = () => new Date().toISOString().split('T')[0];

/**
 * Converte data local (YYYY-MM-DD) + hora local (HH:MM) para
 * uma string ISO 8601 em UTC.
 */
function localToUTC(date: string, time: string): string {
    // Cria um Date no fuso horário do navegador
    const localDate = new Date(`${date}T${time}:00`);
    return localDate.toISOString(); // Retorna em UTC (com Z no final)
}

/**
 * Calcula o end_time somando a duração do serviço ao start_time.
 */
function computeEndTime(date: string, time: string, durationMinutes: number): string {
    const localDate = new Date(`${date}T${time}:00`);
    localDate.setMinutes(localDate.getMinutes() + durationMinutes);
    return localDate.toISOString();
}

const BookingModal: React.FC<BookingModalProps> = ({ service, professionalId, onClose }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !date || !time) return;

        setError('');
        setSubmitting(true);

        try {
            // Converter para UTC
            const startTimeUTC = localToUTC(date, time);
            const endTimeUTC = computeEndTime(date, time, service.duration_minutes);

            await createPublicBooking({
                professional_id: professionalId,
                service_id: service.id,
                student_name: name.trim(),
                student_email: email.trim(),
                student_phone: phone.trim() || undefined,
                start_time: startTimeUTC,
                end_time: endTimeUTC,
            });

            setSuccess(true);
        } catch (err: unknown) {
            // Tratar erros específicos do backend
            if (
                err &&
                typeof err === 'object' &&
                'response' in err
            ) {
                const axiosError = err as { response?: { status?: number; data?: { detail?: string } } };
                const status = axiosError.response?.status;
                const detail = axiosError.response?.data?.detail;

                if (status === 409) {
                    setError(detail || 'Horário indisponível. Por favor, escolha outro horário.');
                } else if (status === 422) {
                    setError('Dados inválidos. Verifique os campos e tente novamente.');
                } else {
                    setError(detail || 'Erro ao enviar solicitação. Tente novamente.');
                }
            } else {
                setError('Erro de conexão. Verifique sua internet e tente novamente.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel — slides up on mobile, centered on desktop */}
            <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                {/* Gradient bar */}
                <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

                <div className="p-6 sm:p-8">
                    {/* Close */}
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    {/* Service summary */}
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-900 pr-10">
                            Agendar: {service.name}
                        </h2>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="inline-flex items-center gap-1.5">
                                <Clock size={14} className="text-teal-500" />
                                {formatDuration(service.duration_minutes)}
                            </span>
                            <span className="font-semibold text-emerald-600">
                                {formatPrice(service.price)}
                            </span>
                        </div>
                    </div>

                    {/* Success state */}
                    {success ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">🎉</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                Agendamento Solicitado!
                            </h3>
                            <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">
                                Seu agendamento foi registrado com sucesso.
                                O profissional entrará em contato para confirmação.
                            </p>
                            <button
                                onClick={onClose}
                                className="mt-6 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    ) : (
                        /* Booking form */
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">
                                    ⚠️ {error}
                                </div>
                            )}

                            {/* Name */}
                            <div>
                                <label htmlFor="bk-name" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Seu Nome <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        id="bk-name"
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-gray-900"
                                        placeholder="Como você se chama?"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="bk-email" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Seu Email <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        id="bk-email"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-gray-900"
                                        placeholder="seu@email.com"
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div>
                                <label htmlFor="bk-phone" className="block text-sm font-semibold text-gray-700 mb-2">
                                    WhatsApp / Telefone
                                </label>
                                <div className="relative">
                                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        id="bk-phone"
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-gray-900"
                                        placeholder="(11) 99999-9999"
                                    />
                                </div>
                            </div>

                            {/* Date & Time — side by side */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="bk-date" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Data <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <CalendarDays size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            id="bk-date"
                                            type="date"
                                            required
                                            min={today()}
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="w-full pl-11 pr-3 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-gray-900"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="bk-time" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Horário <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            id="bk-time"
                                            type="time"
                                            required
                                            value={time}
                                            onChange={(e) => setTime(e.target.value)}
                                            className="w-full pl-11 pr-3 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-gray-900"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3.5 rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 focus:ring-4 focus:ring-teal-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200/50"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Solicitar Agendamento
                                    </>
                                )}
                            </button>

                            <p className="text-center text-xs text-gray-400 leading-relaxed">
                                Ao solicitar, o profissional receberá seus dados
                                e confirmará o agendamento.
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingModal;

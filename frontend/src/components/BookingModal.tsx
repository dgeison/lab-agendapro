/**
 * BookingModal — Wizard de 3 etapas para agendamento público.
 *
 * Etapa 1: Escolher Data (input date, min=hoje)
 * Etapa 2: Escolher Horário (pills de slots do motor de disponibilidade)
 * Etapa 3: Dados do Aluno (nome, email, telefone) + submit
 *
 * Usa start/end do slot retornado pelo backend (já em UTC).
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
    X, Loader2, CalendarDays, User, Mail, Phone, Clock,
    Send, ArrowLeft, Check, AlertTriangle,
} from 'lucide-react';
import { Service } from '../types/services';
import type { TimeSlot } from '../types/availability';
import { fetchPublicSlots, createPublicBooking } from '../services/publicApi';

// ── Types ────────────────────────────────────────────────────

interface BookingModalProps {
    service: Service;
    professionalId: string;
    onClose: () => void;
}

type WizardStep = 'date' | 'slot' | 'form';

// ── Helpers ──────────────────────────────────────────────────

const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}h` : `${h}h${m}min`;
};

/** Data de hoje no formato YYYY-MM-DD. */
const todayStr = () => new Date().toISOString().split('T')[0];

/** Formata ISO para HH:MM no fuso local. */
const formatTime = (iso: string) =>
    new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
    }).format(new Date(iso));

/** Formata data para exibição: "26/02/2026". */
const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
};

/** Nome do dia da semana. */
const dayOfWeekName = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { weekday: 'long' });
};

// ── Component ────────────────────────────────────────────────

const BookingModal: React.FC<BookingModalProps> = ({ service, professionalId, onClose }) => {
    // Wizard state
    const [step, setStep] = useState<WizardStep>('date');

    // Step 1: Date
    const [selectedDate, setSelectedDate] = useState('');

    // Step 2: Slots
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [slotsError, setSlotsError] = useState('');
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

    // Step 3: Form
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    // Submit
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [success, setSuccess] = useState(false);

    // ── Step 1 → Step 2: Fetch slots when date is selected ───
    const handleDateSelect = useCallback(async (date: string) => {
        setSelectedDate(date);
        setSelectedSlot(null);
        setSlots([]);
        setSlotsError('');
        setLoadingSlots(true);
        setStep('slot');

        try {
            const response = await fetchPublicSlots(professionalId, date, service.id);
            setSlots(response.slots);
        } catch {
            setSlotsError('Erro ao buscar horários. Tente novamente.');
        } finally {
            setLoadingSlots(false);
        }
    }, [professionalId, service.id]);

    // ── Step 2 → Step 3: Select a slot ──────────────────────
    const handleSlotSelect = (slot: TimeSlot) => {
        if (!slot.available) return;
        setSelectedSlot(slot);
        setStep('form');
    };

    // ── Back navigation ─────────────────────────────────────
    const goBack = () => {
        if (step === 'slot') {
            setStep('date');
            setSelectedDate('');
            setSlots([]);
        } else if (step === 'form') {
            setStep('slot');
            setSelectedSlot(null);
        }
    };

    // ── Submit booking ──────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSlot || !name.trim() || !email.trim()) return;

        setSubmitError('');
        setSubmitting(true);

        try {
            await createPublicBooking({
                professional_id: professionalId,
                service_id: service.id,
                student_name: name.trim(),
                student_email: email.trim(),
                student_phone: phone.trim() || undefined,
                start_time: selectedSlot.start,
                end_time: selectedSlot.end,
            });
            setSuccess(true);
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosError = err as { response?: { status?: number; data?: { detail?: string } } };
                const status = axiosError.response?.status;
                const detail = axiosError.response?.data?.detail;

                if (status === 409) {
                    setSubmitError(detail || 'Horário indisponível. Volte e escolha outro.');
                } else if (status === 422) {
                    setSubmitError('Dados inválidos. Verifique os campos.');
                } else {
                    setSubmitError(detail || 'Erro ao enviar. Tente novamente.');
                }
            } else {
                setSubmitError('Erro de conexão. Verifique sua internet.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // ── Progress bar ────────────────────────────────────────
    const stepIndex = step === 'date' ? 0 : step === 'slot' ? 1 : 2;
    const progressPercent = success ? 100 : ((stepIndex + 1) / 3) * 100;

    // Available slots count
    const availableCount = slots.filter((s) => s.available).length;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Panel */}
            <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                {/* Progress bar */}
                <div className="h-1.5 bg-gray-100">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-500 ease-out"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                <div className="p-6 sm:p-8">
                    {/* Header: Back + Close */}
                    <div className="flex items-center justify-between mb-4">
                        {step !== 'date' && !success ? (
                            <button
                                onClick={goBack}
                                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <ArrowLeft size={16} />
                                Voltar
                            </button>
                        ) : (
                            <div />
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Service summary + booking summary */}
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-900">
                            {service.name}
                        </h2>
                        <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500">
                            <span className="inline-flex items-center gap-1.5">
                                <Clock size={14} className="text-teal-500" />
                                {formatDuration(service.duration_minutes)}
                            </span>
                            <span className="font-semibold text-emerald-600">
                                {formatPrice(service.price)}
                            </span>
                        </div>

                        {/* Booking summary (shows when date/slot selected) */}
                        {selectedDate && (
                            <div className="mt-3 bg-indigo-50 rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm">
                                <CalendarDays size={14} className="text-indigo-500 shrink-0" />
                                <span className="text-indigo-800">
                                    <span className="capitalize">{dayOfWeekName(selectedDate)}</span>
                                    {', '}
                                    <strong>{formatDate(selectedDate)}</strong>
                                    {selectedSlot && (
                                        <>
                                            {' às '}
                                            <strong>{formatTime(selectedSlot.start)}</strong>
                                            {' – '}
                                            {formatTime(selectedSlot.end)}
                                        </>
                                    )}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Step indicators */}
                    {!success && (
                        <div className="flex items-center gap-2 mb-6">
                            {['Data', 'Horário', 'Dados'].map((label, i) => (
                                <div key={label} className="flex items-center gap-2 flex-1">
                                    <div
                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${i < stepIndex
                                                ? 'bg-emerald-100 text-emerald-600'
                                                : i === stepIndex
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-100 text-gray-400'
                                            }`}
                                    >
                                        {i < stepIndex ? <Check size={14} /> : i + 1}
                                    </div>
                                    <span
                                        className={`text-xs font-medium hidden sm:inline ${i === stepIndex ? 'text-indigo-600' : 'text-gray-400'
                                            }`}
                                    >
                                        {label}
                                    </span>
                                    {i < 2 && <div className="flex-1 h-px bg-gray-200" />}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════════
               SUCCESS STATE
             ══════════════════════════════════════════════════ */}
                    {success ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">🎉</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                Agendamento Solicitado!
                            </h3>
                            <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto mb-2">
                                Seu agendamento foi registrado com sucesso.
                                O profissional entrará em contato para confirmação.
                            </p>
                            {selectedSlot && (
                                <div className="bg-emerald-50 rounded-xl px-4 py-3 text-sm text-emerald-800 inline-flex items-center gap-2 mt-2">
                                    <CalendarDays size={14} />
                                    {formatDate(selectedDate)} às {formatTime(selectedSlot.start)}
                                </div>
                            )}
                            <div className="mt-6">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>

                        /* ══════════════════════════════════════════════════
                             STEP 1: CHOOSE DATE
                           ══════════════════════════════════════════════════ */
                    ) : step === 'date' ? (
                        <div>
                            <h3 className="text-base font-semibold text-gray-800 mb-3">
                                📅 Escolha a data
                            </h3>
                            <input
                                type="date"
                                min={todayStr()}
                                value={selectedDate}
                                onChange={(e) => {
                                    if (e.target.value) handleDateSelect(e.target.value);
                                }}
                                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-gray-900 text-base"
                            />
                            <p className="text-xs text-gray-400 mt-3 text-center">
                                Selecione uma data para ver os horários disponíveis
                            </p>
                        </div>

                        /* ══════════════════════════════════════════════════
                             STEP 2: CHOOSE SLOT
                           ══════════════════════════════════════════════════ */
                    ) : step === 'slot' ? (
                        <div>
                            <h3 className="text-base font-semibold text-gray-800 mb-3">
                                🕐 Escolha o horário
                            </h3>

                            {loadingSlots ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Loader2 size={28} className="animate-spin text-indigo-500 mb-3" />
                                    <p className="text-sm text-gray-500">Buscando horários disponíveis...</p>
                                </div>
                            ) : slotsError ? (
                                <div className="text-center py-8">
                                    <AlertTriangle size={24} className="text-red-400 mx-auto mb-3" />
                                    <p className="text-sm text-red-600 mb-3">{slotsError}</p>
                                    <button
                                        onClick={() => handleDateSelect(selectedDate)}
                                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                    >
                                        Tentar novamente
                                    </button>
                                </div>
                            ) : slots.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <CalendarDays size={22} className="text-gray-400" />
                                    </div>
                                    <p className="text-sm text-gray-600 font-medium mb-1">
                                        Nenhum horário disponível
                                    </p>
                                    <p className="text-xs text-gray-400 mb-4">
                                        O profissional não atende neste dia. Tente outra data.
                                    </p>
                                    <button
                                        onClick={goBack}
                                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                    >
                                        ← Escolher outra data
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <p className="text-xs text-gray-400 mb-3">
                                        {availableCount} {availableCount === 1 ? 'horário disponível' : 'horários disponíveis'}
                                    </p>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[45vh] overflow-y-auto pr-1">
                                        {slots.map((slot) => (
                                            <button
                                                key={slot.start}
                                                onClick={() => handleSlotSelect(slot)}
                                                disabled={!slot.available}
                                                className={`px-3 py-3 rounded-xl text-sm font-semibold transition-all ${slot.available
                                                        ? selectedSlot?.start === slot.start
                                                            ? 'bg-indigo-600 text-white ring-2 ring-indigo-300 shadow-md'
                                                            : 'bg-white border border-gray-200 text-gray-800 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700'
                                                        : 'bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed line-through'
                                                    }`}
                                            >
                                                {formatTime(slot.start)}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        /* ══════════════════════════════════════════════════
                             STEP 3: STUDENT DATA + SUBMIT
                           ══════════════════════════════════════════════════ */
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <h3 className="text-base font-semibold text-gray-800 mb-1">
                                📝 Seus dados
                            </h3>

                            {submitError && (
                                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">
                                    ⚠️ {submitError}
                                </div>
                            )}

                            {/* Name */}
                            <div>
                                <label htmlFor="bk-name" className="block text-sm font-semibold text-gray-700 mb-1.5">
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
                                <label htmlFor="bk-email" className="block text-sm font-semibold text-gray-700 mb-1.5">
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
                                <label htmlFor="bk-phone" className="block text-sm font-semibold text-gray-700 mb-1.5">
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
                                        Confirmar Agendamento
                                    </>
                                )}
                            </button>

                            <p className="text-center text-xs text-gray-400 leading-relaxed">
                                Ao confirmar, o profissional receberá seus dados
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

/**
 * AvailabilitiesPage — Configuração de Expediente do Professor.
 *
 * Permite configurar blocos de horário por dia da semana (Seg-Dom).
 * Suporta múltiplos blocos por dia (ex: manhã + tarde).
 * Salva em lote via PUT /availabilities/bulk.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Plus, Trash2, Save, Loader2, Clock, Check, AlertTriangle,
} from 'lucide-react';
import { listAvailabilities, bulkReplaceAvailabilities } from '../services/availabilitiesApi';
import type { AvailabilityCreate } from '../types/availability';

// ── Constants ────────────────────────────────────────────────

const DIAS_SEMANA = [
    { value: 0, label: 'Domingo', short: 'Dom' },
    { value: 1, label: 'Segunda-feira', short: 'Seg' },
    { value: 2, label: 'Terça-feira', short: 'Ter' },
    { value: 3, label: 'Quarta-feira', short: 'Qua' },
    { value: 4, label: 'Quinta-feira', short: 'Qui' },
    { value: 5, label: 'Sexta-feira', short: 'Sex' },
    { value: 6, label: 'Sábado', short: 'Sáb' },
];

/** Bloco local (UI state). */
interface LocalBlock {
    id: string; // local-only ID for React key
    start_time: string;
    end_time: string;
}

/** Estado de um dia. */
interface DayState {
    enabled: boolean;
    blocks: LocalBlock[];
}

/** Gera um ID único local. */
const localId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/** Bloco padrão para um novo dia ativado. */
const defaultBlock = (): LocalBlock => ({
    id: localId(),
    start_time: '08:00',
    end_time: '18:00',
});

// ── Component ────────────────────────────────────────────────

const AvailabilitiesPage: React.FC = () => {
    const navigate = useNavigate();

    // State: 7 dias (0=dom .. 6=sáb)
    const [days, setDays] = useState<Record<number, DayState>>(() => {
        const init: Record<number, DayState> = {};
        for (let i = 0; i <= 6; i++) {
            init[i] = { enabled: false, blocks: [] };
        }
        return init;
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    // ── Fetch existing data ────────────────────────────────────
    const fetchAvailabilities = useCallback(async () => {
        try {
            setLoading(true);
            const data = await listAvailabilities();

            // Build state from backend data
            const newDays: Record<number, DayState> = {};
            for (let i = 0; i <= 6; i++) {
                newDays[i] = { enabled: false, blocks: [] };
            }

            for (const a of data) {
                const d = a.day_of_week;
                newDays[d].enabled = true;
                newDays[d].blocks.push({
                    id: a.id,
                    start_time: a.start_time.slice(0, 5), // "08:00:00" → "08:00"
                    end_time: a.end_time.slice(0, 5),
                });
            }

            setDays(newDays);
        } catch {
            // Keep default empty state
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAvailabilities();
    }, [fetchAvailabilities]);

    // ── Day toggles ────────────────────────────────────────────
    const toggleDay = (dayIdx: number) => {
        setDays((prev) => {
            const day = prev[dayIdx];
            return {
                ...prev,
                [dayIdx]: {
                    enabled: !day.enabled,
                    blocks: !day.enabled && day.blocks.length === 0 ? [defaultBlock()] : day.blocks,
                },
            };
        });
        setSaveSuccess(false);
    };

    // ── Block CRUD ─────────────────────────────────────────────
    const addBlock = (dayIdx: number) => {
        setDays((prev) => ({
            ...prev,
            [dayIdx]: {
                ...prev[dayIdx],
                blocks: [...prev[dayIdx].blocks, { id: localId(), start_time: '13:00', end_time: '18:00' }],
            },
        }));
        setSaveSuccess(false);
    };

    const removeBlock = (dayIdx: number, blockId: string) => {
        setDays((prev) => ({
            ...prev,
            [dayIdx]: {
                ...prev[dayIdx],
                blocks: prev[dayIdx].blocks.filter((b) => b.id !== blockId),
            },
        }));
        setSaveSuccess(false);
    };

    const updateBlock = (dayIdx: number, blockId: string, field: 'start_time' | 'end_time', value: string) => {
        setDays((prev) => ({
            ...prev,
            [dayIdx]: {
                ...prev[dayIdx],
                blocks: prev[dayIdx].blocks.map((b) =>
                    b.id === blockId ? { ...b, [field]: value } : b,
                ),
            },
        }));
        setSaveSuccess(false);
    };

    // ── Validation ─────────────────────────────────────────────
    const validate = (): boolean => {
        const errors: string[] = [];

        for (let i = 0; i <= 6; i++) {
            const day = days[i];
            if (!day.enabled) continue;

            for (const block of day.blocks) {
                if (block.start_time >= block.end_time) {
                    errors.push(
                        `${DIAS_SEMANA[i].label}: Horário de início (${block.start_time}) deve ser antes do fim (${block.end_time}).`,
                    );
                }
            }

            // Check overlaps within same day
            const sorted = [...day.blocks].sort((a, b) => a.start_time.localeCompare(b.start_time));
            for (let j = 1; j < sorted.length; j++) {
                if (sorted[j].start_time < sorted[j - 1].end_time) {
                    errors.push(
                        `${DIAS_SEMANA[i].label}: Blocos se sobrepõem (${sorted[j - 1].start_time}-${sorted[j - 1].end_time} e ${sorted[j].start_time}-${sorted[j].end_time}).`,
                    );
                }
            }
        }

        setValidationErrors(errors);
        return errors.length === 0;
    };

    // ── Save ───────────────────────────────────────────────────
    const handleSave = async () => {
        if (!validate()) return;

        const blocks: AvailabilityCreate[] = [];
        for (let i = 0; i <= 6; i++) {
            if (!days[i].enabled) continue;
            for (const b of days[i].blocks) {
                blocks.push({
                    day_of_week: i,
                    start_time: b.start_time,
                    end_time: b.end_time,
                });
            }
        }

        try {
            setSaving(true);
            setSaveError('');
            setSaveSuccess(false);
            await bulkReplaceAvailabilities({ blocks });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 4000);
        } catch {
            setSaveError('Erro ao salvar expediente. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    // ── Render ─────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-indigo-500" />
            </div>
        );
    }

    const enabledDaysCount = Object.values(days).filter((d) => d.enabled).length;
    const totalBlocks = Object.values(days).reduce((sum, d) => sum + (d.enabled ? d.blocks.length : 0), 0);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">Meu Expediente</h1>
                            <p className="text-sm text-gray-500">Configure os dias e horários em que você atende</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm shadow-indigo-200"
                    >
                        {saving ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : saveSuccess ? (
                            <Check size={16} />
                        ) : (
                            <Save size={16} />
                        )}
                        {saving ? 'Salvando...' : saveSuccess ? 'Salvo!' : 'Salvar Expediente'}
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
                {/* Success Toast */}
                {saveSuccess && (
                    <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 animate-in fade-in duration-300">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                            <Check size={16} className="text-emerald-600" />
                        </div>
                        <p className="text-sm font-medium text-emerald-800">
                            Expediente salvo com sucesso! Seus alunos verão os novos horários na página de agendamento.
                        </p>
                    </div>
                )}

                {/* Error */}
                {saveError && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                        <AlertTriangle size={16} className="text-red-500 shrink-0" />
                        <p className="text-sm text-red-700">{saveError}</p>
                    </div>
                )}

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle size={16} className="text-amber-600" />
                            <p className="text-sm font-semibold text-amber-800">Corrija os problemas abaixo:</p>
                        </div>
                        <ul className="list-disc list-inside space-y-1">
                            {validationErrors.map((err, i) => (
                                <li key={i} className="text-sm text-amber-700">{err}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Summary */}
                <div className="mb-6 bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <Clock size={20} className="text-indigo-500" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">
                            <strong className="text-gray-900">{enabledDaysCount}</strong> {enabledDaysCount === 1 ? 'dia' : 'dias'} ativos
                            {' · '}
                            <strong className="text-gray-900">{totalBlocks}</strong> {totalBlocks === 1 ? 'bloco' : 'blocos'} de horário
                        </p>
                    </div>
                </div>

                {/* Days List */}
                <div className="space-y-3">
                    {DIAS_SEMANA.map((dia) => {
                        const dayState = days[dia.value];

                        return (
                            <div
                                key={dia.value}
                                className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${dayState.enabled ? 'border-indigo-200' : 'border-gray-100'
                                    }`}
                            >
                                {/* Day Header */}
                                <div className="flex items-center justify-between px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        {/* Toggle Switch */}
                                        <button
                                            onClick={() => toggleDay(dia.value)}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${dayState.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                                                }`}
                                            role="switch"
                                            aria-checked={dayState.enabled}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${dayState.enabled ? 'translate-x-5' : 'translate-x-0'
                                                    }`}
                                            />
                                        </button>
                                        <div>
                                            <p className={`font-semibold text-sm ${dayState.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                                                {dia.label}
                                            </p>
                                            {dayState.enabled && dayState.blocks.length > 0 && (
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {dayState.blocks.map((b) => `${b.start_time}–${b.end_time}`).join(' · ')}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {dayState.enabled && (
                                        <button
                                            onClick={() => addBlock(dia.value)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                                        >
                                            <Plus size={14} />
                                            Horário
                                        </button>
                                    )}
                                </div>

                                {/* Blocks */}
                                {dayState.enabled && dayState.blocks.length > 0 && (
                                    <div className="border-t border-gray-50 px-5 py-3 space-y-2 bg-gray-50/50">
                                        {dayState.blocks.map((block, idx) => (
                                            <div
                                                key={block.id}
                                                className="flex items-center gap-3 bg-white rounded-lg border border-gray-100 px-4 py-3"
                                            >
                                                <span className="text-xs text-gray-400 font-medium w-6 text-center">{idx + 1}</span>
                                                <div className="flex items-center gap-2 flex-1">
                                                    <input
                                                        type="time"
                                                        value={block.start_time}
                                                        onChange={(e) => updateBlock(dia.value, block.id, 'start_time', e.target.value)}
                                                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-[7.5rem]"
                                                    />
                                                    <span className="text-gray-400 text-sm font-medium">às</span>
                                                    <input
                                                        type="time"
                                                        value={block.end_time}
                                                        onChange={(e) => updateBlock(dia.value, block.id, 'end_time', e.target.value)}
                                                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-[7.5rem]"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => removeBlock(dia.value, block.id)}
                                                    className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                    title="Remover bloco"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Empty enabled day */}
                                {dayState.enabled && dayState.blocks.length === 0 && (
                                    <div className="border-t border-gray-50 px-5 py-4 bg-gray-50/50">
                                        <button
                                            onClick={() => addBlock(dia.value)}
                                            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
                                        >
                                            <Plus size={16} />
                                            Adicionar horário
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Bottom Save Button (mobile-friendly) */}
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm shadow-indigo-200"
                    >
                        {saving ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : saveSuccess ? (
                            <Check size={16} />
                        ) : (
                            <Save size={16} />
                        )}
                        {saving ? 'Salvando...' : saveSuccess ? 'Salvo!' : 'Salvar Expediente'}
                    </button>
                </div>
            </main>
        </div>
    );
};

export default AvailabilitiesPage;

/**
 * StudentsPage — Mini-CRM de Alunos do Professor.
 *
 * Features:
 *   - Busca local por nome
 *   - Cards com Nome, Email, Telefone, Notas
 *   - Modal de Criar/Editar aluno
 *   - Excluir com confirmação
 *   - Loading, empty state, contadores
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Plus, Search, Pencil, Trash2, X, Loader2,
    User, Mail, Phone, StickyNote, Users, Save, AlertTriangle,
} from 'lucide-react';
import { studentsService, Student, CreateStudentData } from '../services/studentsService';

// ── Component ────────────────────────────────────────────────

const StudentsPage: React.FC = () => {
    const navigate = useNavigate();

    // Data
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Search
    const [searchQuery, setSearchQuery] = useState('');

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [formData, setFormData] = useState<CreateStudentData>({
        full_name: '',
        email: '',
        phone: '',
        notes: '',
    });
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');

    // Delete confirmation
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // ── Fetch ────────────────────────────────────────────────
    const fetchStudents = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const data = await studentsService.getAll();
            setStudents(data);
        } catch {
            setError('Erro ao carregar alunos.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    // ── Filtered list ────────────────────────────────────────
    const filtered = searchQuery.trim()
        ? students.filter((s) =>
            s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        : students;

    // ── Modal handlers ───────────────────────────────────────
    const openCreateModal = () => {
        setEditingStudent(null);
        setFormData({ full_name: '', email: '', phone: '', notes: '' });
        setSubmitError('');
        setShowModal(true);
    };

    const openEditModal = (student: Student) => {
        setEditingStudent(student);
        setFormData({
            full_name: student.full_name,
            email: student.email || '',
            phone: student.phone || '',
            notes: student.notes || '',
        });
        setSubmitError('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingStudent(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.full_name.trim()) return;

        setSubmitLoading(true);
        setSubmitError('');

        try {
            if (editingStudent) {
                await studentsService.update(editingStudent.id, formData);
            } else {
                await studentsService.create(formData);
            }
            closeModal();
            fetchStudents();
        } catch {
            setSubmitError(editingStudent ? 'Erro ao atualizar aluno.' : 'Erro ao criar aluno.');
        } finally {
            setSubmitLoading(false);
        }
    };

    // ── Delete ───────────────────────────────────────────────
    const handleDelete = async (id: string) => {
        setDeleteLoading(true);
        try {
            await studentsService.delete(id);
            setDeletingId(null);
            setStudents((prev) => prev.filter((s) => s.id !== id));
        } catch {
            // silently fail
        } finally {
            setDeleteLoading(false);
        }
    };

    // ── Render ───────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">Alunos</h1>
                            <p className="text-sm text-gray-500">
                                {students.length} {students.length === 1 ? 'aluno' : 'alunos'} cadastrados
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
                    >
                        <Plus size={16} />
                        Novo Aluno
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
                {/* Search */}
                <div className="mb-6">
                    <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-900 text-sm"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-300 hover:text-gray-500"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    {searchQuery && (
                        <p className="text-xs text-gray-400 mt-2 ml-1">
                            {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'} para "{searchQuery}"
                        </p>
                    )}
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={28} className="animate-spin text-indigo-500" />
                    </div>
                ) : error ? (
                    <div className="text-center py-16">
                        <AlertTriangle size={24} className="text-red-400 mx-auto mb-3" />
                        <p className="text-red-500 text-sm mb-3">{error}</p>
                        <button onClick={fetchStudents} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                            Tentar novamente
                        </button>
                    </div>

                    /* Empty state */
                ) : students.length === 0 ? (
                    <div className="text-center py-16 px-4">
                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Users size={28} className="text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Nenhum aluno cadastrado</h3>
                        <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                            Adicione seus alunos manualmente ou eles serão criados automaticamente ao fazer agendamentos pela sua página pública.
                        </p>
                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                        >
                            <Plus size={16} />
                            Cadastrar Primeiro Aluno
                        </button>
                    </div>

                    /* No results for search */
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <Search size={24} className="text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">Nenhum aluno encontrado para "{searchQuery}"</p>
                    </div>

                    /* Student cards */
                ) : (
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((student) => (
                            <div
                                key={student.id}
                                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all p-5"
                            >
                                {/* Top: Avatar + Name */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                            {student.full_name[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-gray-900 truncate">{student.full_name}</h3>
                                            <p className="text-xs text-gray-400">
                                                Desde {new Date(student.created_at).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Actions */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => openEditModal(student)}
                                            className="p-2 rounded-lg text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                            title="Editar"
                                        >
                                            <Pencil size={15} />
                                        </button>
                                        <button
                                            onClick={() => setDeletingId(student.id)}
                                            className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>

                                {/* Contact info */}
                                <div className="space-y-1.5 text-sm text-gray-600">
                                    {student.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail size={13} className="text-gray-400 shrink-0" />
                                            <span className="truncate">{student.email}</span>
                                        </div>
                                    )}
                                    {student.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone size={13} className="text-gray-400 shrink-0" />
                                            <span>{student.phone}</span>
                                        </div>
                                    )}
                                    {student.notes && (
                                        <div className="flex items-start gap-2 mt-2">
                                            <StickyNote size={13} className="text-gray-400 shrink-0 mt-0.5" />
                                            <p className="text-xs text-gray-500 line-clamp-2">{student.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* ══════════════════════════════════════════════════════
           DELETE CONFIRMATION MODAL
         ══════════════════════════════════════════════════════ */}
            {deletingId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeletingId(null)} />
                    <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={20} className="text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Aluno?</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Essa ação não pode ser desfeita. O aluno será removido permanentemente.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeletingId(null)}
                                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleDelete(deletingId)}
                                    disabled={deleteLoading}
                                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                                >
                                    {deleteLoading ? (
                                        <Loader2 size={16} className="animate-spin mx-auto" />
                                    ) : (
                                        'Excluir'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════
           CREATE / EDIT MODAL
         ══════════════════════════════════════════════════════ */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
                    <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                        {/* Gradient bar */}
                        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />

                        <div className="p-6 sm:p-8">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                                        <User size={20} className="text-indigo-500" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">
                                        {editingStudent ? 'Editar Aluno' : 'Novo Aluno'}
                                    </h3>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {submitError && (
                                <div className="mb-4 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">
                                    ⚠️ {submitError}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label htmlFor="st-name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Nome Completo <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            id="st-name"
                                            type="text"
                                            name="full_name"
                                            required
                                            value={formData.full_name}
                                            onChange={handleInputChange}
                                            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-900"
                                            placeholder="Ana Souza"
                                        />
                                    </div>
                                </div>

                                {/* Email + Phone */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="st-email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            Email
                                        </label>
                                        <div className="relative">
                                            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                id="st-email"
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-900"
                                                placeholder="ana@email.com"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="st-phone" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            Telefone
                                        </label>
                                        <div className="relative">
                                            <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                id="st-phone"
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-900"
                                                placeholder="(11) 99999-9999"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label htmlFor="st-notes" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Observações
                                    </label>
                                    <div className="relative">
                                        <StickyNote size={16} className="absolute left-4 top-4 text-gray-400" />
                                        <textarea
                                            id="st-notes"
                                            name="notes"
                                            rows={3}
                                            value={formData.notes}
                                            onChange={handleInputChange}
                                            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-gray-900 resize-none"
                                            placeholder="Nível intermediário, prefere aulas à noite..."
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 px-4 py-3 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitLoading}
                                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm shadow-indigo-200"
                                    >
                                        {submitLoading ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Save size={16} />
                                        )}
                                        {submitLoading ? 'Salvando...' : editingStudent ? 'Atualizar' : 'Salvar'}
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

export default StudentsPage;

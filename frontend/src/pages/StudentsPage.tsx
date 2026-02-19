import React, { useState, useEffect } from 'react';
import { DashboardLayout } from './DashboardPage';
import { studentsService, Student, CreateStudentData } from '../services/studentsService';

const StudentsPage: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState<CreateStudentData>({
        full_name: '',
        email: '',
        phone: '',
        notes: '',
    });
    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const data = await studentsService.getAll();
            setStudents(data);
        } catch (error) {
            console.error('Erro ao buscar alunos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            await studentsService.create(formData);
            setShowModal(false);
            setFormData({ full_name: '', email: '', phone: '', notes: '' });
            fetchStudents();
        } catch (error) {
            console.error('Erro ao criar aluno:', error);
            alert('Erro ao criar aluno. Verifique os dados.');
        } finally {
            setSubmitLoading(false);
        }
    };

    return (
        <DashboardLayout title="Alunos">
            {/* Header Actions */}
            <div className="flex justify-between items-center mb-6">
                <p className="text-slate-400">Gerencie seus alunos e seus dados de contato.</p>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Novo Aluno
                </button>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
                </div>
            ) : students.length === 0 ? (
                /* Empty State */
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Nenhum aluno cadastrado</h3>
                    <p className="text-slate-400 mb-6">Comece adicionando seu primeiro aluno.</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        Cadastrar Aluno
                    </button>
                </div>
            ) : (
                /* List */
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {students.map((student) => (
                        <div key={student.id} className="glass-card hover:bg-white/10 transition-colors group relative">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20">
                                        {student.full_name[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">{student.full_name}</h3>
                                        <p className="text-xs text-slate-400">Desde {new Date(student.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                {/* Actions Menu (placeholder) */}
                                <button className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/10">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-2 text-sm text-slate-300">
                                {student.email && (
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {student.email}
                                    </div>
                                )}
                                {student.phone && (
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        {student.phone}
                                    </div>
                                )}
                            </div>

                            {/* Botão Aulas (futuro) */}
                            <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
                                <button className="flex-1 py-1.5 px-3 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-indigo-300 transition-colors">
                                    Ver Histórico
                                </button>
                                <button className="flex-1 py-1.5 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 rounded-lg text-xs font-medium text-indigo-400 transition-colors">
                                    Nova Aula
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="glass-card w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Novo Aluno</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="label">Nome Completo</label>
                                <input
                                    type="text"
                                    name="full_name"
                                    required
                                    className="input-field"
                                    placeholder="Ex: Ana Souza"
                                    value={formData.full_name}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="input-field"
                                        placeholder="ana@email.com"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div>
                                    <label className="label">Telefone</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        className="input-field"
                                        placeholder="(11) 99999-9999"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="label">Observações</label>
                                <textarea
                                    name="notes"
                                    className="input-field min-h-[100px]"
                                    placeholder="Ex: Nível intermediário, prefere aulas à noite..."
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="flex gap-3 mt-6 pt-4 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 btn-ghost justify-center"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitLoading}
                                    className="flex-1 btn-primary justify-center"
                                >
                                    {submitLoading ? 'Salvando...' : 'Salvar Aluno'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default StudentsPage;

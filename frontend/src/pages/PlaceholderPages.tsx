/**
 * PlaceholderPages — Páginas de "Em Breve" para funcionalidades futuras.
 */
import React from 'react';
import { Link } from 'react-router-dom';

interface ComingSoonPageProps {
    title: string;
    description: string;
    icon: React.ReactNode;
}

const ComingSoonPage: React.FC<ComingSoonPageProps> = ({ title, description, icon }) => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-20 h-20 bg-indigo-100 border border-indigo-200 rounded-3xl flex items-center justify-center mb-6 text-indigo-500">
                {icon}
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">{title}</h2>
            <p className="text-gray-500 max-w-sm mb-8">{description}</p>
            <Link to="/dashboard" className="text-indigo-600 font-medium hover:underline">
                ← Voltar ao início
            </Link>
        </div>
    </div>
);

const LessonsIcon = () => (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const PaymentsIcon = () => (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ReportsIcon = () => (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

export const AulasPage: React.FC = () => (
    <ComingSoonPage
        title="Aulas"
        description="Agende aulas, confirme presenças e sincronize automaticamente com seu Google Calendar."
        icon={<LessonsIcon />}
    />
);

export const PagamentosPage: React.FC = () => (
    <ComingSoonPage
        title="Pagamentos"
        description="Gere cobranças via PIX ou boleto e acompanhe o histórico de pagamentos por aluno."
        icon={<PaymentsIcon />}
    />
);

export const RelatoriosPage: React.FC = () => (
    <ComingSoonPage
        title="Relatórios"
        description="Relatórios mensais de aulas realizadas, valores recebidos e saldo devedor por aluno."
        icon={<ReportsIcon />}
    />
);

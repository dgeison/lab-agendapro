/**
 * Public API Client — Axios limpo, sem interceptores de autenticação.
 *
 * Usado exclusivamente para endpoints públicos (Public Booking Page),
 * onde o visitante NÃO está logado.
 */
import axios from 'axios';
import { Service } from '../types/services';
import type { SlotsResponse } from '../types/availability';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1`;

const publicApi = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// ── Tipos públicos ──────────────────────────────────────────

export interface PublicProfile {
    id: string;
    full_name?: string;
    avatar_url?: string;
    public_slug: string;
}

/** Payload enviado ao backend para criar um agendamento público. */
export interface PublicBookingRequest {
    professional_id: string;
    service_id: string;
    student_name: string;
    student_email: string;
    student_phone?: string;
    start_time: string; // ISO 8601 UTC
    end_time: string;   // ISO 8601 UTC
}

export interface PublicBookingResponse {
    id: string;
    professional_id: string;
    service_id: string;
    student_id: string;
    client_name: string;
    client_email: string;
    start_time: string;
    end_time: string;
    status: string;
    created_at: string;
    updated_at: string;
}

// ── Funções ─────────────────────────────────────────────────

/** Busca os serviços ATIVOS de um profissional (sem auth). */
export async function fetchPublicServices(professionalId: string): Promise<Service[]> {
    const response = await publicApi.get<Service[]>(`/services/public/${professionalId}`);
    return response.data;
}

/** Busca o perfil público do profissional pelo slug. */
export async function fetchPublicProfile(slug: string): Promise<PublicProfile> {
    const response = await publicApi.get<PublicProfile>(`/public/profile/${slug}`);
    return response.data;
}

/** Busca slots disponíveis para um dia (sem auth). */
export async function fetchPublicSlots(
    professionalId: string,
    date: string,
    serviceId: string,
): Promise<SlotsResponse> {
    const response = await publicApi.get<SlotsResponse>('/availabilities/public/slots', {
        params: {
            professional_id: professionalId,
            date,
            service_id: serviceId,
        },
    });
    return response.data;
}

/** Cria um agendamento público (sem auth). */
export async function createPublicBooking(data: PublicBookingRequest): Promise<PublicBookingResponse> {
    const response = await publicApi.post<PublicBookingResponse>('/appointments/public', data);
    return response.data;
}

export default publicApi;

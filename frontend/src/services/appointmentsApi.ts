/**
 * Appointments API Service — Funções protegidas (requerem JWT).
 *
 * Usa o interceptor autenticado do `api.ts` que injeta o token
 * do Supabase automaticamente.
 */
import api from './api';
import { Appointment, AppointmentStatus } from '../types/appointments';

/**
 * Lista todos os agendamentos do profissional autenticado.
 * Opcionalmente filtra por status.
 */
export async function listAppointments(statusFilter?: AppointmentStatus): Promise<Appointment[]> {
    const params = statusFilter ? { status: statusFilter } : {};
    const response = await api.get<Appointment[]>('/appointments/', { params });
    return response.data;
}

/**
 * Atualiza o status de um agendamento (confirmed | canceled).
 */
export async function updateAppointmentStatus(
    appointmentId: string,
    status: 'confirmed' | 'canceled',
): Promise<Appointment> {
    const response = await api.patch<Appointment>(
        `/appointments/${appointmentId}/status`,
        { status },
    );
    return response.data;
}

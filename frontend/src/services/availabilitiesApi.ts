/**
 * API Client para Disponibilidades (Availabilities).
 *
 * Todas as chamadas usam o `api` autenticado (JWT interceptor).
 */
import api from './api';
import type {
    Availability,
    AvailabilityBulkCreate,
    SlotsResponse,
} from '../types/availability';

/**
 * Lista os blocos de disponibilidade do professor logado.
 */
export async function listAvailabilities(): Promise<Availability[]> {
    const { data } = await api.get<Availability[]>('/availabilities/');
    return data;
}

/**
 * Substitui TODOS os blocos de disponibilidade de uma vez (bulk replace).
 */
export async function bulkReplaceAvailabilities(
    payload: AvailabilityBulkCreate,
): Promise<Availability[]> {
    const { data } = await api.put<Availability[]>('/availabilities/bulk', payload);
    return data;
}

/**
 * Busca slots disponíveis (rota pública, mas pode ser chamado autenticado).
 */
export async function getPublicSlots(
    professionalId: string,
    date: string,
    serviceId: string,
): Promise<SlotsResponse> {
    const { data } = await api.get<SlotsResponse>('/availabilities/public/slots', {
        params: {
            professional_id: professionalId,
            date,
            service_id: serviceId,
        },
    });
    return data;
}

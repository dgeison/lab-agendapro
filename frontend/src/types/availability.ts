/**
 * Types para o domínio de Disponibilidade (Availabilities).
 */

/** Bloco de disponibilidade retornado pelo backend. */
export interface Availability {
    id: string;
    user_id: string;
    day_of_week: number;  // 0=dom, 1=seg, ..., 6=sáb
    start_time: string;   // "08:00"
    end_time: string;     // "12:00"
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/** Payload para criar um bloco de disponibilidade. */
export interface AvailabilityCreate {
    day_of_week: number;
    start_time: string;
    end_time: string;
}

/** Payload em lote para substituir todos os blocos. */
export interface AvailabilityBulkCreate {
    blocks: AvailabilityCreate[];
}

/** Slot de horário gerado pelo motor de disponibilidade. */
export interface TimeSlot {
    start: string;     // ISO 8601 UTC
    end: string;       // ISO 8601 UTC
    available: boolean;
}

/** Resposta da rota pública de slots. */
export interface SlotsResponse {
    date: string;
    professional_id: string;
    service_duration_minutes: number;
    slots: TimeSlot[];
}

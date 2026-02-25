/**
 * Tipagens para o domínio de Agendamentos.
 *
 * Alinhado com o schema backend: AppointmentResponse.
 */

export type AppointmentStatus = 'pending' | 'pending_payment' | 'confirmed' | 'canceled' | 'cancelled' | 'completed';

export interface Appointment {
  id: string;
  professional_id: string;
  service_id: string;
  student_id?: string;
  client_name?: string;
  client_email?: string;
  start_time: string;   // ISO 8601 UTC
  end_time: string;     // ISO 8601 UTC
  status: AppointmentStatus;
  google_event_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AppointmentCreate {
  professional_id: string;
  service_id: string;
  student_name: string;
  student_email: string;
  student_phone?: string;
  start_time: string;
  end_time: string;
}

export interface PublicProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
  public_slug: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}
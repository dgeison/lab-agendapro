export interface AppointmentCreate {
  service_id: string;
  client_name: string;
  client_email: string;
  start_time: string; // ISO date string
  end_time: string;   // ISO date string
}

export interface Appointment {
  id: string;
  service_id: string;
  client_name: string;
  client_email: string;
  start_time: string;
  end_time: string;
  status: 'pending_payment' | 'confirmed' | 'cancelled' | 'completed';
  stripe_payment_intent_id?: string;
  created_at: string;
  updated_at: string;
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
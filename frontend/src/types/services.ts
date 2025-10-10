export interface Service {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceCreate {
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
}

export interface ServiceUpdate {
  name?: string;
  description?: string;
  duration_minutes?: number;
  price?: number;
}
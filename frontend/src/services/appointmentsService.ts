import axios from 'axios';
import { AppointmentCreate, Appointment, PublicProfile, TimeSlot } from '../types/appointments';
import { Service } from '../types/services';

// API sem autenticação para endpoints públicos
const publicApi = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const appointmentsService = {
  // Buscar perfil público do profissional
  async getPublicProfile(slug: string): Promise<PublicProfile> {
    const response = await publicApi.get<PublicProfile>(`/public/profile/${slug}`);
    return response.data;
  },

  // Buscar serviços públicos de um profissional
  async getPublicServices(slug: string): Promise<Service[]> {
    const response = await publicApi.get<Service[]>(`/services/public/${slug}`);
    return response.data;
  },

  // Buscar horários disponíveis para um serviço
  async getAvailableSlots(serviceId: string, date: string): Promise<TimeSlot[]> {
    const response = await publicApi.get<TimeSlot[]>(`/appointments/available-slots/${serviceId}/${date}`);
    return response.data;
  },

  // Criar agendamento
  async createAppointment(data: AppointmentCreate): Promise<Appointment> {
    const response = await publicApi.post<Appointment>('/appointments/', data);
    return response.data;
  },

  // Confirmar pagamento e agendamento
  async confirmPayment(appointmentId: string, paymentIntentId: string): Promise<Appointment> {
    const response = await publicApi.post<Appointment>(`/appointments/${appointmentId}/confirm-payment`, {
      payment_intent_id: paymentIntentId
    });
    return response.data;
  }
};
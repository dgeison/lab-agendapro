import api from './api';
import { Service, ServiceCreate, ServiceUpdate } from '../types/services';

export const servicesService = {
  async createService(data: ServiceCreate): Promise<Service> {
    const response = await api.post<Service>('/services/', data);
    return response.data;
  },

  async getMyServices(): Promise<Service[]> {
    const response = await api.get<Service[]>('/services/');
    return response.data;
  },

  async getService(serviceId: string): Promise<Service> {
    const response = await api.get<Service>(`/services/${serviceId}`);
    return response.data;
  },

  async updateService(serviceId: string, data: ServiceUpdate): Promise<Service> {
    const response = await api.put<Service>(`/services/${serviceId}`, data);
    return response.data;
  },

  async deleteService(serviceId: string): Promise<void> {
    await api.delete(`/services/${serviceId}`);
  },

  async getServicesBySlug(userSlug: string): Promise<Service[]> {
    const response = await api.get<Service[]>(`/services/public/${userSlug}`);
    return response.data;
  }
};
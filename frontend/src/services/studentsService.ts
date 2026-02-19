import api from './api';

export interface Student {
    id: string;
    user_id: string;
    full_name: string;
    email?: string;
    phone?: string;
    notes?: string;
    created_at: string;
}

export interface CreateStudentData {
    full_name: string;
    email?: string;
    phone?: string;
    notes?: string;
}

export interface UpdateStudentData {
    full_name?: string;
    email?: string;
    phone?: string;
    notes?: string;
}

export const studentsService = {
    async getAll(): Promise<Student[]> {
        const response = await api.get<Student[]>('/students/');
        return response.data;
    },

    async create(data: CreateStudentData): Promise<Student> {
        const response = await api.post<Student>('/students/', data);
        return response.data;
    },

    async update(id: string, data: UpdateStudentData): Promise<Student> {
        const response = await api.put<Student>(`/students/${id}`, data);
        return response.data;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/students/${id}`);
    }
};

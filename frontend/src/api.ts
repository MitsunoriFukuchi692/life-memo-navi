import axios from 'axios';
const API_BASE = import.meta.env.VITE_API_URL || '/api';
const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
export interface User { id: number; name: string; age: number; email: string; token: string; }
export interface Interview { id: number; user_id: number; question_id: number; question_text: string; answer_text: string; field_type: string; updated_at: string; }
export interface Timeline { id: number; user_id: number; year: number; month?: number; event_title: string; event_description?: string; }
export interface Photo { id: number; user_id: number; photo_url: string; caption?: string; uploaded_at: string; }
export const authApi = {
  register: (data: { name: string; age: number; email: string; password: string; project_type?: string }) =>
    api.post<User>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<User>('/auth/login', data),
};
export const interviewApi = {
  getAll: (userId: number, fieldType: string = 'jibunshi') =>
    api.get<Interview[]>(`/interviews/${userId}?field_type=${fieldType}`),
  save: (data: { user_id: number; question_id: number; answer_text: string; field_type: string }) =>
    api.post<Interview>('/interviews', data),
};
export const timelineApi = {
  getAll: (userId: number, fieldType: string = 'jibunshi') =>
    api.get<Timeline[]>(`/timelines/user/${userId}?field_type=${fieldType}`),
  create: (data: { user_id: number; year: number; month?: number; event_title: string; event_description?: string; field_type: string }) =>
    api.post<Timeline>('/timelines', data),
  update: (id: number, data: Partial<Timeline>) => api.put<Timeline>(`/timelines/${id}`, data),
  delete: (id: number) => api.delete(`/timelines/${id}`),
};
export const photoApi = {
  upload: (userId: number, file: File, caption?: string, fieldType: string = 'jibunshi') => {
    const form = new FormData();
    form.append('user_id', String(userId));
    form.append('photo', file);
    form.append('field_type', fieldType);
    if (caption) form.append('caption', caption);
    return api.post<Photo>('/photos/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getAll: (userId: number, fieldType: string = 'jibunshi') =>
    api.get<Photo[]>(`/photos/${userId}?field_type=${fieldType}`),
  delete: (id: number) => api.delete(`/photos/${id}`),
};
export const pdfApi = {
  generateUrl: (userId: number, fieldType: string = 'jibunshi') =>
    `${API_BASE}/pdf/generate/${userId}?field_type=${fieldType}`,
};
export default api;

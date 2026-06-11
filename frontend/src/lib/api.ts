const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export interface ServiceCategory {
  id: string;
  code: string;
  name: string;
  estimatedMinutes: number;
  isActive: boolean;
}

export interface Counter {
  id: string;
  code: string;
  displayName: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  status: string;
  serviceCategoryId: string;
  createdAt: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message ?? `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function login(role: 'admin' | 'staff', nip: string, password: string) {
  return request<{ accessToken: string; role: 'admin' | 'staff' }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ role, nip, password })
  });
}

export function getServices() {
  return request<ServiceCategory[]>('/services');
}

export function getCounters() {
  return request<Counter[]>('/counters');
}

export function createTicket(citizenNik: string, serviceCategoryId: string) {
  return request<Ticket>('/tickets', {
    method: 'POST',
    body: JSON.stringify({ citizenNik, serviceCategoryId })
  });
}

export function getNextTicket(counterId: string) {
  return request<Ticket | null>(`/tickets/next?counterId=${counterId}`);
}

export function callTicket(ticketId: string, counterId: string) {
  return request<Ticket>(`/tickets/${ticketId}/call`, {
    method: 'POST',
    body: JSON.stringify({ counterId })
  });
}

export function getSummary() {
  return request<{ totalTickets: number; waiting: number; called: number; completed: number; activeCounters: number }>('/reports/summary');
}

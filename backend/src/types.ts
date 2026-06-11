export type Role = 'admin' | 'staff';
export type TicketStatus = 'waiting' | 'called' | 'skipped' | 'completed' | 'canceled';

export interface User {
  id: string;
  nip: string;
  fullName: string;
  role: Role;
  isActive: boolean;
}

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
  isActive: boolean;
  serviceCategoryIds: string[];
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  serviceCategoryId: string;
  citizenNik: string;
  status: TicketStatus;
  assignedCounterId?: string;
  createdAt: string;
  calledAt?: string;
  completedAt?: string;
}

export interface QueueEvent {
  id: string;
  ticketId: string;
  eventType: 'created' | 'called' | 'recalled' | 'skipped' | 'completed' | 'canceled';
  actorUserId?: string;
  actorCounterId?: string;
  createdAt: string;
}

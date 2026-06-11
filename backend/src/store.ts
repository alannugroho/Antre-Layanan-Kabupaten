import { randomUUID } from 'node:crypto';
import type { Counter, QueueEvent, ServiceCategory, Ticket, TicketStatus, User } from './types';

const users: User[] = [
  { id: randomUUID(), nip: '199002152015032005', fullName: 'Siti Aminah', role: 'admin', isActive: true },
  { id: randomUUID(), nip: '198501012010011001', fullName: 'Budi Santoso', role: 'staff', isActive: true }
];

const services: ServiceCategory[] = [
  { id: randomUUID(), code: 'A', name: 'Pembuatan e-KTP', estimatedMinutes: 15, isActive: true },
  { id: randomUUID(), code: 'B', name: 'Kartu Keluarga', estimatedMinutes: 20, isActive: true },
  { id: randomUUID(), code: 'C', name: 'Akta Kelahiran', estimatedMinutes: 10, isActive: false }
];

const counters: Counter[] = [
  { id: randomUUID(), code: 'LOKET-01', displayName: 'Loket 01', isActive: true, serviceCategoryIds: [] },
  { id: randomUUID(), code: 'LOKET-02', displayName: 'Loket 02', isActive: true, serviceCategoryIds: [] }
];

counters[0].serviceCategoryIds = [services[0].id, services[1].id];
counters[1].serviceCategoryIds = [services[0].id];

const tickets: Ticket[] = [];
const queueEvents: QueueEvent[] = [];
const ticketCounterByServiceCode: Record<string, number> = { A: 18, B: 3, C: 1 };

function now(): string {
  return new Date().toISOString();
}

function appendEvent(ticketId: string, eventType: QueueEvent['eventType'], actorCounterId?: string): void {
  queueEvents.push({
    id: randomUUID(),
    ticketId,
    eventType,
    actorCounterId,
    createdAt: now()
  });
}

export function getUsers(): User[] {
  return users;
}

export function getServices(): ServiceCategory[] {
  return services;
}

export function createTicket(citizenNik: string, serviceCategoryId: string): Ticket {
  const service = services.find((item) => item.id === serviceCategoryId);
  if (!service) {
    throw new Error('Service category not found');
  }

  const nextNum = (ticketCounterByServiceCode[service.code] ?? 0) + 1;
  ticketCounterByServiceCode[service.code] = nextNum;

  const ticket: Ticket = {
    id: randomUUID(),
    ticketNumber: `${service.code}-${String(nextNum).padStart(3, '0')}`,
    serviceCategoryId,
    citizenNik,
    status: 'waiting',
    createdAt: now()
  };

  tickets.push(ticket);
  appendEvent(ticket.id, 'created');
  return ticket;
}

export function getNextTicket(counterId: string): Ticket | null {
  const counter = counters.find((item) => item.id === counterId);
  if (!counter) {
    return null;
  }

  return (
    tickets.find(
      (item) =>
        item.status === 'waiting' &&
        counter.serviceCategoryIds.includes(item.serviceCategoryId)
    ) ?? null
  );
}

function updateTicketStatus(ticketId: string, status: TicketStatus, eventType: QueueEvent['eventType'], counterId?: string): Ticket {
  const ticket = tickets.find((item) => item.id === ticketId);
  if (!ticket) {
    throw new Error('Ticket not found');
  }

  ticket.status = status;
  if (status === 'called') {
    ticket.calledAt = now();
  }
  if (status === 'completed') {
    ticket.completedAt = now();
  }
  if (counterId) {
    ticket.assignedCounterId = counterId;
  }

  appendEvent(ticket.id, eventType, counterId);
  return ticket;
}

export function callTicket(ticketId: string, counterId: string): Ticket {
  return updateTicketStatus(ticketId, 'called', 'called', counterId);
}

export function recallTicket(ticketId: string, counterId: string): Ticket {
  return updateTicketStatus(ticketId, 'called', 'recalled', counterId);
}

export function skipTicket(ticketId: string, counterId: string): Ticket {
  return updateTicketStatus(ticketId, 'skipped', 'skipped', counterId);
}

export function completeTicket(ticketId: string, counterId: string): Ticket {
  return updateTicketStatus(ticketId, 'completed', 'completed', counterId);
}

export function getSummary() {
  const waiting = tickets.filter((item) => item.status === 'waiting').length;
  const called = tickets.filter((item) => item.status === 'called').length;
  const completed = tickets.filter((item) => item.status === 'completed').length;
  return {
    totalTickets: tickets.length,
    waiting,
    called,
    completed,
    activeCounters: counters.filter((item) => item.isActive).length
  };
}

export function getHistory(limit = 50): Ticket[] {
  return [...tickets]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, limit);
}

export function getCounters(): Counter[] {
  return counters;
}

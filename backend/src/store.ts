import { randomUUID } from 'node:crypto';
import { query, queryOne, execute } from './db';
import type { Counter, QueueEvent, ServiceCategory, Ticket, TicketStatus, User } from './types';

// In-memory seed data (will be checked against DB)
const seedUsers = [
  {
    id: randomUUID(),
    nip: '199002152015032005',
    password: 'admin123',
    fullName: 'Siti Aminah',
    role: 'admin' as const,
    isActive: true
  },
  {
    id: randomUUID(),
    nip: '198501012010011001',
    password: 'staff123',
    fullName: 'Budi Santoso',
    role: 'staff' as const,
    isActive: true
  }
];

const seedServices = [
  {
    id: randomUUID(),
    code: 'A',
    name: 'Pembuatan e-KTP',
    estimatedMinutes: 15,
    isActive: true
  },
  {
    id: randomUUID(),
    code: 'B',
    name: 'Kartu Keluarga',
    estimatedMinutes: 20,
    isActive: true
  },
  {
    id: randomUUID(),
    code: 'C',
    name: 'Akta Kelahiran',
    estimatedMinutes: 10,
    isActive: false
  }
];

const seedCounters = [
  {
    id: randomUUID(),
    code: 'LOKET-01',
    displayName: 'Loket 01',
    isActive: true
  },
  {
    id: randomUUID(),
    code: 'LOKET-02',
    displayName: 'Loket 02',
    isActive: true
  }
];

// Initialize database with seed data
export async function initializeDatabase() {
  try {
    // Check if users exist
    const existingUsers = await query<{ id: string }>('SELECT id FROM users LIMIT 1');
    
    if (existingUsers.length === 0) {
      // Seed users
      for (const user of seedUsers) {
        await execute(
          'INSERT INTO users (id, nip, full_name, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
          [user.id, user.nip, user.fullName, user.password, user.role, user.isActive ? 1 : 0]
        );
      }

      // Seed services
      for (const service of seedServices) {
        await execute(
          'INSERT INTO service_categories (id, code, name, estimated_minutes, is_active) VALUES (?, ?, ?, ?, ?)',
          [service.id, service.code, service.name, service.estimatedMinutes, service.isActive ? 1 : 0]
        );
      }

      // Seed counters
      for (const counter of seedCounters) {
        await execute(
          'INSERT INTO counters (id, code, display_name, is_active) VALUES (?, ?, ?, ?)',
          [counter.id, counter.code, counter.displayName, counter.isActive ? 1 : 0]
        );
      }

      // Link counters to services
      const services = await query<ServiceCategory>('SELECT id, code FROM service_categories');
      const counters = await query<{ id: string; code: string }>('SELECT id, code FROM counters');
      
      // LOKET-01 serves A and B
      const loket01 = counters.find(c => c.code === 'LOKET-01');
      const serviceA = services.find(s => s.code === 'A');
      const serviceB = services.find(s => s.code === 'B');
      
      if (loket01 && serviceA) {
        await execute('INSERT INTO counter_services (counter_id, service_category_id) VALUES (?, ?)', [loket01.id, serviceA.id]);
      }
      if (loket01 && serviceB) {
        await execute('INSERT INTO counter_services (counter_id, service_category_id) VALUES (?, ?)', [loket01.id, serviceB.id]);
      }
      
      // LOKET-02 serves A
      const loket02 = counters.find(c => c.code === 'LOKET-02');
      if (loket02 && serviceA) {
        await execute('INSERT INTO counter_services (counter_id, service_category_id) VALUES (?, ?)', [loket02.id, serviceA.id]);
      }

      console.log('✓ Database initialized with seed data');
    } else {
      console.log('✓ Database already initialized');
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export async function getUsers(): Promise<User[]> {
  const users = await query<User>(
    'SELECT id, nip, full_name as fullName, role, is_active as isActive FROM users'
  );
  return users;
}

export async function authenticateUser(nip: string, password: string): Promise<User | null> {
  const user = await queryOne<any>(
    'SELECT id, nip, full_name as fullName, role, is_active as isActive, password_hash FROM users WHERE nip = ? AND password_hash = ? AND is_active = 1',
    [nip, password]
  );
  
  if (!user) {
    return null;
  }

  const { password_hash: _password, ...publicUser } = user;
  return publicUser as User;
}

export async function getServices(): Promise<ServiceCategory[]> {
  const services = await query<ServiceCategory>(
    'SELECT id, code, name, estimated_minutes as estimatedMinutes, is_active as isActive FROM service_categories'
  );
  return services;
}

export async function createTicket(citizenNik: string, serviceCategoryId: string): Promise<Ticket> {
  const service = await queryOne<ServiceCategory>(
    'SELECT code FROM service_categories WHERE id = ?',
    [serviceCategoryId]
  );

  if (!service) {
    throw new Error('Service category not found');
  }

  // Get next ticket number for this service
  const result = await queryOne<{ maxNum: number | null }>(
    'SELECT MAX(CAST(SUBSTRING(ticket_number, LOCATE("-", ticket_number) + 1) AS UNSIGNED)) as maxNum FROM tickets WHERE service_category_id = ?',
    [serviceCategoryId]
  );

  const nextNum = ((result?.maxNum ?? 0) + 1);
  const ticketNumber = `${service.code}-${String(nextNum).padStart(3, '0')}`;

  const ticketId = randomUUID();
  const now = new Date().toISOString();

  await execute(
    'INSERT INTO tickets (id, ticket_number, service_category_id, citizen_nik, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [ticketId, ticketNumber, serviceCategoryId, citizenNik, 'waiting', now]
  );

  // Log event
  const eventId = randomUUID();
  await execute(
    'INSERT INTO queue_events (id, ticket_id, event_type, created_at) VALUES (?, ?, ?, ?)',
    [eventId, ticketId, 'created', now]
  );

  const ticket = await queryOne<Ticket>(
    'SELECT id, ticket_number as ticketNumber, service_category_id as serviceCategoryId, citizen_nik as citizenNik, status, created_at as createdAt FROM tickets WHERE id = ?',
    [ticketId]
  );

  if (!ticket) {
    throw new Error('Failed to create ticket');
  }

  return ticket;
}

export async function getNextTicket(counterId: string): Promise<Ticket | null> {
  const ticket = await queryOne<Ticket>(
    `SELECT t.id, t.ticket_number as ticketNumber, t.service_category_id as serviceCategoryId, 
            t.citizen_nik as citizenNik, t.status, t.created_at as createdAt
     FROM tickets t
     JOIN counter_services cs ON t.service_category_id = cs.service_category_id
     WHERE cs.counter_id = ? AND t.status = 'waiting'
     ORDER BY t.created_at ASC
     LIMIT 1`,
    [counterId]
  );

  return ticket || null;
}

async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus,
  eventType: QueueEvent['eventType'],
  counterId?: string
): Promise<Ticket> {
  const now = new Date().toISOString();

  // Update ticket
  const updates: string[] = ['status = ?', 'updated_at = ?'];
  const params: any[] = [status, now];

  if (status === 'called') {
    updates.push('called_at = ?');
    params.push(now);
  }
  if (status === 'completed') {
    updates.push('completed_at = ?');
    params.push(now);
  }
  if (counterId) {
    updates.push('assigned_counter_id = ?');
    params.push(counterId);
  }

  params.push(ticketId);

  await execute(
    `UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`,
    params
  );

  // Log event
  const eventId = randomUUID();
  await execute(
    'INSERT INTO queue_events (id, ticket_id, event_type, actor_counter_id, created_at) VALUES (?, ?, ?, ?, ?)',
    [eventId, ticketId, eventType, counterId || null, now]
  );

  const ticket = await queryOne<Ticket>(
    'SELECT id, ticket_number as ticketNumber, service_category_id as serviceCategoryId, citizen_nik as citizenNik, status, created_at as createdAt FROM tickets WHERE id = ?',
    [ticketId]
  );

  if (!ticket) {
    throw new Error('Ticket not found');
  }

  return ticket;
}

export async function callTicket(ticketId: string, counterId: string): Promise<Ticket> {
  return updateTicketStatus(ticketId, 'called', 'called', counterId);
}

export async function recallTicket(ticketId: string, counterId: string): Promise<Ticket> {
  return updateTicketStatus(ticketId, 'called', 'recalled', counterId);
}

export async function skipTicket(ticketId: string, counterId: string): Promise<Ticket> {
  return updateTicketStatus(ticketId, 'skipped', 'skipped', counterId);
}

export async function completeTicket(ticketId: string, counterId: string): Promise<Ticket> {
  return updateTicketStatus(ticketId, 'completed', 'completed', counterId);
}

export async function getSummary() {
  const summary = await queryOne<{
    total_tickets: number;
    waiting: number;
    called: number;
    completed: number;
    active_counters: number;
  }>(
    `SELECT 
      COUNT(*) as total_tickets,
      SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) as waiting,
      SUM(CASE WHEN status = 'called' THEN 1 ELSE 0 END) as called,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      (SELECT COUNT(*) FROM counters WHERE is_active = 1) as active_counters
     FROM tickets`
  );

  return {
    totalTickets: summary?.total_tickets || 0,
    waiting: summary?.waiting || 0,
    called: summary?.called || 0,
    completed: summary?.completed || 0,
    activeCounters: summary?.active_counters || 0
  };
}

export async function getHistory(limit = 50) {
  const tickets = await query<any>(
    `SELECT id, ticket_number as ticketNumber, service_category_id as serviceCategoryId, 
            citizen_nik as citizenNik, status, assigned_counter_id as assignedCounterId,
            called_at as calledAt, completed_at as completedAt, created_at as createdAt
     FROM tickets
     ORDER BY created_at DESC
     LIMIT ?`,
    [limit]
  );

  return tickets;
}

export async function getCounters(): Promise<Counter[]> {
  const counters = await query<any>(
    `SELECT c.id, c.code, c.display_name as displayName
     FROM counters c`
  );

  // Fetch associated services for each counter
  for (const counter of counters) {
    const services = await query<{ service_category_id: string }>(
      'SELECT service_category_id FROM counter_services WHERE counter_id = ?',
      [counter.id]
    );
    counter.serviceCategoryIds = services.map(s => s.service_category_id);
  }

  return counters;
}

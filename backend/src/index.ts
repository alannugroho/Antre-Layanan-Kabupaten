import cors from 'cors';
import dotenv from 'dotenv';
import express, { type Request, type Response } from 'express';
import { z } from 'zod';
import {
  callTicket,
  completeTicket,
  createTicket,
  getCounters,
  getHistory,
  getNextTicket,
  getServices,
  getSummary,
  getUsers,
  recallTicket,
  skipTicket
} from './store';

dotenv.config();

const app = express();
const PORT = Number(process.env.API_PORT ?? 3000);

app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'backend', timestamp: new Date().toISOString() });
});

app.post('/auth/login', (req: Request, res: Response) => {
  const schema = z.object({
    role: z.enum(['admin', 'staff']),
    nip: z.string().min(3),
    password: z.string().min(3)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid login payload' });
  }

  return res.json({
    accessToken: 'dev-token',
    refreshToken: 'dev-refresh-token',
    role: parsed.data.role
  });
});

app.get('/users', (_req: Request, res: Response) => {
  res.json(getUsers());
});

app.get('/services', (_req: Request, res: Response) => {
  res.json(getServices());
});

app.get('/counters', (_req: Request, res: Response) => {
  res.json(getCounters());
});

app.post('/tickets', (req: Request, res: Response) => {
  const schema = z.object({
    citizenNik: z.string().min(8),
    serviceCategoryId: z.string().uuid()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid ticket payload' });
  }

  try {
    const ticket = createTicket(parsed.data.citizenNik, parsed.data.serviceCategoryId);
    return res.status(201).json(ticket);
  } catch (error) {
    return res.status(404).json({ message: (error as Error).message });
  }
});

app.get('/tickets/next', (req: Request, res: Response) => {
  const counterId = String(req.query.counterId ?? '');
  if (!counterId) {
    return res.status(400).json({ message: 'counterId is required' });
  }

  const nextTicket = getNextTicket(counterId);
  return res.json(nextTicket);
});

function ticketActionHandler(
  action: (ticketId: string, counterId: string) => unknown
): (req: Request, res: Response) => Response {
  return (req: Request, res: Response) => {
    const schema = z.object({ counterId: z.string().uuid() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'counterId is required' });
    }

    try {
      const ticket = action(String(req.params.id), parsed.data.counterId);
      return res.json(ticket);
    } catch (error) {
      return res.status(404).json({ message: (error as Error).message });
    }
  };
}

app.post('/tickets/:id/call', ticketActionHandler(callTicket));
app.post('/tickets/:id/recall', ticketActionHandler(recallTicket));
app.post('/tickets/:id/skip', ticketActionHandler(skipTicket));
app.post('/tickets/:id/complete', ticketActionHandler(completeTicket));

app.get('/reports/summary', (_req: Request, res: Response) => {
  res.json(getSummary());
});

app.get('/reports/history', (req: Request, res: Response) => {
  const limit = Number(req.query.limit ?? 50);
  res.json(getHistory(Number.isNaN(limit) ? 50 : limit));
});

app.listen(PORT, () => {
  console.log(`API ready on http://localhost:${PORT}`);
});

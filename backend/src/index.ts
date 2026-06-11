import cors from 'cors';
import dotenv from 'dotenv';
import express, { type Request, type Response } from 'express';
import { z } from 'zod';
import {
  authenticateUser,
  callTicket,
  completeTicket,
  createTicket,
  getCounters,
  getHistory,
  getNextTicket,
  getServices,
  getSummary,
  getUsers,
  initializeDatabase,
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

app.post('/auth/login', async (req: Request, res: Response) => {
  const schema = z.object({
    nip: z.string().min(3),
    password: z.string().min(3)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid login payload' });
  }

  try {
    const user = await authenticateUser(parsed.data.nip, parsed.data.password);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    return res.json({
      accessToken: `dev-token-${user.role}-${user.id}`,
      refreshToken: `dev-refresh-token-${user.role}-${user.id}`,
      role: user.role,
      user
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

app.get('/users', async (_req: Request, res: Response) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

app.get('/services', async (_req: Request, res: Response) => {
  try {
    const services = await getServices();
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

app.get('/counters', async (_req: Request, res: Response) => {
  try {
    const counters = await getCounters();
    res.json(counters);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

app.post('/tickets', async (req: Request, res: Response) => {
  const schema = z.object({
    citizenNik: z.string().min(8),
    serviceCategoryId: z.string().uuid()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid ticket payload' });
  }

  try {
    const ticket = await createTicket(parsed.data.citizenNik, parsed.data.serviceCategoryId);
    return res.status(201).json(ticket);
  } catch (error) {
    return res.status(404).json({ message: (error as Error).message });
  }
});

app.get('/tickets/next', async (req: Request, res: Response) => {
  const counterId = String(req.query.counterId ?? '');
  if (!counterId) {
    return res.status(400).json({ message: 'counterId is required' });
  }

  try {
    const nextTicket = await getNextTicket(counterId);
    return res.json(nextTicket);
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
});

function ticketActionHandler(
  action: (ticketId: string, counterId: string) => Promise<any>
): (req: Request, res: Response) => Promise<Response | undefined> {
  return async (req: Request, res: Response) => {
    const schema = z.object({ counterId: z.string().uuid() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'counterId is required' });
    }

    try {
      const ticket = await action(String(req.params.id), parsed.data.counterId);
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

app.get('/reports/summary', async (_req: Request, res: Response) => {
  try {
    const summary = await getSummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

app.get('/reports/history', async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit ?? 50);
    const history = await getHistory(Number.isNaN(limit) ? 50 : limit);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
});

(async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`API ready on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();

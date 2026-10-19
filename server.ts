import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getDb, getDbStatus } from './db';

const app = new Hono();

app.use('*', cors());

// Health & Database status endpoint
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    database: getDbStatus(),
  });
});

app.get('/api/bills/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const db = await getDb();
    const bill = await db.getBill(id);

    if (!bill) {
      return c.json({ error: 'Bill not found' }, 404);
    }

    return c.json(bill);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to get bill';
    console.error(`Error getting bill ${id}:`, error);
    return c.json({ error: msg }, 500);
  }
});

app.post('/api/bills', async (c) => {
  try {
    const body = await c.req.json();
    const { id, data } = body;
    const billId = id || crypto.randomUUID();

    const db = await getDb();
    await db.saveBill(billId, data || {});

    return c.json({ id: billId, success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to save bill';
    console.error("Save error:", error);
    return c.json({ error: msg }, 500);
  }
});

// List all bills for history
app.get('/api/bills', async (c) => {
  try {
    const db = await getDb();
    const summary = await db.listBills();
    return c.json(summary);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to list bills';
    console.error("List bills error:", error);
    return c.json({ error: msg }, 500);
  }
});

// Initialize database connection on startup
await getDb();

export default {
  port: 3001,
  fetch: app.fetch,
};

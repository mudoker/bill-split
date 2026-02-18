import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Database } from 'bun:sqlite';

const app = new Hono();
const db = new Database('bills.sqlite', { create: true });

// Enable Foreign Keys
db.run('PRAGMA foreign_keys = ON');

// Initialize database with normalized schema
db.transaction(() => {
  // db.run(`DROP TABLE IF EXISTS item_assignments`);
  // db.run(`DROP TABLE IF EXISTS global_charges`);
  // db.run(`DROP TABLE IF EXISTS items`);
  // db.run(`DROP TABLE IF EXISTS people`);
  // db.run(`DROP TABLE IF EXISTS bills`);

  db.run(`
    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      name TEXT,
      location TEXT,
      host_id TEXT,
      qr_code TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS people (
      id TEXT PRIMARY KEY,
      bill_id TEXT,
      name TEXT NOT NULL,
      sponsor_amount REAL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      FOREIGN KEY(bill_id) REFERENCES bills(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      bill_id TEXT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER DEFAULT 1,
      FOREIGN KEY(bill_id) REFERENCES bills(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS item_assignments (
      item_id TEXT,
      person_id TEXT,
      quantity REAL DEFAULT 1,
      PRIMARY KEY (item_id, person_id),
      FOREIGN KEY(item_id) REFERENCES items(id) ON DELETE CASCADE,
      FOREIGN KEY(person_id) REFERENCES people(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS global_charges (
      id TEXT PRIMARY KEY,
      bill_id TEXT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      FOREIGN KEY(bill_id) REFERENCES bills(id) ON DELETE CASCADE
    )
  `);
})();

app.use('*', cors());

app.get('/api/bills/:id', (c) => {
  const id = c.req.param('id');
  const bill = db.query('SELECT * FROM bills WHERE id = ?').get(id) as any;

  if (!bill) {
    return c.json({ error: 'Bill not found' }, 404);
  }

  const people = db.query('SELECT id, name, sponsor_amount as sponsorAmount, paid_amount as paidAmount FROM people WHERE bill_id = ?').all(id) as any[];
  const globalCharges = db.query('SELECT id, name, type, amount FROM global_charges WHERE bill_id = ?').all(id) as any[];
  const itemsRaw = db.query('SELECT id, name, price, quantity FROM items WHERE bill_id = ?').all(id) as any[];

  const items = itemsRaw.map(item => {
    const assignmentsRows = db.query('SELECT person_id, quantity FROM item_assignments WHERE item_id = ?').all(item.id) as any[];
    const assignments: Record<string, number> = {};
    assignmentsRows.forEach(row => {
      assignments[row.person_id] = row.quantity;
    });
    return { ...item, assignments };
  });

  return c.json({
    id: bill.id,
    data: {
      name: bill.name,
      location: bill.location,
      people,
      items,
      globalCharges,
      hostId: bill.host_id,
      qrCode: bill.qr_code
    },
    created_at: bill.created_at,
    updated_at: bill.updated_at
  });
});

app.post('/api/bills', async (c) => {
  const body = await c.req.json();
  const { id, data } = body;
  const billId = id || crypto.randomUUID();
  const { name = null, location = null, people = [], items = [], globalCharges = [], hostId = null, qrCode = null } = data;

  try {
    db.transaction(() => {
      const existing = db.query('SELECT id FROM bills WHERE id = ?').get(billId);
      if (existing) {
        db.run('UPDATE bills SET name = ?, location = ?, host_id = ?, qr_code = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [name, location, hostId, qrCode, billId]);
      } else {
        db.run('INSERT INTO bills (id, name, location, host_id, qr_code) VALUES (?, ?, ?, ?, ?)', [billId, name, location, hostId, qrCode]);
      }

      db.run('DELETE FROM people WHERE bill_id = ?', [billId]);
      db.run('DELETE FROM items WHERE bill_id = ?', [billId]);
      db.run('DELETE FROM global_charges WHERE bill_id = ?', [billId]);

      for (const p of people) {
        db.run('INSERT INTO people (id, bill_id, name, sponsor_amount, paid_amount) VALUES (?, ?, ?, ?, ?)',
          [p.id, billId, p.name, p.sponsorAmount || 0, p.paidAmount || 0]);
      }

      // 4. Insert Items & Assignments
      for (const item of items) {
        db.run('INSERT INTO items (id, bill_id, name, price, quantity) VALUES (?, ?, ?, ?, ?)',
          [item.id, billId, item.name, item.price, item.quantity || 1]);

        if (item.assignments) {
          for (const [pId, qty] of Object.entries(item.assignments)) {
            // Verify person exists for this bill (safety check)
            db.run('INSERT INTO item_assignments (item_id, person_id, quantity) VALUES (?, ?, ?)',
              [item.id, pId, qty]);
          }
        }
      }

      // 5. Insert Global Charges
      for (const gc of globalCharges) {
        db.run('INSERT INTO global_charges (id, bill_id, name, type, amount) VALUES (?, ?, ?, ?, ?)',
          [gc.id, billId, gc.name, gc.type, gc.amount]);
      }
    })();

    return c.json({ id: billId, success: true });
  } catch (error: any) {
    console.error("Save error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// List all bills for history
app.get('/api/bills', (c) => {
  const query = db.query(`
    SELECT
      b.id,
      b.created_at,
      b.updated_at,
      b.name as custom_name,
      b.location,
      (SELECT name FROM items WHERE bill_id = b.id LIMIT 1) as first_item_name,
      (SELECT COUNT(*) FROM items WHERE bill_id = b.id) as item_count,
      (SELECT SUM(price) FROM items WHERE bill_id = b.id) as subtotal,
      (SELECT SUM(amount) FROM global_charges WHERE bill_id = b.id AND type = 'fixed') as fixed_extras,
      (SELECT SUM(amount) FROM global_charges WHERE bill_id = b.id AND type = 'percent') as percent_extras
    FROM bills b
    ORDER BY b.updated_at DESC
  `);

  const bills = query.all() as any[];

  const summary = bills.map(b => {
    let total = b.subtotal || 0;

    // Add percent extras
    const percentSum = b.percent_extras || 0;
    total += (percentSum / 100) * total;

    // Add fixed extras
    total += (b.fixed_extras || 0);

    return {
      id: b.id,
      created_at: b.created_at,
      updated_at: b.updated_at,
      name: b.custom_name || (b.first_item_name ? b.first_item_name + (b.item_count > 1 ? ` & ${b.item_count - 1} more` : '') : 'Empty Bill'),
      location: b.location,
      totalAmount: total
    };
  });

  return c.json(summary);
});

export default {
  port: 3001,
  fetch: app.fetch,
};

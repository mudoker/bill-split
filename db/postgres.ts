import { Pool as PgPool } from 'pg';
import type { DatabaseAdapter, BillDetail, BillPayload, BillSummary } from './types';

export class PostgresAdapter implements DatabaseAdapter {
  readonly type: 'neon' | 'postgres';
  private connectionString: string;
  private pool: PgPool | null = null;

  constructor(connectionString: string) {
    this.connectionString = connectionString.trim();
    const isNeon = this.connectionString.includes('neon.tech');
    this.type = isNeon ? 'neon' : 'postgres';
  }

  async init(): Promise<void> {
    const isLocal =
      this.connectionString.includes('localhost') ||
      this.connectionString.includes('127.0.0.1');

    const pgPool = new PgPool({
      connectionString: this.connectionString,
      ssl: isLocal
        ? false
        : {
            rejectUnauthorized: false,
          },
      connectionTimeoutMillis: 5000,
    });

    pgPool.on('error', (err) => {
      console.warn(`[PostgreSQL Pool Error]: ${err.message}`);
    });

    try {
      const client = await pgPool.connect();
      await client.query('SELECT 1');
      client.release();
      this.pool = pgPool;
    } catch (err: unknown) {
      await pgPool.end().catch(() => {});
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Connection failed: ${msg}`);
    }

    // Initialize Schema
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS bills (
          id TEXT PRIMARY KEY,
          name TEXT,
          location TEXT,
          host_id TEXT,
          qr_code TEXT,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS people (
          id TEXT PRIMARY KEY,
          bill_id TEXT REFERENCES bills(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          sponsor_amount DOUBLE PRECISION DEFAULT 0,
          paid_amount DOUBLE PRECISION DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS items (
          id TEXT PRIMARY KEY,
          bill_id TEXT REFERENCES bills(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          price DOUBLE PRECISION NOT NULL,
          quantity DOUBLE PRECISION DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS item_assignments (
          item_id TEXT REFERENCES items(id) ON DELETE CASCADE,
          person_id TEXT REFERENCES people(id) ON DELETE CASCADE,
          quantity DOUBLE PRECISION DEFAULT 1,
          PRIMARY KEY (item_id, person_id)
        );

        CREATE TABLE IF NOT EXISTS global_charges (
          id TEXT PRIMARY KEY,
          bill_id TEXT REFERENCES bills(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          amount DOUBLE PRECISION NOT NULL
        );
      `);
    } finally {
      client.release();
    }
  }

  async getBill(id: string): Promise<BillDetail | null> {
    if (!this.pool) throw new Error('Database pool not initialized');
    const client = await this.pool.connect();
    try {
      const billRes = await client.query('SELECT * FROM bills WHERE id = $1', [id]);
      if (billRes.rows.length === 0) return null;
      const bill = billRes.rows[0];

      const peopleRes = await client.query(
        'SELECT id, name, sponsor_amount as "sponsorAmount", paid_amount as "paidAmount" FROM people WHERE bill_id = $1',
        [id]
      );
      const people = peopleRes.rows.map(p => ({
        id: String(p.id),
        name: String(p.name),
        sponsorAmount: Number(p.sponsorAmount || 0),
        paidAmount: Number(p.paidAmount || 0),
      }));

      const globalChargesRes = await client.query(
        'SELECT id, name, type, amount FROM global_charges WHERE bill_id = $1',
        [id]
      );
      const globalCharges = globalChargesRes.rows.map(gc => ({
        id: String(gc.id),
        name: String(gc.name),
        type: String(gc.type),
        amount: Number(gc.amount || 0),
      }));

      const itemsRes = await client.query(
        'SELECT id, name, price, quantity FROM items WHERE bill_id = $1',
        [id]
      );

      const assignmentsRes = await client.query(
        'SELECT ia.item_id, ia.person_id, ia.quantity FROM item_assignments ia JOIN items i ON ia.item_id = i.id WHERE i.bill_id = $1',
        [id]
      );

      const assignmentsByItem: Record<string, Record<string, number>> = {};
      for (const row of assignmentsRes.rows) {
        if (!assignmentsByItem[row.item_id]) {
          assignmentsByItem[row.item_id] = {};
        }
        assignmentsByItem[row.item_id][row.person_id] = Number(row.quantity || 0);
      }

      const items = itemsRes.rows.map(item => ({
        id: String(item.id),
        name: String(item.name),
        price: Number(item.price || 0),
        quantity: Number(item.quantity || 1),
        assignments: assignmentsByItem[item.id] || {},
      }));

      return {
        id: String(bill.id),
        data: {
          name: bill.name ?? null,
          location: bill.location ?? null,
          people,
          items,
          globalCharges,
          hostId: bill.host_id ?? null,
          qrCode: bill.qr_code ?? null,
        },
        created_at: typeof bill.created_at === 'string' ? bill.created_at : new Date(bill.created_at).toISOString(),
        updated_at: typeof bill.updated_at === 'string' ? bill.updated_at : new Date(bill.updated_at).toISOString(),
      };
    } finally {
      client.release();
    }
  }

  async saveBill(billId: string, data: BillPayload): Promise<void> {
    if (!this.pool) throw new Error('Database pool not initialized');
    const { name = null, location = null, people = [], items = [], globalCharges = [], hostId = null, qrCode = null } = data;
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Upsert bill
      await client.query(`
        INSERT INTO bills (id, name, location, host_id, qr_code, updated_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          location = EXCLUDED.location,
          host_id = EXCLUDED.host_id,
          qr_code = EXCLUDED.qr_code,
          updated_at = CURRENT_TIMESTAMP
      `, [billId, name, location, hostId, qrCode]);

      // Delete existing children
      await client.query('DELETE FROM item_assignments WHERE item_id IN (SELECT id FROM items WHERE bill_id = $1)', [billId]);
      await client.query('DELETE FROM people WHERE bill_id = $1', [billId]);
      await client.query('DELETE FROM items WHERE bill_id = $1', [billId]);
      await client.query('DELETE FROM global_charges WHERE bill_id = $1', [billId]);

      // Insert people
      for (const p of people) {
        await client.query(
          'INSERT INTO people (id, bill_id, name, sponsor_amount, paid_amount) VALUES ($1, $2, $3, $4, $5)',
          [p.id, billId, p.name, Number(p.sponsorAmount || 0), Number(p.paidAmount || 0)]
        );
      }

      // Insert items & assignments
      for (const item of items) {
        await client.query(
          'INSERT INTO items (id, bill_id, name, price, quantity) VALUES ($1, $2, $3, $4, $5)',
          [item.id, billId, item.name, Number(item.price || 0), Number(item.quantity || 1)]
        );

        if (item.assignments) {
          for (const [pId, qty] of Object.entries(item.assignments)) {
            await client.query(
              'INSERT INTO item_assignments (item_id, person_id, quantity) VALUES ($1, $2, $3)',
              [item.id, pId, Number(qty || 0)]
            );
          }
        }
      }

      // Insert global charges
      for (const gc of globalCharges) {
        await client.query(
          'INSERT INTO global_charges (id, bill_id, name, type, amount) VALUES ($1, $2, $3, $4, $5)',
          [gc.id, billId, gc.name, gc.type, Number(gc.amount || 0)]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async listBills(): Promise<BillSummary[]> {
    if (!this.pool) throw new Error('Database pool not initialized');
    const client = await this.pool.connect();
    try {
      const res = await client.query(`
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

      return res.rows.map(b => {
        let total = Number(b.subtotal || 0);
        const percentSum = Number(b.percent_extras || 0);
        total += (percentSum / 100) * total;
        total += Number(b.fixed_extras || 0);
        const itemCount = Number(b.item_count || 0);

        return {
          id: String(b.id),
          created_at: typeof b.created_at === 'string' ? b.created_at : new Date(b.created_at).toISOString(),
          updated_at: typeof b.updated_at === 'string' ? b.updated_at : new Date(b.updated_at).toISOString(),
          name: b.custom_name || (b.first_item_name ? b.first_item_name + (itemCount > 1 ? ` & ${itemCount - 1} more` : '') : 'Empty Bill'),
          location: b.location ?? null,
          totalAmount: total,
        };
      });
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}

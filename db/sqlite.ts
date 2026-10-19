import { DatabaseSync } from 'node:sqlite';
import type { DatabaseAdapter, BillDetail, BillPayload, BillSummary } from './types';

interface BillRow {
  id: string;
  name: string | null;
  location: string | null;
  host_id: string | null;
  qr_code: string | null;
  created_at: string;
  updated_at: string;
}

interface PersonRow {
  id: string;
  name: string;
  sponsorAmount?: number;
  paidAmount?: number;
}

interface ChargeRow {
  id: string;
  name: string;
  type: string;
  amount: number;
}

interface ItemRow {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface AssignmentRow {
  person_id: string;
  quantity: number;
}

interface BillSummaryRow {
  id: string;
  created_at: string;
  updated_at: string;
  custom_name: string | null;
  location: string | null;
  first_item_name: string | null;
  item_count: number;
  subtotal: number | null;
  fixed_extras: number | null;
  percent_extras: number | null;
}

export class SqliteAdapter implements DatabaseAdapter {
  readonly type = 'sqlite' as const;
  private db: DatabaseSync;

  constructor(filePath = 'bills.sqlite') {
    this.db = new DatabaseSync(filePath);
    this.db.exec('PRAGMA foreign_keys = ON;');
  }

  async init(): Promise<void> {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS bills (
        id TEXT PRIMARY KEY,
        name TEXT,
        location TEXT,
        host_id TEXT,
        qr_code TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS people (
        id TEXT PRIMARY KEY,
        bill_id TEXT,
        name TEXT NOT NULL,
        sponsor_amount REAL DEFAULT 0,
        paid_amount REAL DEFAULT 0,
        FOREIGN KEY(bill_id) REFERENCES bills(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        bill_id TEXT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        quantity REAL DEFAULT 1,
        FOREIGN KEY(bill_id) REFERENCES bills(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS item_assignments (
        item_id TEXT,
        person_id TEXT,
        quantity REAL DEFAULT 1,
        PRIMARY KEY (item_id, person_id),
        FOREIGN KEY(item_id) REFERENCES items(id) ON DELETE CASCADE,
        FOREIGN KEY(person_id) REFERENCES people(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS global_charges (
        id TEXT PRIMARY KEY,
        bill_id TEXT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        FOREIGN KEY(bill_id) REFERENCES bills(id) ON DELETE CASCADE
      );
    `);
  }

  async getBill(id: string): Promise<BillDetail | null> {
    const bill = this.db.prepare('SELECT * FROM bills WHERE id = ?').get(id) as unknown as BillRow | undefined;
    if (!bill) return null;

    const people = (
      this.db.prepare(
        'SELECT id, name, sponsor_amount as sponsorAmount, paid_amount as paidAmount FROM people WHERE bill_id = ?'
      ).all(id) as unknown as PersonRow[]
    ).map(p => ({
      id: String(p.id),
      name: String(p.name),
      sponsorAmount: Number(p.sponsorAmount || 0),
      paidAmount: Number(p.paidAmount || 0),
    }));

    const globalCharges = (
      this.db.prepare(
        'SELECT id, name, type, amount FROM global_charges WHERE bill_id = ?'
      ).all(id) as unknown as ChargeRow[]
    ).map(gc => ({
      id: String(gc.id),
      name: String(gc.name),
      type: String(gc.type),
      amount: Number(gc.amount || 0),
    }));

    const itemsRaw = this.db.prepare('SELECT id, name, price, quantity FROM items WHERE bill_id = ?').all(id) as unknown as ItemRow[];
    const items = itemsRaw.map(item => {
      const assignmentsRows = this.db.prepare(
        'SELECT person_id, quantity FROM item_assignments WHERE item_id = ?'
      ).all(item.id) as unknown as AssignmentRow[];
      const assignments: Record<string, number> = {};
      assignmentsRows.forEach(row => {
        assignments[row.person_id] = Number(row.quantity);
      });
      return {
        id: String(item.id),
        name: String(item.name),
        price: Number(item.price || 0),
        quantity: Number(item.quantity || 1),
        assignments,
      };
    });

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
  }

  async saveBill(billId: string, data: BillPayload): Promise<void> {
    const { name = null, location = null, people = [], items = [], globalCharges = [], hostId = null, qrCode = null } = data;

    this.db.exec('BEGIN TRANSACTION;');
    try {
      const existing = this.db.prepare('SELECT id FROM bills WHERE id = ?').get(billId);
      if (existing) {
        this.db.prepare(
          'UPDATE bills SET name = ?, location = ?, host_id = ?, qr_code = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).run(name, location, hostId, qrCode, billId);
      } else {
        this.db.prepare(
          'INSERT INTO bills (id, name, location, host_id, qr_code) VALUES (?, ?, ?, ?, ?)'
        ).run(billId, name, location, hostId, qrCode);
      }

      this.db.prepare('DELETE FROM item_assignments WHERE item_id IN (SELECT id FROM items WHERE bill_id = ?)').run(billId);
      this.db.prepare('DELETE FROM people WHERE bill_id = ?').run(billId);
      this.db.prepare('DELETE FROM items WHERE bill_id = ?').run(billId);
      this.db.prepare('DELETE FROM global_charges WHERE bill_id = ?').run(billId);

      const insertPerson = this.db.prepare(
        'INSERT INTO people (id, bill_id, name, sponsor_amount, paid_amount) VALUES (?, ?, ?, ?, ?)'
      );
      for (const p of people) {
        insertPerson.run(p.id, billId, p.name, Number(p.sponsorAmount || 0), Number(p.paidAmount || 0));
      }

      const insertItem = this.db.prepare(
        'INSERT INTO items (id, bill_id, name, price, quantity) VALUES (?, ?, ?, ?, ?)'
      );
      const insertAssignment = this.db.prepare(
        'INSERT INTO item_assignments (item_id, person_id, quantity) VALUES (?, ?, ?)'
      );
      for (const item of items) {
        insertItem.run(item.id, billId, item.name, Number(item.price || 0), Number(item.quantity || 1));

        if (item.assignments) {
          for (const [pId, qty] of Object.entries(item.assignments)) {
            insertAssignment.run(item.id, pId, Number(qty || 0));
          }
        }
      }

      const insertCharge = this.db.prepare(
        'INSERT INTO global_charges (id, bill_id, name, type, amount) VALUES (?, ?, ?, ?, ?)'
      );
      for (const gc of globalCharges) {
        insertCharge.run(gc.id, billId, gc.name, gc.type, Number(gc.amount || 0));
      }

      this.db.exec('COMMIT;');
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  async listBills(): Promise<BillSummary[]> {
    const query = this.db.prepare(`
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

    const bills = query.all() as unknown as BillSummaryRow[];

    return bills.map(b => {
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
  }

  async close(): Promise<void> {
    this.db.close();
  }
}

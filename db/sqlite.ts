import { DatabaseSync } from 'node:sqlite';
import type { DatabaseAdapter, BillDetail, BillPayload, BillSummary, User } from './types';

interface BillRow {
  id: string;
  name: string | null;
  location: string | null;
  host_id: string | null;
  qr_code: string | null;
  owner_id: string | null;
  currency: string | null;
  created_at: string;
  updated_at: string;
}

interface PersonRow {
  id: string;
  name: string;
  sponsorAmount?: number;
  paidAmount?: number;
  userId?: string | null;
  email?: string | null;
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
  owner_id: string | null;
  first_item_name: string | null;
  item_count: number;
  subtotal: number | null;
  fixed_extras: number | null;
  percent_extras: number | null;
}

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
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
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        avatar_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS bills (
        id TEXT PRIMARY KEY,
        name TEXT,
        location TEXT,
        host_id TEXT,
        qr_code TEXT,
        owner_id TEXT,
        currency TEXT DEFAULT 'VND',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS people (
        id TEXT PRIMARY KEY,
        bill_id TEXT,
        name TEXT NOT NULL,
        sponsor_amount REAL DEFAULT 0,
        paid_amount REAL DEFAULT 0,
        user_id TEXT,
        email TEXT,
        FOREIGN KEY(bill_id) REFERENCES bills(id) ON DELETE CASCADE,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
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

    // Check and add missing columns if upgrading an existing SQLite database
    const billColumns = this.db.prepare("PRAGMA table_info(bills)").all() as Array<{ name: string }>;
    const billColNames = new Set(billColumns.map(c => c.name));
    if (!billColNames.has('owner_id')) {
      this.db.exec('ALTER TABLE bills ADD COLUMN owner_id TEXT;');
    }
    if (!billColNames.has('currency')) {
      this.db.exec("ALTER TABLE bills ADD COLUMN currency TEXT DEFAULT 'VND';");
    }

    const peopleColumns = this.db.prepare("PRAGMA table_info(people)").all() as Array<{ name: string }>;
    const peopleColNames = new Set(peopleColumns.map(c => c.name));
    if (!peopleColNames.has('user_id')) {
      this.db.exec('ALTER TABLE people ADD COLUMN user_id TEXT;');
    }
    if (!peopleColNames.has('email')) {
      this.db.exec('ALTER TABLE people ADD COLUMN email TEXT;');
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const row = this.db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim()) as UserRow | undefined;
    if (!row) return null;
    return {
      id: String(row.id),
      email: String(row.email),
      name: row.name ? String(row.name) : null,
      avatar_url: row.avatar_url ? String(row.avatar_url) : null,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }

  async getUserById(id: string): Promise<User | null> {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
    if (!row) return null;
    return {
      id: String(row.id),
      email: String(row.email),
      name: row.name ? String(row.name) : null,
      avatar_url: row.avatar_url ? String(row.avatar_url) : null,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }

  async upsertUser(user: { id?: string; email: string; name?: string | null; avatar_url?: string | null }): Promise<User> {
    const cleanEmail = user.email.trim().toLowerCase();
    const existing = await this.getUserByEmail(cleanEmail);
    const userId = existing?.id || user.id || crypto.randomUUID();

    if (existing) {
      this.db.prepare(`
        UPDATE users
        SET name = COALESCE(?, name),
            avatar_url = COALESCE(?, avatar_url),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(user.name || null, user.avatar_url || null, existing.id);
    } else {
      this.db.prepare(`
        INSERT INTO users (id, email, name, avatar_url, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(userId, cleanEmail, user.name || null, user.avatar_url || null);
    }

    // Auto-link existing participants with matching email
    this.db.prepare('UPDATE people SET user_id = ? WHERE LOWER(email) = LOWER(?) AND user_id IS NULL').run(userId, cleanEmail);

    const saved = await this.getUserById(userId);
    if (!saved) throw new Error('Failed to retrieve user after upsert');
    return saved;
  }

  async searchUsers(query: string): Promise<Array<{ id: string; email: string; name: string | null; avatar_url: string | null }>> {
    const term = `%${query.trim().toLowerCase()}%`;
    const rows = this.db.prepare(
      'SELECT id, email, name, avatar_url FROM users WHERE LOWER(email) LIKE ? OR LOWER(name) LIKE ? LIMIT 10'
    ).all(term, term) as unknown as UserRow[];

    return rows.map(r => ({
      id: String(r.id),
      email: String(r.email),
      name: r.name ? String(r.name) : null,
      avatar_url: r.avatar_url ? String(r.avatar_url) : null,
    }));
  }

  async getBill(id: string, userId?: string | null, isShare: boolean = false): Promise<BillDetail | null> {
    const bill = this.db.prepare('SELECT * FROM bills WHERE id = ?').get(id) as unknown as BillRow | undefined;
    if (!bill) return null;

    let userEmail: string | null = null;
    if (userId) {
      const u = await this.getUserById(userId);
      if (u) userEmail = u.email;
    }

    const isOwner = Boolean(userId && bill.owner_id === userId);

    const participantCheck = this.db.prepare(
      'SELECT id FROM people WHERE bill_id = ? AND (user_id = ? OR (email IS NOT NULL AND LOWER(email) = LOWER(?)))'
    ).all(id, userId || 'none', userEmail || 'none');
    const isParticipant = participantCheck.length > 0;

    if (!isShare && !isOwner && !isParticipant) {
      return null;
    }

    const role: 'owner' | 'participant' | 'viewer' = isOwner ? 'owner' : (isParticipant ? 'participant' : 'viewer');
    const isReadOnly = isShare || !isOwner;

    const people = (
      this.db.prepare(
        'SELECT id, name, sponsor_amount as sponsorAmount, paid_amount as paidAmount, user_id as userId, email FROM people WHERE bill_id = ?'
      ).all(id) as unknown as PersonRow[]
    ).map(p => ({
      id: String(p.id),
      name: String(p.name),
      sponsorAmount: Number(p.sponsorAmount || 0),
      paidAmount: Number(p.paidAmount || 0),
      userId: p.userId ? String(p.userId) : null,
      email: p.email ? String(p.email) : null,
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
      owner_id: bill.owner_id ? String(bill.owner_id) : null,
      role,
      isReadOnly,
      data: {
        name: bill.name ?? null,
        location: bill.location ?? null,
        currency: bill.currency ?? 'VND',
        ownerId: bill.owner_id ? String(bill.owner_id) : null,
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

  async saveBill(billId: string, data: BillPayload, userId?: string | null): Promise<void> {
    const {
      name = null,
      location = null,
      people = [],
      items = [],
      globalCharges = [],
      hostId = null,
      qrCode = null,
      currency = 'VND'
    } = data;

    this.db.exec('BEGIN TRANSACTION;');
    try {
      const existing = this.db.prepare('SELECT id, owner_id FROM bills WHERE id = ?').get(billId) as BillRow | undefined;
      if (existing) {
        if (existing.owner_id && userId && existing.owner_id !== userId) {
          throw new Error('Forbidden: Only the bill owner can edit this bill');
        }
      }

      const ownerId = existing
        ? (existing.owner_id || userId || null)
        : (userId || data.ownerId || null);

      if (existing) {
        this.db.prepare(
          'UPDATE bills SET name = ?, location = ?, host_id = ?, qr_code = ?, currency = ?, owner_id = COALESCE(owner_id, ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).run(name, location, hostId, qrCode, currency, ownerId, billId);
      } else {
        this.db.prepare(
          'INSERT INTO bills (id, name, location, host_id, qr_code, currency, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(billId, name, location, hostId, qrCode, currency, ownerId);
      }

      this.db.prepare('DELETE FROM item_assignments WHERE item_id IN (SELECT id FROM items WHERE bill_id = ?)').run(billId);
      this.db.prepare('DELETE FROM people WHERE bill_id = ?').run(billId);
      this.db.prepare('DELETE FROM items WHERE bill_id = ?').run(billId);
      this.db.prepare('DELETE FROM global_charges WHERE bill_id = ?').run(billId);

      const insertPerson = this.db.prepare(
        'INSERT INTO people (id, bill_id, name, sponsor_amount, paid_amount, user_id, email) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      for (const p of people) {
        let pUserId = p.userId || null;
        const pEmail = p.email ? p.email.trim().toLowerCase() : null;

        if (pEmail && !pUserId) {
          const registered = await this.getUserByEmail(pEmail);
          if (registered) {
            pUserId = registered.id;
          }
        }

        if (userId && (p.id === hostId || (!hostId && people.length === 1 && !pUserId && !pEmail))) {
          pUserId = userId;
          if (!pEmail) {
            const u = await this.getUserById(userId);
            if (u) p.email = u.email;
          }
        }

        insertPerson.run(p.id, billId, p.name, Number(p.sponsorAmount || 0), Number(p.paidAmount || 0), pUserId, p.email || null);
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

  async deleteBill(billId: string, userId?: string | null): Promise<boolean> {
    if (userId) {
      const bill = this.db.prepare('SELECT owner_id FROM bills WHERE id = ?').get(billId) as BillRow | undefined;
      if (bill && bill.owner_id && bill.owner_id !== userId) {
        throw new Error('Forbidden: Only the bill owner can delete this bill');
      }
    }
    const res = this.db.prepare('DELETE FROM bills WHERE id = ?').run(billId);
    return Number(res.changes || 0) > 0;
  }

  async listBills(userId?: string | null): Promise<BillSummary[]> {
    if (!userId) {
      return [];
    }

    const u = await this.getUserById(userId);
    const userEmail = u?.email ? u.email.toLowerCase() : '';

    const query = this.db.prepare(`
      SELECT
        b.id,
        b.created_at,
        b.updated_at,
        b.name as custom_name,
        b.location,
        b.owner_id,
        (SELECT name FROM items WHERE bill_id = b.id LIMIT 1) as first_item_name,
        (SELECT COUNT(*) FROM items WHERE bill_id = b.id) as item_count,
        (SELECT COALESCE(SUM(price * quantity), 0) FROM items WHERE bill_id = b.id) as subtotal,
        (SELECT COALESCE(SUM(amount), 0) FROM global_charges WHERE bill_id = b.id AND type = 'fixed') as fixed_extras,
        (SELECT COALESCE(SUM(amount), 0) FROM global_charges WHERE bill_id = b.id AND type = 'percent') as percent_extras
      FROM bills b
      WHERE b.owner_id = ?
         OR EXISTS (
           SELECT 1 FROM people p
           WHERE p.bill_id = b.id
           AND (p.user_id = ? OR (p.email IS NOT NULL AND LOWER(p.email) = ?))
         )
      ORDER BY b.updated_at DESC
    `);

    const bills = query.all(userId, userId, userEmail) as unknown as BillSummaryRow[];

    return bills.map(b => {
      let total = Number(b.subtotal || 0);
      const percentSum = Number(b.percent_extras || 0);
      total += (percentSum / 100) * total;
      total += Number(b.fixed_extras || 0);
      const itemCount = Number(b.item_count || 0);
      const isOwner = b.owner_id === userId;

      return {
        id: String(b.id),
        created_at: typeof b.created_at === 'string' ? b.created_at : new Date(b.created_at).toISOString(),
        updated_at: typeof b.updated_at === 'string' ? b.updated_at : new Date(b.updated_at).toISOString(),
        name: b.custom_name || (b.first_item_name ? b.first_item_name + (itemCount > 1 ? ` & ${itemCount - 1} more` : '') : 'Empty Bill'),
        location: b.location ?? null,
        totalAmount: total,
        owner_id: b.owner_id ? String(b.owner_id) : null,
        role: isOwner ? 'owner' : 'participant',
        is_owner: isOwner,
      };
    });
  }

  async close(): Promise<void> {
    this.db.close();
  }
}

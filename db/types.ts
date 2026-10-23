export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonData {
  id: string;
  name: string;
  sponsorAmount?: number;
  paidAmount?: number;
  userId?: string | null;
  email?: string | null;
}

export interface ItemData {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  assignments?: Record<string, number>;
}

export interface GlobalChargeData {
  id: string;
  name: string;
  type: string;
  amount: number;
}

export interface BillPayload {
  name?: string | null;
  location?: string | null;
  hostId?: string | null;
  qrCode?: string | null;
  currency?: string | null;
  ownerId?: string | null;
  people?: PersonData[];
  items?: ItemData[];
  globalCharges?: GlobalChargeData[];
}

export interface BillDetail {
  id: string;
  owner_id?: string | null;
  role?: 'owner' | 'participant' | 'viewer';
  isReadOnly?: boolean;
  data: {
    name: string | null;
    location: string | null;
    currency?: string | null;
    ownerId?: string | null;
    people: Array<{
      id: string;
      name: string;
      sponsorAmount: number;
      paidAmount: number;
      userId?: string | null;
      email?: string | null;
    }>;
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
      assignments: Record<string, number>;
    }>;
    globalCharges: Array<{
      id: string;
      name: string;
      type: string;
      amount: number;
    }>;
    hostId: string | null;
    qrCode: string | null;
  };
  created_at: string;
  updated_at: string;
}

export interface BillSummary {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  location: string | null;
  totalAmount: number;
  owner_id?: string | null;
  role?: 'owner' | 'participant' | 'viewer';
  is_owner?: boolean;
}

export interface DatabaseAdapter {
  readonly type: 'neon' | 'postgres' | 'sqlite';
  init(): Promise<void>;
  getBill(id: string, userId?: string | null, isShare?: boolean): Promise<BillDetail | null>;
  saveBill(billId: string, data: BillPayload, userId?: string | null): Promise<void>;
  deleteBill?(billId: string, userId?: string | null): Promise<boolean>;
  listBills(userId?: string | null): Promise<BillSummary[]>;
  getUserByEmail?(email: string): Promise<User | null>;
  getUserById?(id: string): Promise<User | null>;
  upsertUser?(user: { id?: string; email: string; name?: string | null; avatar_url?: string | null }): Promise<User>;
  searchUsers?(query: string): Promise<Array<{ id: string; email: string; name: string | null; avatar_url: string | null }>>;
  close?(): Promise<void>;
}

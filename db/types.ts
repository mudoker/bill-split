export interface PersonData {
  id: string;
  name: string;
  sponsorAmount?: number;
  paidAmount?: number;
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
  people?: PersonData[];
  items?: ItemData[];
  globalCharges?: GlobalChargeData[];
}

export interface BillDetail {
  id: string;
  data: {
    name: string | null;
    location: string | null;
    people: Array<{
      id: string;
      name: string;
      sponsorAmount: number;
      paidAmount: number;
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
}

export interface DatabaseAdapter {
  readonly type: 'neon' | 'postgres' | 'sqlite';
  init(): Promise<void>;
  getBill(id: string): Promise<BillDetail | null>;
  saveBill(billId: string, data: BillPayload): Promise<void>;
  listBills(): Promise<BillSummary[]>;
  close?(): Promise<void>;
}

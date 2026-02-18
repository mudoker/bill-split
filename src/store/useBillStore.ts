import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Person {
    id: string;
    name: string;
    sponsorAmount: number;
    paidAmount: number;
}

export interface Item {
    id: string;
    name: string;
    price: number;
    quantity: number;
    assignments: Record<string, number>; // personId -> quantity consumed
}

export interface GlobalCharge {
    id: string;
    name: string;
    amount: number;
    type: 'fixed' | 'percent';
}

export interface BillHistoryItem {
    id: string;
    created_at: string;
    updated_at: string;
    name?: string;
    location?: string;
    totalAmount?: number;
}

interface BillState {
    people: Person[];
    items: Item[];
    globalCharges: GlobalCharge[];
    hostId: string | null;
    isReadOnly: boolean;
    isHydrated: boolean;
    currentBillId: string | null;
    lastSaved: string | null;
    isSaving: boolean;
    billHistory: BillHistoryItem[];
    billName: string;
    location: string;

    // Actions
    setBillName: (name: string) => void;
    setLocation: (location: string) => void;
    addPerson: (name: string) => void;
    updatePerson: (id: string, data: Partial<Person>) => void;
    removePerson: (id: string) => void;

    addItem: (name: string, price: number, quantity?: number) => void;
    updateItem: (id: string, data: Partial<Item>) => void;
    removeItem: (id: string) => void;

    addGlobalCharge: (charge: Omit<GlobalCharge, 'id'>) => void;
    updateGlobalCharge: (id: string, data: Partial<GlobalCharge>) => void;
    removeGlobalCharge: (id: string) => void;

    setHostId: (id: string) => void;
    resetBill: () => void;
    loadState: (data: Partial<BillState>, readonly: boolean) => void;
    setHydrated: (val: boolean) => void;

    // Database actions
    saveToDb: () => Promise<string | null>;
    fetchBill: (id: string) => Promise<void>;
    fetchHistory: () => Promise<void>;
    loadSeedData: () => void;
}

export const useBillStore = create<BillState>()(
    persist(
        (set, get) => ({
            people: [],
            items: [],
            globalCharges: [],
            hostId: null,
            isReadOnly: false,
            isHydrated: false,
            currentBillId: null,
            lastSaved: null,
            isSaving: false,
            billHistory: [],
            billName: '',
            location: '',

            setBillName: (name) => set({ billName: name }),
            setLocation: (location) => set({ location: location }),

            addPerson: (name) =>
                set((state) => ({
                    people: [
                        ...state.people,
                        { id: crypto.randomUUID(), name, sponsorAmount: 0, paidAmount: 0 },
                    ],
                })),

            updatePerson: (id, data) =>
                set((state) => ({
                    people: state.people.map((p) =>
                        p.id === id ? { ...p, ...data } : p
                    ),
                })),

            removePerson: (id) =>
                set((state) => ({
                    people: state.people.filter((p) => p.id !== id),
                    items: state.items.map((item) => {
                        const assignments = item.assignments || {};
                        const newAssignments = { ...assignments };
                        delete newAssignments[id];
                        return {
                            ...item,
                            assignments: newAssignments,
                        };
                    }),
                    hostId: state.hostId === id ? null : state.hostId,
                })),

            addItem: (name, price, quantity = 1) =>
                set((state) => ({
                    items: [
                        ...state.items,
                        { id: crypto.randomUUID(), name, price, quantity, assignments: {} },
                    ],
                })),

            updateItem: (id, data) =>
                set((state) => ({
                    items: state.items.map((item) =>
                        item.id === id ? { ...item, ...data } : item
                    ),
                })),

            removeItem: (id) =>
                set((state) => ({
                    items: state.items.filter((item) => item.id !== id),
                })),

            addGlobalCharge: (charge) =>
                set((state) => ({
                    globalCharges: [...state.globalCharges, { ...charge, id: crypto.randomUUID() }]
                })),

            updateGlobalCharge: (id, data) =>
                set((state) => ({
                    globalCharges: state.globalCharges.map(charge =>
                        charge.id === id ? { ...charge, ...data } : charge
                    )
                })),

            removeGlobalCharge: (id) =>
                set((state) => ({
                    globalCharges: state.globalCharges.filter(charge => charge.id !== id)
                })),

            setHostId: (id) => set({ hostId: id }),

            resetBill: () => set({
                people: [],
                items: [],
                globalCharges: [],
                hostId: null,
                currentBillId: null,
                lastSaved: null,
                isReadOnly: false,
                billName: '',
                location: ''
            }),

            loadState: (data, readonly) => set((state) => ({
                ...state,
                ...data,
                isReadOnly: readonly
            })),

            setHydrated: (val) => set({ isHydrated: val }),

            saveToDb: async () => {
                const state = get();
                if (state.isReadOnly) return null;

                // Don't save empty state
                if (state.people.length === 0 && state.items.length === 0) return null;

                set({ isSaving: true });
                try {
                    const response = await fetch('/api/bills', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: state.currentBillId,
                            data: {
                                name: state.billName,
                                location: state.location,
                                people: state.people,
                                items: state.items,
                                globalCharges: state.globalCharges,
                                hostId: state.hostId
                            }
                        })
                    });

                    const result = await response.json();
                    if (result.id) {
                        set({
                            currentBillId: result.id,
                            lastSaved: new Date().toISOString(),
                        });
                        return result.id;
                    }
                } catch (error) {
                    console.error("Failed to save to database:", error);
                } finally {
                    set({ isSaving: false });
                }
                return null;
            },

            fetchBill: async (id: string) => {
                try {
                    const response = await fetch(`/api/bills/${id}`);
                    if (!response.ok) throw new Error("Bill not found");

                    const result = await response.json();
                    set({
                        ...result.data,
                        billName: result.data.name || '',
                        location: result.data.location || '',
                        currentBillId: result.id,
                        lastSaved: result.updated_at,
                        isReadOnly: false
                    });
                } catch (error) {
                    console.error("Failed to fetch bill:", error);
                }
            },

            fetchHistory: async () => {
                try {
                    const response = await fetch('/api/bills');
                    if (!response.ok) throw new Error("Failed to fetch history");
                    const data = await response.json();
                    set({ billHistory: data });
                } catch (error) {
                    console.error("Failed to fetch history:", error);
                }
            },

            loadSeedData: () => {
                const alexId = crypto.randomUUID();
                const bobId = crypto.randomUUID();
                const charlieId = crypto.randomUUID();
                const davidId = crypto.randomUUID();
                const eveId = crypto.randomUUID();

                set({
                    billName: "Friday Night BBQ @ Gyu-Kaku",
                    location: "District 1, HCMC",
                    hostId: alexId,
                    people: [
                        { id: alexId, name: "Alex (Host)", sponsorAmount: 0, paidAmount: 1800000 },
                        { id: bobId, name: "Bob", sponsorAmount: 0, paidAmount: 200000 },
                        { id: charlieId, name: "Charlie", sponsorAmount: 500000, paidAmount: 0 },
                        { id: davidId, name: "David", sponsorAmount: 0, paidAmount: 0 },
                        { id: eveId, name: "Eve", sponsorAmount: 0, paidAmount: 0 },
                    ],
                    items: [
                        {
                            id: crypto.randomUUID(),
                            name: "Wagyu Party Set",
                            price: 1200000,
                            quantity: 1,
                            assignments: { [alexId]: 1, [bobId]: 1, [charlieId]: 1, [davidId]: 1, [eveId]: 1 }
                        },
                        {
                            id: crypto.randomUUID(),
                            name: "Tiger Beer Tower",
                            price: 450000,
                            quantity: 1,
                            assignments: { [alexId]: 1, [bobId]: 1, [davidId]: 1 }
                        },
                        {
                            id: crypto.randomUUID(),
                            name: "Grilled Corn",
                            price: 120000,
                            quantity: 3,
                            assignments: { [eveId]: 2, [davidId]: 1 }
                        },
                        {
                            id: crypto.randomUUID(),
                            name: "Special Kimchi",
                            price: 80000,
                            quantity: 2,
                            assignments: { [charlieId]: 1, [eveId]: 1 }
                        },
                        {
                            id: crypto.randomUUID(),
                            name: "Mineral Water",
                            price: 60000,
                            quantity: 3,
                            assignments: { [bobId]: 1, [alexId]: 1, [charlieId]: 1 }
                        }
                    ],
                    globalCharges: [
                        { id: crypto.randomUUID(), name: "VAT", amount: 10, type: 'percent' },
                        { id: crypto.randomUUID(), name: "Service Charge", amount: 5, type: 'percent' },
                        { id: crypto.randomUUID(), name: "Evening Discount", amount: 100000, type: 'fixed' }
                    ]
                });
            }
        }),
        {
            name: 'bill-storage',
            partialize: (state) => ({
                people: state.people,
                items: state.items,
                globalCharges: state.globalCharges,
                hostId: state.hostId,
                currentBillId: state.currentBillId,
                billName: state.billName,
                location: state.location,
            }),
            onRehydrateStorage: () => (state) => {
                if (state) state.setHydrated(true);
            },
        }
    )
);


const billId = "DEMO-LARGE-SCALE-SESSION";
const peopleNames = ["Quoc (Host)", "Duong", "Chuong", "Huy", "Alex", "Elena (Corp)", "Marcus", "Sarah", "Tom", "Jerry"];

const people = peopleNames.map(name => ({
    id: crypto.randomUUID(),
    name,
    sponsorAmount: name === "Elena (Corp)" ? 2000000 : 0,
    paidAmount: name === "Quoc (Host)" ? 5000000 : (name === "Alex" ? 1500000 : (name === "Duong" ? 1000000 : 0))
}));

const getPersonId = (name) => people.find(p => p.name === name).id;

const items = [
    {
        id: crypto.randomUUID(),
        name: "Grand Seafood Platter (XL)",
        price: 3500000,
        quantity: 1,
        assignments: Object.fromEntries(people.map(p => [p.id, 1]))
    },
    {
        id: crypto.randomUUID(),
        name: "Wagyu Platter Premium Selection",
        price: 2800000,
        quantity: 1,
        assignments: Object.fromEntries(["Quoc (Host)", "Alex", "Elena (Corp)", "Sarah", "Tom"].map(n => [getPersonId(n), 1]))
    },
    {
        id: crypto.randomUUID(),
        name: "Alaskan King Crab",
        price: 4200000,
        quantity: 1,
        assignments: Object.fromEntries(["Quoc (Host)", "Duong", "Huy", "Marcus"].map(n => [getPersonId(n), 1]))
    },
    {
        id: crypto.randomUUID(),
        name: "Fine Wine Bottle",
        price: 950000,
        quantity: 3,
        assignments: Object.fromEntries(["Quoc (Host)", "Alex", "Elena (Corp)"].map(n => [getPersonId(n), 1]))
    },
    {
        id: crypto.randomUUID(),
        name: "Mineral Water (Still)",
        price: 45000,
        quantity: 12,
        assignments: Object.fromEntries(people.map(p => [p.id, 1]))
    },
    {
        id: crypto.randomUUID(),
        name: "Premium Sides Platter",
        price: 180000,
        quantity: 5,
        assignments: {
            [getPersonId("Chuong")]: 2.5,
            [getPersonId("Jerry")]: 1,
            [getPersonId("Sarah")]: 1.5
        }
    },
    {
        id: crypto.randomUUID(),
        name: "Craft Beer Tower",
        price: 650000,
        quantity: 2,
        assignments: Object.fromEntries(["Duong", "Huy", "Marcus", "Tom"].map(n => [getPersonId(n), 1]))
    }
];

const globalCharges = [
    { id: crypto.randomUUID(), name: "VAT", amount: 10, type: 'percent' },
    { id: crypto.randomUUID(), name: "Service Charge", amount: 5, type: 'percent' },
    { id: crypto.randomUUID(), name: "Corporate Discount", amount: 500000, type: 'fixed' }
];

const payload = {
    id: billId,
    data: {
        name: "Company Offsite Grand Feast",
        location: "Sky Dining @ Landmark 81",
        hostId: getPersonId("Quoc (Host)"),
        people,
        items,
        globalCharges
    }
};

try {
    const response = await fetch('http://127.0.0.1:3001/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const err = await response.text();
        console.error("Server error:", err);
        process.exit(1);
    }

    const result = await response.json();
    console.log("\n--- Sample Bill Created ---");
    console.log("ID:", result.id);
    console.log("Access via: http://localhost:5173/?id=" + result.id);
    console.log("Summary: 10 People, 7 High-value items, Complex Splits, Multiple pre-payments.");
} catch (e) {
    console.error("Network error:", e.message);
}

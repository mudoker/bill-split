import { useBillStore } from "@/store/useBillStore";

export const useBillState = () => {
    const {
        people, items, globalCharges, hostId,
        addPerson, updatePerson, removePerson,
        addItem, updateItem, removeItem,
        addGlobalCharge, updateGlobalCharge, removeGlobalCharge,
        setHostId, resetBill
    } = useBillStore();

    const calculate = () => {
        const rawCosts: Record<string, number> = {};
        let totalItemCost = 0;

        // 1. Calculate base item costs per person based on consumption
        items.forEach((item) => {
            const assignments = item.assignments || {};
            const assignmentEntries = Object.entries(assignments);
            const totalAssignedQty = assignmentEntries.reduce((sum, [_, qty]) => sum + qty, 0);
            const qty = item.quantity || 1;
            const unitPrice = item.price / qty;

            if (assignmentEntries.length > 0) {
                // Charge people for their specific assignments
                assignmentEntries.forEach(([pId, consumedQty]) => {
                    rawCosts[pId] = (rawCosts[pId] || 0) + (unitPrice * consumedQty);
                });

                // If there's an unassigned portion, split it equally among everyone
                const unassignedQty = Math.max(0, qty - totalAssignedQty);
                if (unassignedQty > 0.001) {
                    const unassignedShare = (unitPrice * unassignedQty) / people.length;
                    people.forEach(p => {
                        rawCosts[p.id] = (rawCosts[p.id] || 0) + unassignedShare;
                    });
                }
                totalItemCost += item.price;
            } else {
                // If nobody assigned at all, split full price equally among everyone
                if (people.length > 0) {
                    const share = item.price / people.length;
                    people.forEach((p) => {
                        rawCosts[p.id] = (rawCosts[p.id] || 0) + share;
                    });
                    totalItemCost += item.price;
                }
            }
        });

        // 2. Calculate global charges (tax, service, etc.)
        let totalExtras = 0;
        globalCharges.forEach(charge => {
            if (charge.type === 'percent') {
                totalExtras += (charge.amount / 100) * totalItemCost;
            } else {
                totalExtras += charge.amount;
            }
        });

        // Distribute extras proportionally
        people.forEach((p) => {
            const baseCost = rawCosts[p.id] || 0;
            if (totalItemCost > 0) {
                const ratio = baseCost / totalItemCost;
                rawCosts[p.id] = baseCost + (totalExtras * ratio);
            } else if (people.length > 0) {
                rawCosts[p.id] = totalExtras / people.length;
            }
        });

        // 3. Apply Sponsorship Logic
        const finalPayables: Record<string, number> = {};
        let totalSurplus = 0;
        let totalDeficitAmount = 0;

        people.forEach((p) => {
            const cost = rawCosts[p.id] || 0;
            const sponsor = p.sponsorAmount || 0;
            const diff = cost - sponsor;

            if (diff <= 0) {
                finalPayables[p.id] = 0;
                totalSurplus += Math.abs(diff);
            } else {
                finalPayables[p.id] = diff;
                totalDeficitAmount += diff;
            }
        });

        // Distribute surplus to reduce deficits proportionally
        if (totalSurplus > 0 && totalDeficitAmount > 0) {
            const discountRatio = Math.min(1, totalSurplus / totalDeficitAmount);
            people.forEach(p => {
                if (finalPayables[p.id] > 0) {
                    finalPayables[p.id] -= finalPayables[p.id] * discountRatio;
                }
            });
        }

        return {
            rawCosts,
            finalPayables,
            totalItemCost,
            totalBill: totalItemCost + totalExtras,
            totalExtras,
            totalSurplus
        };
    };

    return {
        people, items, globalCharges, hostId,
        addPerson, updatePerson, removePerson,
        addItem, updateItem, removeItem,
        addGlobalCharge, updateGlobalCharge, removeGlobalCharge,
        setHostId, resetBill,
        calculate
    };
};

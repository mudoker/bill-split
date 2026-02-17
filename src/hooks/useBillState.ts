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
        // ============================================================
        // STEP 1: Calculate BASE item costs per person (before extras)
        // ============================================================
        // rawCosts = what each person owes for the items they consumed ONLY
        // This value is preserved and never mutated after this step.
        const rawCosts: Record<string, number> = {};
        let totalItemCost = 0;

        items.forEach((item) => {
            const assignments = item.assignments || {};
            const assignmentEntries = Object.entries(assignments);
            const totalAssignedQty = assignmentEntries.reduce((sum, [_, qty]) => sum + qty, 0);
            const qty = item.quantity || 1;
            const unitPrice = qty > 0 ? item.price / qty : 0;

            if (assignmentEntries.length > 0) {
                // Always use proportional splitting:
                // Each person's share = (their qty / total claimed qty) * item price
                // This works correctly whether totalAssignedQty >, =, or < qty.
                // - If totalAssignedQty == qty: each person pays unitPrice * theirQty (exact)
                // - If totalAssignedQty > qty: cost is split by ratio (shared dish)
                // - If totalAssignedQty < qty: assigned people pay their share,
                //   and the unclaimed portion is split equally among ALL people.
                if (totalAssignedQty >= qty) {
                    // Proportional: divide the FULL item price among claimants by ratio
                    assignmentEntries.forEach(([pId, consumedQty]) => {
                        const share = (consumedQty / totalAssignedQty) * item.price;
                        rawCosts[pId] = (rawCosts[pId] || 0) + share;
                    });
                } else {
                    // Under-assigned: charge claimed parts at unit price
                    const claimedCost = unitPrice * totalAssignedQty;
                    assignmentEntries.forEach(([pId, consumedQty]) => {
                        rawCosts[pId] = (rawCosts[pId] || 0) + (unitPrice * consumedQty);
                    });

                    // Distribute the unclaimed portion equally among ALL people
                    const unclaimedCost = item.price - claimedCost;
                    if (unclaimedCost > 0.001 && people.length > 0) {
                        const sharePerPerson = unclaimedCost / people.length;
                        people.forEach(p => {
                            rawCosts[p.id] = (rawCosts[p.id] || 0) + sharePerPerson;
                        });
                    }
                }
                totalItemCost += item.price;
            } else {
                // No assignments at all → split full price equally among everyone
                if (people.length > 0) {
                    const share = item.price / people.length;
                    people.forEach((p) => {
                        rawCosts[p.id] = (rawCosts[p.id] || 0) + share;
                    });
                    totalItemCost += item.price;
                }
            }
        });

        // ============================================================
        // STEP 2: Calculate global extras (tax, service charge, etc.)
        // ============================================================
        let totalExtras = 0;
        globalCharges.forEach(charge => {
            if (charge.type === 'percent') {
                totalExtras += (charge.amount / 100) * totalItemCost;
            } else {
                totalExtras += charge.amount;
            }
        });

        // ============================================================
        // STEP 3: Compute each person's TOTAL cost (base + extras)
        // ============================================================
        // Extras are distributed proportionally to each person's base cost.
        // Formula: totalCost[p] = rawCost[p] + extras * (rawCost[p] / sumOfAllRawCosts)
        //
        // We use sumOfAllRawCosts (actual sum) rather than totalItemCost to
        // guarantee that the distributed extras add up perfectly.
        const sumOfAllRawCosts = Object.values(rawCosts).reduce((a, b) => a + b, 0);

        const totalCosts: Record<string, number> = {};
        people.forEach((p) => {
            const baseCost = rawCosts[p.id] || 0;
            if (sumOfAllRawCosts > 0) {
                const ratio = baseCost / sumOfAllRawCosts;
                totalCosts[p.id] = baseCost + (totalExtras * ratio);
            } else if (people.length > 0) {
                // Edge case: no items exist, but there are fixed charges
                totalCosts[p.id] = totalExtras / people.length;
            } else {
                totalCosts[p.id] = 0;
            }
        });

        // ============================================================
        // STEP 4: Apply sponsorship
        // ============================================================
        // A sponsor covers part (or all) of their own bill.
        // If they sponsor MORE than their cost, the surplus reduces
        // what other people owe (proportionally among deficit people).
        const finalPayables: Record<string, number> = {};
        let totalSurplus = 0;
        let totalDeficitAmount = 0;

        people.forEach((p) => {
            const cost = totalCosts[p.id] || 0;
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

        // Distribute surplus proportionally among people who still owe
        if (totalSurplus > 0 && totalDeficitAmount > 0) {
            const discountRatio = Math.min(1, totalSurplus / totalDeficitAmount);
            people.forEach(p => {
                if (finalPayables[p.id] > 0) {
                    finalPayables[p.id] *= (1 - discountRatio);
                }
            });
            // Recalculate remaining surplus after distribution
            totalSurplus = Math.max(0, totalSurplus - totalDeficitAmount);
        }

        return {
            rawCosts,       // Base item costs per person (before extras)
            totalCosts,     // Total costs per person (base + extras, before sponsorship)
            finalPayables,  // What each person actually owes after sponsorship
            totalItemCost,  // Sum of all item prices
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

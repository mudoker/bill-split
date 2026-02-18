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
        const rawCosts: Record<string, number> = {};
        // Total sum of all items in the bill (before extras)
        let totalItemCost = 0;
        // Total unassigned pool to be split among 'active' people later
        let totalUnassignedPrice = 0;
        const activePersonIds = new Set<string>();

        items.forEach((item) => {
            const assignments = item.assignments || {};
            // Only consider people with positive assigned quantities
            const assignmentEntries = Object.entries(assignments).filter(([_, pQty]) => pQty > 0);
            const itemQty = item.quantity || 1;
            const itemPrice = item.price;
            totalItemCost += itemPrice;

            if (assignmentEntries.length > 0) {
                // Mark these people as active participants in the bill
                assignmentEntries.forEach(([pId]) => activePersonIds.add(pId));

                // Each person's individual claim is capped at the total item volume.
                // Overlapping claims are allowed.
                const totalClaimedQty = assignmentEntries.reduce((sum, [_, pQty]) => {
                    return sum + Math.min(pQty, itemQty);
                }, 0);

                if (totalClaimedQty >= itemQty) {
                    // Exact or Over-assigned: Split the full price proportionally among claimants.
                    // This handles overlapping people sharing the same item.
                    assignmentEntries.forEach(([pId, pQty]) => {
                        const cappedPQty = Math.min(pQty, itemQty);
                        const share = (cappedPQty / totalClaimedQty) * itemPrice;
                        rawCosts[pId] = (rawCosts[pId] || 0) + share;
                    });
                } else {
                    // Under-assigned: People pay exactly for what they claimed.
                    // The rest goes to the unassigned pool.
                    let totalAccountedFor = 0;
                    assignmentEntries.forEach(([pId, pQty]) => {
                        const cappedPQty = Math.min(pQty, itemQty);
                        const share = (cappedPQty / itemQty) * itemPrice;
                        rawCosts[pId] = (rawCosts[pId] || 0) + share;
                        totalAccountedFor += share;
                    });
                    totalUnassignedPrice += Math.max(0, itemPrice - totalAccountedFor);
                }
            } else {
                // Item has no assignments at all - full price goes to unassigned pool.
                totalUnassignedPrice += itemPrice;
            }
        });

        // Determine who is "active" (accounted for).
        // Default to everyone if no one has any assignments yet.
        const effectiveSplitterIds = activePersonIds.size > 0
            ? Array.from(activePersonIds)
            : people.map(p => p.id);

        // Distribute the unassigned costs (items and partial remainders) among active people only.
        if (totalUnassignedPrice > 0.01 && effectiveSplitterIds.length > 0) {
            const sharedShare = totalUnassignedPrice / effectiveSplitterIds.length;
            effectiveSplitterIds.forEach(id => {
                rawCosts[id] = (rawCosts[id] || 0) + sharedShare;
            });
        }

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
        const sumOfAllRawCosts = Object.values(rawCosts).reduce((a, b) => a + b, 0);

        const totalCosts: Record<string, number> = {};
        people.forEach((p) => {
            const baseCost = rawCosts[p.id] || 0;
            if (sumOfAllRawCosts > 0) {
                const ratio = baseCost / sumOfAllRawCosts;
                totalCosts[p.id] = baseCost + (totalExtras * ratio);
            } else if (effectiveSplitterIds.length > 0) {
                // Edge case: extras exist but no items assigned yet.
                // Split only among effective splitters (active people).
                if (effectiveSplitterIds.includes(p.id)) {
                    totalCosts[p.id] = totalExtras / effectiveSplitterIds.length;
                } else {
                    totalCosts[p.id] = 0;
                }
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

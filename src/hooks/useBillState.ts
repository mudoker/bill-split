import { useBillStore } from "@/store/useBillStore";

export const useBillState = () => {
    const {
        people, items, globalCharges, hostId,
        addPerson, updatePerson, removePerson,
        addItem, updateItem, removeItem,
        addGlobalCharge, updateGlobalCharge, removeGlobalCharge,
        setHostId, resetBill, isReadOnly,
        currentBillId, lastSaved, isSaving, billHistory,
        billName, location, setBillName, setLocation, loadSeedData,
        saveToDb, fetchBill, fetchHistory
    } = useBillStore();

    const calculate = () => {
        // STEP 1: Calculate BASE item costs per person (before extras)
        const rawCosts: Record<string, number> = {};
        let totalItemCost = 0;
        let totalUnassignedPrice = 0;
        const activePersonIds = new Set<string>();

        items.forEach((item) => {
            const assignments = item.assignments || {};
            const assignmentEntries = Object.entries(assignments).filter(([_, pQty]) => pQty > 0);
            const itemQty = item.quantity || 1;
            const itemPrice = item.price;
            totalItemCost += itemPrice;

            if (assignmentEntries.length > 0) {
                assignmentEntries.forEach(([pId]) => activePersonIds.add(pId));
                const totalClaimedQty = assignmentEntries.reduce((sum, [_, pQty]) => {
                    return sum + Math.min(pQty, itemQty);
                }, 0);

                if (totalClaimedQty >= itemQty) {
                    assignmentEntries.forEach(([pId, pQty]) => {
                        const cappedPQty = Math.min(pQty, itemQty);
                        const share = (cappedPQty / totalClaimedQty) * itemPrice;
                        rawCosts[pId] = (rawCosts[pId] || 0) + share;
                    });
                } else {
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
                totalUnassignedPrice += itemPrice;
            }
        });

        const effectiveSplitterIds = activePersonIds.size > 0
            ? Array.from(activePersonIds)
            : people.map(p => p.id);

        if (totalUnassignedPrice > 0.01 && effectiveSplitterIds.length > 0) {
            const sharedShare = totalUnassignedPrice / effectiveSplitterIds.length;
            effectiveSplitterIds.forEach(id => {
                rawCosts[id] = (rawCosts[id] || 0) + sharedShare;
            });
        }

        let totalExtras = 0;
        globalCharges.forEach(charge => {
            if (charge.type === 'percent') {
                totalExtras += (charge.amount / 100) * totalItemCost;
            } else {
                totalExtras += charge.amount;
            }
        });

        const sumOfAllRawCosts = Object.values(rawCosts).reduce((a, b) => a + b, 0);

        const totalCosts: Record<string, number> = {};
        people.forEach((p) => {
            const baseCost = rawCosts[p.id] || 0;
            if (sumOfAllRawCosts > 0) {
                const ratio = baseCost / sumOfAllRawCosts;
                totalCosts[p.id] = baseCost + (totalExtras * ratio);
            } else if (effectiveSplitterIds.length > 0) {
                if (effectiveSplitterIds.includes(p.id)) {
                    totalCosts[p.id] = totalExtras / effectiveSplitterIds.length;
                } else {
                    totalCosts[p.id] = 0;
                }
            } else {
                totalCosts[p.id] = 0;
            }
        });

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

        if (totalSurplus > 0 && totalDeficitAmount > 0) {
            const discountRatio = Math.min(1, totalSurplus / totalDeficitAmount);
            people.forEach(p => {
                if (finalPayables[p.id] > 0) {
                    finalPayables[p.id] *= (1 - discountRatio);
                }
            });
            totalSurplus = Math.max(0, totalSurplus - totalDeficitAmount);
        }

        // STEP 4: Net Settlement Calculation (Multi-creditor support)
        // If paidAmount is specified, we use it. Otherwise we assume hostId paid everything.
        const totalPaidInBill = people.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
        const assumesHost = totalPaidInBill < 0.01; // If no one paid anything, assume host paid total bill

        const settlementBalances: Record<string, number> = {};
        people.forEach(p => {
            const payRecord = finalPayables[p.id] || 0;
            // A person's 'net debt' is what they SHOULD pay (after sponsorship/surplus)
            // minus what they ACTUALLY paid.
            let actuallyPaid = p.paidAmount || 0;
            if (assumesHost && p.id === hostId) actuallyPaid = totalItemCost + totalExtras;

            settlementBalances[p.id] = actuallyPaid - payRecord;
            if (payRecord === 0 && (p.sponsorAmount || 0) > 0) {
                // Sponsors who over-sponsored (cost < sponsor) have payRecord = 0.
                // Their 'paid' is essentially cost + sponsor (but they didn't really 'pay' it at table, they sponsored it).
                // Actually if they sponsored more than their cost, they contributed to others.
                // The surplus is already redistributed.
            }
        });

        const flows: Array<{ from: string, to: string, amount: number }> = [];
        const debtors = people.map(p => ({ id: p.id, balance: settlementBalances[p.id] })).filter(x => x.balance < -0.01);
        const creditors = people.map(p => ({ id: p.id, balance: settlementBalances[p.id] })).filter(x => x.balance > 0.01);

        // Simple greedy matching for settlement
        const d_list = [...debtors];
        const c_list = [...creditors];

        let d_idx = 0;
        let c_idx = 0;

        while (d_idx < d_list.length && c_idx < c_list.length) {
            const d = d_list[d_idx];
            const c = c_list[c_idx];
            const amount = Math.min(Math.abs(d.balance), c.balance);

            flows.push({ from: d.id, to: c.id, amount });

            d.balance += amount;
            c.balance -= amount;

            if (Math.abs(d.balance) < 0.01) d_idx++;
            if (c.balance < 0.01) c_idx++;
        }

        return {
            rawCosts,
            totalCosts,
            finalPayables,
            totalItemCost,
            totalBill: totalItemCost + totalExtras,
            totalExtras,
            totalSurplus,
            settlementFlows: flows
        };
    };

    return {
        people, items, globalCharges, hostId,
        addPerson, updatePerson, removePerson,
        addItem, updateItem, removeItem,
        addGlobalCharge, updateGlobalCharge, removeGlobalCharge,
        setHostId, resetBill,
        isReadOnly, currentBillId, lastSaved, isSaving, billHistory,
        billName, location, setBillName, setLocation, loadSeedData,
        saveToDb, fetchBill, fetchHistory,
        calculate
    };
};

import { useBillStore } from "@/store/useBillStore";

    const {
        people, items, globalCharges, hostId, qrCode,
        addPerson, updatePerson, removePerson,
        addItem, updateItem, removeItem,
        addGlobalCharge, updateGlobalCharge, removeGlobalCharge,
        setHostId, setQrCode, resetBill, isReadOnly,
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
        const totalBill = totalItemCost + totalExtras;
        let discrepancy = 0;

        // Determine effective paid amounts
        const effectivePaidAmounts: Record<string, number> = {};
        let totalPaidInBill = 0;

        // Calculate total paid by everyone EXCEPT host
        let othersPaid = 0;
        people.forEach(p => {
            if (p.id !== hostId) {
                othersPaid += (p.paidAmount || 0);
            }
        });

        // Determine Host's effective paid amount
        people.forEach(p => {
            if (p.id === hostId) {
                // SIMPLIFIED LOGIC (User Request):
                // We assume the Host pays the remaining bill amount, regardless of what input they may have entered.
                // This prevents discrepancies and assumes the Host covers the table.
                // Host Payment = Total Bill - (Sum of what everyone else paid)
                effectivePaidAmounts[p.id] = Math.max(0, totalBill - othersPaid);
            } else {
                effectivePaidAmounts[p.id] = p.paidAmount || 0;
            }
            totalPaidInBill += effectivePaidAmounts[p.id];
        });

        // Check for discrepancy
        // Target: SUM of FINAL PAYABLES (e.g. 12M).
        // Actual Paid: Total Bill (e.g. 14M, because Host covers all).
        // Difference: 2M (The Sponsored Amount).
        // This 'Surplus' is not real cash surplus, it's the unrecoverable sponsorship cost the Host paid.
        // To balance the settlement (Credits == Debts), we must deduct this from the Host's "Recoverable" payment.

        const totalNetPayable = Object.values(finalPayables).reduce((acc, val) => acc + val, 0);
        discrepancy = totalPaidInBill - totalNetPayable;

        // Auto-correct Sponsorship Surplus
        if (discrepancy > 0.01 && hostId) {
            // If we have a surplus, and it matches the sponsorship amount approx?
            // Actually, simplest rule: If Host paid extra, and that extra matches the "Sponsorship gap",
            // we reduce Host's effective paid so they don't expect to be paid back for the sponsored items.
            effectivePaidAmounts[hostId] -= discrepancy;
            discrepancy = 0; // Clear the error flag
        }



        const settlementBalances: Record<string, number> = {};
        people.forEach(p => {
            // Net Payable is what they occupy in cost (after surplus discount).
            // A person's 'Balance' = What they Paid - What they Owe.
            // +ve Balance = They Paid MORE than they Owe => Creditor (Receive money)
            // -ve Balance = They Paid LESS than they Owe => Debtor (Pay money)
            const whatTheyOwe = finalPayables[p.id] || 0;
            const whatTheyPaid = effectivePaidAmounts[p.id] || 0;

            settlementBalances[p.id] = whatTheyPaid - whatTheyOwe;
        });

        const flows: Array<{ from: string, to: string, amount: number }> = [];
        // Filter out balances that are effectively 0
        // HUB AND SPOKE MODEL (User Request):
        // Everyone settles with the Host directly.
        // - If you owe money (Balance < 0), you pay the Host.
        // - If you are owed money (Balance > 0), the Host pays you.
        // This simplifies the flow and avoids confusing peer-to-peer transfers (e.g. Jerry paying Alex).

        people.forEach(p => {
            if (p.id === hostId) return; // Skip Host (they are the hub)

            const balance = settlementBalances[p.id] || 0;

            if (balance < -0.01) {
                // Debtor: Pays Host
                flows.push({ from: p.id, to: hostId!, amount: Math.abs(balance) });
            } else if (balance > 0.01) {
                // Creditor: Receives from Host
                flows.push({ from: hostId!, to: p.id, amount: balance });
            }
        });

        return {
            rawCosts,
            totalCosts,
            finalPayables,
            totalItemCost,
            totalBill,
            totalExtras,
            totalSurplus,
            discrepancy,
            settlementFlows: flows
        };
    };

    return {
        people, items, globalCharges, hostId,
        addPerson, updatePerson, removePerson,
        addItem, updateItem, removeItem,
        addGlobalCharge, updateGlobalCharge, removeGlobalCharge,
        setHostId, setQrCode, resetBill,
        isReadOnly, currentBillId, lastSaved, isSaving, billHistory,
        billName, location, setBillName, setLocation, loadSeedData,
        saveToDb, fetchBill, fetchHistory, qrCode,
        calculate
    };
};

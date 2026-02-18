/**
 * Serializes the bill state to a URL-safe string.
 */
export function serializeState(state: any): string {
    const data = {
        p: state.people.map((p: any) => [p.id, p.name, p.sponsorAmount]),
        i: state.items.map((i: any) => [i.id, i.name, i.price, i.quantity, i.assignments]),
        g: state.globalCharges.map((g: any) => [g.id, g.name, g.amount, g.type]),
        h: state.hostId
    };

    const json = JSON.stringify(data);
    // Use btoa + encodeURIComponent for a somewhat compact URL-safe representation
    return btoa(unescape(encodeURIComponent(json)));
}

/**
 * Deserializes the bill state from a URL-safe string.
 */
export function deserializeState(encoded: string): any {
    try {
        const json = decodeURIComponent(escape(atob(encoded)));
        const data = JSON.parse(json);

        return {
            people: data.p.map((p: any) => ({ id: p[0], name: p[1], sponsorAmount: p[2] })),
            items: data.i.map((i: any) => ({ id: i[0], name: i[1], price: i[2], quantity: i[3], assignments: i[4] })),
            globalCharges: data.g.map((g: any) => ({ id: g[0], name: g[1], amount: g[2], type: g[3] })),
            hostId: data.h
        };
    } catch (e) {
        console.error("Failed to deserialize state:", e);
        return null;
    }
}

/**
 * Generates a sharable link for the current state.
 */
export function generateShareUrl(state: any, readOnly: boolean = true): string {
    const url = new URL(window.location.origin);

    // If we have a database ID, prefer it for a much cleaner URL
    if (state.currentBillId && !readOnly) {
        url.searchParams.set('id', state.currentBillId);
        return url.toString();
    }

    // Fallback to serialized state (legacy/offline support)
    const serialized = serializeState(state);
    url.searchParams.set(readOnly ? 'v' : 'e', serialized);
    return url.toString();
}

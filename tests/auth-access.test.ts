import { describe, expect, it } from 'bun:test';
import { useAuthStore } from '../src/store/useAuthStore';
import { useBillStore } from '../src/store/useBillStore';

describe('Auth Access Guards', () => {
    it('blocks resume access when user is not logged in even if local bill data exists', () => {
        useAuthStore.setState({ user: null });
        useBillStore.setState({
            people: [{ id: '1', name: 'Alex', sponsorAmount: 0, paidAmount: 0 }],
            items: [{ id: '1', name: 'Coffee', price: 50000, quantity: 1, assignments: {} }],
        });

        const authState = useAuthStore.getState();
        const billState = useBillStore.getState();

        const canResume = Boolean(authState.user) && (billState.people.length > 0 || billState.items.length > 0);
        expect(canResume).toBe(false);
    });

    it('allows resume access when user is logged in and active bill data exists', () => {
        useAuthStore.setState({
            user: {
                id: 'user_123',
                email: 'test@example.com',
                name: 'Test User',
                avatar_url: null,
            },
        });
        useBillStore.setState({
            people: [{ id: '1', name: 'Alex', sponsorAmount: 0, paidAmount: 0 }],
            items: [{ id: '1', name: 'Coffee', price: 50000, quantity: 1, assignments: {} }],
        });

        const authState = useAuthStore.getState();
        const billState = useBillStore.getState();

        const canResume = Boolean(authState.user) && (billState.people.length > 0 || billState.items.length > 0);
        expect(canResume).toBe(true);
    });

    it('blocks resume access when user is logged in but no bill data exists', () => {
        useAuthStore.setState({
            user: {
                id: 'user_123',
                email: 'test@example.com',
                name: 'Test User',
                avatar_url: null,
            },
        });
        useBillStore.setState({
            people: [],
            items: [],
        });

        const authState = useAuthStore.getState();
        const billState = useBillStore.getState();

        const canResume = Boolean(authState.user) && (billState.people.length > 0 || billState.items.length > 0);
        expect(canResume).toBe(false);
    });
});

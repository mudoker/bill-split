import { describe, expect, it } from 'bun:test';
import { getInitials, getAvatarColor } from '../src/constants/colors';
import { formatVndRate, formatVndRateCompact, fetchVndRates, EIGHT_HOURS_MS } from '../src/lib/currency';

describe('Participants Formatting & Avatars', () => {
    it('cleans brackets and special symbols from initials', () => {
        expect(getInitials('Alex (Host)')).toBe('AH');
        expect(getInitials('Elena (Corp)')).toBe('EC');
        expect(getInitials('Quoc (Host)')).toBe('QH');
        expect(getInitials('David')).toBe('DA');
        expect(getInitials('Bob')).toBe('BO');
        expect(getInitials('A')).toBe('A');
        expect(getInitials('')).toBe('?');
    });

    it('returns a deterministic gradient avatar', () => {
        const color1 = getAvatarColor('Alex');
        const color2 = getAvatarColor('Alex');
        expect(color1).toBe(color2);
        expect(color1).toContain('from-');
        expect(color1).toContain('to-');
    });
});

describe('Currency Rates against VND & Caching', () => {
    it('formats VND rates correctly with Vietnamese number formatting', () => {
        expect(formatVndRate(25808.64)).toBe('25.809 ₫');
        expect(formatVndRate(164.12)).toBe('164,1 ₫');
        expect(formatVndRate(19.48)).toBe('19,5 ₫');
        expect(formatVndRate(1)).toBe('1,00 ₫');
    });

    it('formats compact VND rates for quick chips', () => {
        expect(formatVndRateCompact(25808.64)).toBe('25.8k ₫');
        expect(formatVndRateCompact(164.12)).toBe('164.1 ₫');
    });

    it('has 8 hour cache constant', () => {
        expect(EIGHT_HOURS_MS).toBe(8 * 60 * 60 * 1000);
    });

    it('fetches exchange rates relative to VND', async () => {
        const result = await fetchVndRates(false);
        expect(result).toBeDefined();
        expect(result.rates).toBeDefined();
        expect(result.rates.VND).toBe(1);
        expect(result.rates.USD).toBeGreaterThan(20000);
        expect(result.retrievedAt).toBeGreaterThan(0);
    });
});

import { useBillStore, type CurrencyCode } from "@/store/useBillStore";

export const getActiveCurrency = (currency?: CurrencyCode): CurrencyCode => {
    if (currency) return currency;
    try {
        return useBillStore.getState()?.currency || 'VND';
    } catch {
        return 'VND';
    }
};

export const formatCurrency = (amount: number, currency?: CurrencyCode): string => {
    const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    const curr = getActiveCurrency(currency);

    if (curr === 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(safeAmount);
    }

    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(safeAmount);
};

export const formatNumber = (amount: number, currency?: CurrencyCode): string => {
    const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    const curr = getActiveCurrency(currency);

    if (curr === 'USD') {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: safeAmount % 1 === 0 ? 0 : 2,
            maximumFractionDigits: 2,
        }).format(safeAmount);
    }

    return new Intl.NumberFormat('vi-VN').format(safeAmount);
};

/** Parse a formatted string back to number */
export const parseFormattedNumber = (str: string): number => {
    const cleaned = str.replace(/[^\d.-]/g, '');
    return parseFloat(cleaned) || 0;
};

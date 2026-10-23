import { useBillStore } from "@/store/useBillStore";
import { getCurrencyDecimals, getCurrencyLocale } from "@/lib/currency";

export const getActiveCurrency = (currency?: string): string => {
    if (currency) return currency;
    try {
        return useBillStore.getState()?.currency || 'VND';
    } catch {
        return 'VND';
    }
};

export const formatCurrency = (amount: number, currency?: string): string => {
    const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    const curr = getActiveCurrency(currency).toUpperCase();
    const decimals = getCurrencyDecimals(curr);
    const locale = getCurrencyLocale(curr);

    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: curr,
            minimumFractionDigits: decimals === 0 ? 0 : 2,
            maximumFractionDigits: decimals,
        }).format(safeAmount);
    } catch {
        // Fallback formatting if Intl does not support currency code
        return `${safeAmount.toLocaleString(locale, { maximumFractionDigits: decimals })} ${curr}`;
    }
};

export const formatNumber = (amount: number, currency?: string): string => {
    const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    const curr = getActiveCurrency(currency).toUpperCase();
    const decimals = getCurrencyDecimals(curr);
    const locale = getCurrencyLocale(curr);

    try {
        return new Intl.NumberFormat(locale, {
            minimumFractionDigits: safeAmount % 1 === 0 ? 0 : Math.min(2, decimals),
            maximumFractionDigits: decimals,
        }).format(safeAmount);
    } catch {
        return safeAmount.toString();
    }
};

/** Parse a formatted string back to number */
export const parseFormattedNumber = (str: string): number => {
    const cleaned = str.replace(/[^\d.-]/g, '');
    return parseFloat(cleaned) || 0;
};

import { useQuery } from '@tanstack/react-query';

export interface CurrencyInfo {
    code: string;
    name: string;
    symbol: string;
    countryCode: string;
    decimals: number;
}

export const CURRENCY_COUNTRY_MAP: Record<string, string> = {
    EUR: 'EU',
    USD: 'US',
    GBP: 'GB',
    VND: 'VN',
    JPY: 'JP',
    SGD: 'SG',
    THB: 'TH',
    AUD: 'AU',
    CAD: 'CA',
    CHF: 'CH',
    CNY: 'CN',
    KRW: 'KR',
    HKD: 'HK',
    TWD: 'TW',
    MYR: 'MY',
    IDR: 'ID',
    PHP: 'PH',
    INR: 'IN',
    NZD: 'NZ',
    AED: 'AE',
    SAR: 'SA',
    SEK: 'SE',
    NOK: 'NO',
    DKK: 'DK',
    PLN: 'PL',
    TRY: 'TR',
    BRL: 'BR',
    MXN: 'MX',
    ZAR: 'ZA',
    ILS: 'IL',
    ANG: 'CW',
    XOF: 'SN',
    XAF: 'CM',
    XCD: 'AG',
};

export const ZERO_DECIMAL_CURRENCIES = new Set([
    'VND', 'JPY', 'KRW', 'IDR', 'TWD', 'HUF', 'CLP', 'PYG', 'UGX', 'VUV', 'RWF', 'BIF', 'GNF', 'KMF'
]);

export const POPULAR_CURRENCIES: CurrencyInfo[] = [
    { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', countryCode: 'VN', decimals: 0 },
    { code: 'USD', name: 'US Dollar', symbol: '$', countryCode: 'US', decimals: 2 },
    { code: 'EUR', name: 'Euro', symbol: '€', countryCode: 'EU', decimals: 2 },
    { code: 'GBP', name: 'British Pound', symbol: '£', countryCode: 'GB', decimals: 2 },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', countryCode: 'JP', decimals: 0 },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', countryCode: 'SG', decimals: 2 },
    { code: 'THB', name: 'Thai Baht', symbol: '฿', countryCode: 'TH', decimals: 2 },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', countryCode: 'AU', decimals: 2 },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', countryCode: 'CA', decimals: 2 },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', countryCode: 'CH', decimals: 2 },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', countryCode: 'CN', decimals: 2 },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩', countryCode: 'KR', decimals: 0 },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', countryCode: 'HK', decimals: 2 },
    { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$', countryCode: 'TW', decimals: 0 },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', countryCode: 'MY', decimals: 2 },
    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', countryCode: 'ID', decimals: 0 },
    { code: 'PHP', name: 'Philippine Peso', symbol: '₱', countryCode: 'PH', decimals: 2 },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', countryCode: 'IN', decimals: 2 },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', countryCode: 'NZ', decimals: 2 },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', countryCode: 'AE', decimals: 2 },
    { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', countryCode: 'SA', decimals: 2 },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', countryCode: 'SE', decimals: 2 },
    { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', countryCode: 'NO', decimals: 2 },
    { code: 'DKK', name: 'Danish Krone', symbol: 'kr', countryCode: 'DK', decimals: 2 },
    { code: 'PLN', name: 'Polish Złoty', symbol: 'zł', countryCode: 'PL', decimals: 2 },
    { code: 'TRY', name: 'Turkish Lira', symbol: '₺', countryCode: 'TR', decimals: 2 },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', countryCode: 'BR', decimals: 2 },
    { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$', countryCode: 'MX', decimals: 2 },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R', countryCode: 'ZA', decimals: 2 },
];

const STATIC_FALLBACK_RATES: Record<string, number> = {
    'USD_VND': 25814,
    'VND_USD': 1 / 25814,
    'EUR_USD': 1.085,
    'USD_EUR': 1 / 1.085,
    'GBP_USD': 1.30,
    'USD_GBP': 1 / 1.30,
    'USD_JPY': 152.0,
    'JPY_USD': 1 / 152.0,
    'USD_SGD': 1.32,
    'SGD_USD': 1 / 1.32,
    'USD_THB': 33.5,
    'THB_USD': 1 / 33.5,
    'USD_AUD': 1.50,
    'AUD_USD': 1 / 1.50,
    'USD_CAD': 1.38,
    'CAD_USD': 1 / 1.38,
    'USD_CHF': 0.86,
    'CHF_USD': 1 / 0.86,
    'USD_CNY': 7.12,
    'CNY_USD': 1 / 7.12,
    'USD_KRW': 1380,
    'KRW_USD': 1 / 1380,
};

export const getCountryCodeForCurrency = (currencyCode: string): string => {
    const code = currencyCode.toUpperCase();
    if (CURRENCY_COUNTRY_MAP[code]) return CURRENCY_COUNTRY_MAP[code];
    return code.slice(0, 2);
};

export const getCurrencyDecimals = (currencyCode: string): number => {
    return ZERO_DECIMAL_CURRENCIES.has(currencyCode.toUpperCase()) ? 0 : 2;
};

export const getCurrencySymbol = (currencyCode: string): string => {
    const found = POPULAR_CURRENCIES.find(c => c.code === currencyCode.toUpperCase());
    if (found?.symbol) return found.symbol;
    try {
        const parts = new Intl.NumberFormat('en', { style: 'currency', currency: currencyCode }).formatToParts(1);
        const currPart = parts.find(p => p.type === 'currency');
        return currPart?.value || currencyCode;
    } catch {
        return currencyCode;
    }
};

export const getCurrencyLocale = (currencyCode: string): string => {
    const code = currencyCode.toUpperCase();
    switch (code) {
        case 'VND': return 'vi-VN';
        case 'JPY': return 'ja-JP';
        case 'KRW': return 'ko-KR';
        case 'CNY': return 'zh-CN';
        case 'THB': return 'th-TH';
        case 'IDR': return 'id-ID';
        case 'EUR': return 'de-DE';
        case 'GBP': return 'en-GB';
        default: return 'en-US';
    }
};

export const getCurrencyInfo = (currencyCode: string): CurrencyInfo => {
    const code = currencyCode.toUpperCase();
    const found = POPULAR_CURRENCIES.find(c => c.code === code);
    if (found) return found;

    return {
        code,
        name: code,
        symbol: getCurrencySymbol(code),
        countryCode: getCountryCodeForCurrency(code),
        decimals: getCurrencyDecimals(code),
    };
};

const FRANKFURTER_BASE_URL = 'https://api.frankfurter.dev/v2';
export const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;
const ONE_HOUR_MS = EIGHT_HOURS_MS; // Backwards compatible alias, now 8 hours cache
const VND_RATES_CACHE_KEY = 'fx_rates_vnd_catalogue_v2';

export interface VndRatesResult {
    rates: Record<string, number>; // code -> VND amount per 1 unit
    retrievedAt: number; // timestamp in ms
    dateString?: string;
}

export function formatVndRate(rate: number | undefined): string {
    if (!rate || isNaN(rate)) return '';
    if (rate >= 1000) {
        return Math.round(rate).toLocaleString('vi-VN') + ' ₫';
    }
    if (rate >= 10) {
        return rate.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' ₫';
    }
    if (rate >= 1) {
        return rate.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₫';
    }
    return rate.toLocaleString('vi-VN', { minimumFractionDigits: 3, maximumFractionDigits: 4 }) + ' ₫';
}

export function formatVndRateCompact(rate: number | undefined): string {
    if (!rate || isNaN(rate)) return '';
    if (rate >= 1_000_000) {
        return (rate / 1_000_000).toFixed(1) + 'M ₫';
    }
    if (rate >= 1_000) {
        return (rate / 1_000).toFixed(1) + 'k ₫';
    }
    if (rate >= 1) {
        return rate.toFixed(1) + ' ₫';
    }
    return rate.toFixed(2) + ' ₫';
}

export async function fetchVndRates(forceRefresh = false): Promise<VndRatesResult> {
    if (!forceRefresh && typeof window !== 'undefined') {
        try {
            const raw = localStorage.getItem(VND_RATES_CACHE_KEY);
            if (raw) {
                const parsed: VndRatesResult = JSON.parse(raw);
                if (
                    parsed &&
                    typeof parsed.retrievedAt === 'number' &&
                    Date.now() - parsed.retrievedAt < EIGHT_HOURS_MS &&
                    parsed.rates &&
                    Object.keys(parsed.rates).length > 0
                ) {
                    return parsed;
                }
            }
        } catch {
            // ignore
        }
    }

    const fallbackRates: Record<string, number> = {
        VND: 1,
        USD: 25814,
        EUR: 28965,
        GBP: 34560,
        JPY: 164.1,
        SGD: 20206,
        THB: 765.7,
        AUD: 17200,
        CAD: 18700,
        CHF: 30000,
        CNY: 3625,
        KRW: 19.5,
        HKD: 3310,
        TWD: 800,
        MYR: 5900,
        IDR: 1.6,
        PHP: 450,
        INR: 305,
        NZD: 15600,
        AED: 7020,
        SAR: 6880,
    };

    try {
        const res = await fetch(`${FRANKFURTER_BASE_URL}/rates`);
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
                const eurToVndItem = data.find((r: any) => (r.quote || '').toUpperCase() === 'VND');
                const eurToVnd = eurToVndItem ? Number(eurToVndItem.rate) : 28965;
                const rates: Record<string, number> = {
                    VND: 1,
                    EUR: eurToVnd,
                };

                for (const item of data) {
                    const quote = (item.quote || '').toUpperCase();
                    const eurToQuote = Number(item.rate);
                    if (quote && eurToQuote > 0) {
                        rates[quote] = eurToVnd / eurToQuote;
                    }
                }

                // Add fallback rates for any missing
                Object.entries(fallbackRates).forEach(([code, rate]) => {
                    if (!rates[code]) rates[code] = rate;
                });

                const result: VndRatesResult = {
                    rates,
                    retrievedAt: Date.now(),
                    dateString: eurToVndItem?.date || new Date().toISOString().slice(0, 10),
                };

                if (typeof window !== 'undefined') {
                    try {
                        localStorage.setItem(VND_RATES_CACHE_KEY, JSON.stringify(result));
                    } catch {
                        // ignore
                    }
                }

                return result;
            }
        }
    } catch (e) {
        console.warn('[Currency] Failed to fetch rates relative to VND:', e);
    }

    // Fallback to existing stale cache if present
    if (typeof window !== 'undefined') {
        try {
            const raw = localStorage.getItem(VND_RATES_CACHE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.rates) return parsed;
            }
        } catch {
            // ignore
        }
    }

    return {
        rates: fallbackRates,
        retrievedAt: Date.now(),
        dateString: new Date().toISOString().slice(0, 10),
    };
}

export function useVndRates() {
    return useQuery({
        queryKey: ['fx_vnd_rates'],
        queryFn: () => fetchVndRates(false),
        staleTime: EIGHT_HOURS_MS,
        gcTime: EIGHT_HOURS_MS,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });
}

interface CachedRate {
    rate: number;
    timestamp: number;
    date?: string;
}

const getRateCacheKey = (base: string, quote: string) => `fx_rate_${base.toUpperCase()}_${quote.toUpperCase()}`;

const getCachedRate = (base: string, quote: string): CachedRate | null => {
    try {
        const raw = localStorage.getItem(getRateCacheKey(base, quote));
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

const setCachedRate = (base: string, quote: string, rate: number, date?: string) => {
    try {
        const entry: CachedRate = {
            rate,
            timestamp: Date.now(),
            date,
        };
        localStorage.setItem(getRateCacheKey(base, quote), JSON.stringify(entry));
    } catch {
        // localStorage full or unavailable
    }
};

/**
 * Fetch foreign exchange rate between base and quote currencies using Frankfurter v2 API.
 * Includes multi-tier fallback:
 * 1. Latest rate from https://api.frankfurter.dev/v2/rate/{base}/{quote}
 * 2. Date fallback queries (yesterday, day before, up to 4 days back for weekends/holidays)
 * 3. Inverse rate calculation (1 / quote->base)
 * 4. LocalStorage cache (regardless of age)
 * 5. Static baseline rates table
 */
export async function fetchExchangeRate(base: string, quote: string): Promise<number> {
    const b = base.toUpperCase();
    const q = quote.toUpperCase();

    if (b === q) return 1.0;

    // Check recent cache (< 1 hour old)
    const cached = getCachedRate(b, q);
    if (cached && Date.now() - cached.timestamp < ONE_HOUR_MS && typeof cached.rate === 'number') {
        return cached.rate;
    }

    // Attempt 1: Latest rate without date param
    try {
        const res = await fetch(`${FRANKFURTER_BASE_URL}/rate/${b}/${q}`);
        if (res.ok) {
            const data = await res.json();
            if (typeof data.rate === 'number' && data.rate > 0) {
                setCachedRate(b, q, data.rate, data.date);
                return data.rate;
            }
        }
    } catch (e) {
        console.warn(`[Currency] Latest rate fetch failed for ${b}->${q}:`, e);
    }

    // Attempt 2: Date fallback queries (stepping back 1 to 4 days)
    for (let daysAgo = 1; daysAgo <= 4; daysAgo++) {
        const fallbackDate = new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
        try {
            const res = await fetch(`${FRANKFURTER_BASE_URL}/rate/${b}/${q}?date=${fallbackDate}`);
            if (res.ok) {
                const data = await res.json();
                if (typeof data.rate === 'number' && data.rate > 0) {
                    setCachedRate(b, q, data.rate, data.date);
                    return data.rate;
                }
            }
        } catch {
            void 0;
            continue;
        }
    }

    // Attempt 3: Try inverted rate (quote -> base)
    try {
        const invRes = await fetch(`${FRANKFURTER_BASE_URL}/rate/${q}/${b}`);
        if (invRes.ok) {
            const invData = await invRes.json();
            if (typeof invData.rate === 'number' && invData.rate > 0) {
                const rate = 1 / invData.rate;
                setCachedRate(b, q, rate, invData.date ? `inv_${invData.date}` : undefined);
                return rate;
            }
        }
    } catch {
        void 0;
    }

    // Attempt 4: Return any existing cached rate regardless of timestamp
    if (cached && typeof cached.rate === 'number' && cached.rate > 0) {
        return cached.rate;
    }

    // Check inverted cache
    const invCached = getCachedRate(q, b);
    if (invCached && typeof invCached.rate === 'number' && invCached.rate > 0) {
        return 1 / invCached.rate;
    }

    // Attempt 5: Static fallback rates
    const pairKey = `${b}_${q}`;
    if (STATIC_FALLBACK_RATES[pairKey]) {
        return STATIC_FALLBACK_RATES[pairKey];
    }
    const invPairKey = `${q}_${b}`;
    if (STATIC_FALLBACK_RATES[invPairKey]) {
        return 1 / STATIC_FALLBACK_RATES[invPairKey];
    }

    // If both are known against USD, bridge through USD
    const bToUsd = STATIC_FALLBACK_RATES[`${b}_USD`] || (STATIC_FALLBACK_RATES[`USD_${b}`] ? 1 / STATIC_FALLBACK_RATES[`USD_${b}`] : null);
    const usdToQ = STATIC_FALLBACK_RATES[`USD_${q}`] || (STATIC_FALLBACK_RATES[`${q}_USD`] ? 1 / STATIC_FALLBACK_RATES[`${q}_USD`] : null);
    if (bToUsd && usdToQ) {
        return bToUsd * usdToQ;
    }

    // Default emergency fallback
    console.warn(`[Currency] All rate fallbacks failed for ${b}->${q}. Using 1.0`);
    return 1.0;
}

export function convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    rate: number
): number {
    if (!amount || amount === 0) return 0;
    if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) return amount;

    const raw = amount * rate;
    const decimals = getCurrencyDecimals(toCurrency);
    if (decimals === 0) {
        return Math.round(raw);
    }
    return Number(raw.toFixed(decimals));
}

let currenciesCache: CurrencyInfo[] | null = null;

export async function fetchAllCurrencies(): Promise<CurrencyInfo[]> {
    if (currenciesCache && currenciesCache.length > POPULAR_CURRENCIES.length) {
        return currenciesCache;
    }

    try {
        const stored = localStorage.getItem('frankfurter_currencies_cache');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                currenciesCache = parsed;
            }
        }
    } catch {
        void 0;
    }

    try {
        const res = await fetch(`${FRANKFURTER_BASE_URL}/currencies`);
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
                const map = new Map<string, CurrencyInfo>();
                // Add popular first to preserve order & icons
                POPULAR_CURRENCIES.forEach(c => map.set(c.code, c));

                // Add or update from API
                data.forEach((item: any) => {
                    const code = item.iso_code || item.code;
                    if (!code) return;
                    if (!map.has(code)) {
                        map.set(code, {
                            code,
                            name: item.name || code,
                            symbol: item.symbol || getCurrencySymbol(code),
                            countryCode: getCountryCodeForCurrency(code),
                            decimals: getCurrencyDecimals(code),
                        });
                    }
                });

                currenciesCache = Array.from(map.values());
                try {
                    localStorage.setItem('frankfurter_currencies_cache', JSON.stringify(currenciesCache));
                } catch {
                    void 0;
                }
                return currenciesCache;
            }
        }
    } catch (e) {
        console.warn('[Currency] Failed to fetch currency catalogue from Frankfurter:', e);
    }

    return currenciesCache || POPULAR_CURRENCIES;
}

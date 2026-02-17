export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
};

export const formatNumber = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN').format(amount);
};

/** Parse a formatted string "87,000" back to 87000 */
export const parseFormattedNumber = (str: string): number => {
    const cleaned = str.replace(/[^\d.-]/g, '');
    return parseFloat(cleaned) || 0;
};

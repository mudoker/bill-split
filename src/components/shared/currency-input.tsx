import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { formatNumber } from '@/lib/format';
import { useBillStore, type CurrencyCode } from '@/store/useBillStore';
import { cn } from '@/lib/utils';

interface CurrencyInputProps {
    value: number;
    onChange: (value: number) => void;
    className?: string;
    placeholder?: string;
    prefix?: string;
    showCurrencySymbol?: boolean;
    currency?: CurrencyCode;
}

export function CurrencyInput({
    value,
    onChange,
    className,
    placeholder,
    prefix,
    showCurrencySymbol = false,
    currency: propCurrency,
}: CurrencyInputProps) {
    const storeCurrency = useBillStore((state) => state.currency);
    const currency = propCurrency || storeCurrency || 'VND';
    const [isFocused, setIsFocused] = useState(false);
    const [rawText, setRawText] = useState(value === 0 ? '' : value.toString());

    useEffect(() => {
        if (!isFocused) {
            setRawText(value === 0 ? '' : value.toString());
        }
    }, [value, isFocused]);

    const handleFocus = useCallback(() => {
        setIsFocused(true);
        setRawText(value === 0 ? '' : value.toString());
    }, [value]);

    const handleBlur = useCallback(() => {
        setIsFocused(false);
        const parsed = parseFloat(rawText.replace(/[^\d.-]/g, '')) || 0;
        const finalVal = currency === 'USD' ? Number(parsed.toFixed(2)) : Math.round(parsed);
        onChange(finalVal);
        setRawText(finalVal === 0 ? '' : finalVal.toString());
    }, [rawText, onChange, currency]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setRawText(e.target.value);
    }, []);

    const activePrefix = prefix !== undefined ? prefix : (showCurrencySymbol ? (currency === 'USD' ? '$' : '₫') : undefined);

    return (
        <div className="relative flex items-center w-full">
            {activePrefix && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none font-black select-none z-10">
                    {activePrefix}
                </span>
            )}
            <Input
                type={isFocused ? 'number' : 'text'}
                step={currency === 'USD' ? "0.01" : "1"}
                value={isFocused ? rawText : (value === 0 ? '' : formatNumber(value, currency))}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className={cn(activePrefix && 'pl-7', className)}
                placeholder={placeholder || (currency === 'USD' ? '0.00' : '0')}
            />
        </div>
    );
}

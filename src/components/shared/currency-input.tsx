import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

interface CurrencyInputProps {
    value: number;
    onChange: (value: number) => void;
    className?: string;
    placeholder?: string;
    prefix?: string;
}

export function CurrencyInput({ value, onChange, className, placeholder, prefix }: CurrencyInputProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [rawText, setRawText] = useState(value.toString());

    const handleFocus = useCallback(() => {
        setIsFocused(true);
        setRawText(value === 0 ? '' : value.toString());
    }, [value]);

    const handleBlur = useCallback(() => {
        setIsFocused(false);
        const parsed = parseFloat(rawText.replace(/[^\d.-]/g, '')) || 0;
        onChange(parsed);
    }, [rawText, onChange]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setRawText(e.target.value);
    }, []);

    return (
        <div className="relative">
            {prefix && (
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none font-medium">
                    {prefix}
                </span>
            )}
            <Input
                type={isFocused ? 'number' : 'text'}
                value={isFocused ? rawText : (value === 0 ? '' : formatNumber(value))}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className={cn(prefix && 'pl-6', className)}
                placeholder={placeholder}
            />
        </div>
    );
}

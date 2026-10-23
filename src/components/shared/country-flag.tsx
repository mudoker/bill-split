import React from 'react';
import * as Flags from 'country-flag-icons/react/3x2';
import { cn } from '@/lib/utils';

interface CountryFlagProps {
    countryCode?: string;
    className?: string;
}

export const CountryFlag: React.FC<CountryFlagProps> = ({
    countryCode,
    className = "w-4 h-3 rounded-[2px] object-cover shrink-0 shadow-xs",
}) => {
    if (!countryCode) return null;
    const cleanCode = countryCode.toUpperCase();
    const FlagComponent = (Flags as Record<string, React.ComponentType<{ className?: string }>>)[cleanCode];

    if (!FlagComponent) {
        return (
            <span className={cn("inline-flex items-center justify-center bg-muted text-[9px] font-bold rounded px-1 shrink-0", className)}>
                {cleanCode.slice(0, 2)}
            </span>
        );
    }

    return <FlagComponent className={className} />;
};

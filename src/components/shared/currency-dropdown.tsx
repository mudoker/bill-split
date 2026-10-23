import { useState, useEffect, useMemo } from 'react';
import { useBillStore } from '@/store/useBillStore';
import {
    POPULAR_CURRENCIES,
    fetchAllCurrencies,
    getCurrencyInfo,
    type CurrencyInfo
} from '@/lib/currency';
import { CountryFlag } from './country-flag';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronDown, Search, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CurrencyDropdownProps {
    value?: string;
    onChange?: (currency: string) => void | Promise<void>;
    variant?: 'compact' | 'pill' | 'default';
    className?: string;
    disabled?: boolean;
}

export function CurrencyDropdown({
    value: controlledValue,
    onChange: controlledOnChange,
    variant = 'default',
    className,
    disabled = false,
}: CurrencyDropdownProps) {
    const storeCurrency = useBillStore((state) => state.currency);
    const storeSetCurrency = useBillStore((state) => state.setCurrency);

    const activeCurrencyCode = controlledValue || storeCurrency || 'VND';
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [allCurrencies, setAllCurrencies] = useState<CurrencyInfo[]>(POPULAR_CURRENCIES);
    const [isConverting, setIsConverting] = useState(false);

    // Fetch full catalogue in background on mount
    useEffect(() => {
        let mounted = true;
        fetchAllCurrencies().then((list) => {
            if (mounted && list && list.length > 0) {
                setAllCurrencies(list);
            }
        });
        return () => {
            mounted = false;
        };
    }, []);

    const activeInfo = useMemo(() => {
        return getCurrencyInfo(activeCurrencyCode);
    }, [activeCurrencyCode]);

    const filteredCurrencies = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return allCurrencies;
        return allCurrencies.filter(
            (c) =>
                c.code.toLowerCase().includes(query) ||
                c.name.toLowerCase().includes(query) ||
                c.countryCode.toLowerCase().includes(query)
        );
    }, [allCurrencies, search]);

    const handleSelect = async (code: string) => {
        if (code === activeCurrencyCode) {
            setOpen(false);
            return;
        }

        setOpen(false);
        setIsConverting(true);

        try {
            if (controlledOnChange) {
                await controlledOnChange(code);
            } else {
                await storeSetCurrency(code);
            }
        } catch (err) {
            console.error('Failed to change currency:', err);
        } finally {
            setIsConverting(false);
        }
    };

    const dismissKeyboard = () => {
        if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen} modal={false}>
            <PopoverTrigger asChild>
                {variant === 'compact' ? (
                    <button
                        type="button"
                        onClick={dismissKeyboard}
                        onTouchStart={dismissKeyboard}
                        disabled={disabled || isConverting}
                        className={cn(
                            "h-8 px-2 rounded-xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/10 text-xs font-black transition-all flex items-center gap-1.5 text-foreground touch-manipulation active:scale-95 shadow-sm",
                            disabled && "opacity-50 pointer-events-none",
                            className
                        )}
                        title={`Current currency: ${activeInfo.code} (${activeInfo.name}). Click to change.`}
                    >
                        {isConverting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                        ) : (
                            <CountryFlag countryCode={activeInfo.countryCode} className="w-4 h-3 rounded-[2px]" />
                        )}
                        <span className="font-bold text-xs">{activeInfo.code}</span>
                        <ChevronDown className="w-3 h-3 text-muted-foreground opacity-60" />
                    </button>
                ) : variant === 'pill' ? (
                    <button
                        type="button"
                        onClick={dismissKeyboard}
                        onTouchStart={dismissKeyboard}
                        disabled={disabled || isConverting}
                        className={cn(
                            "h-9 px-3 rounded-xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/10 text-xs font-bold transition-all flex items-center gap-2 text-foreground touch-manipulation active:scale-95 shadow-sm",
                            disabled && "opacity-50 pointer-events-none",
                            className
                        )}
                        title={`Current currency: ${activeInfo.code} - ${activeInfo.name}`}
                    >
                        {isConverting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                        ) : (
                            <CountryFlag countryCode={activeInfo.countryCode} className="w-4 h-3 rounded-[2px]" />
                        )}
                        <span className="font-black text-xs">{activeInfo.code}</span>
                        <span className="text-[11px] text-muted-foreground font-medium">{activeInfo.symbol}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground opacity-60 ml-0.5" />
                    </button>
                ) : (
                    <Button
                        type="button"
                        onClick={dismissKeyboard}
                        onTouchStart={dismissKeyboard}
                        variant="outline"
                        disabled={disabled || isConverting}
                        className={cn(
                            "w-full h-9 px-3 justify-between font-medium rounded-xl bg-foreground/[0.03] border-border hover:bg-foreground/[0.06] text-xs",
                            className
                        )}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            {isConverting ? (
                                <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                            ) : (
                                <CountryFlag countryCode={activeInfo.countryCode} className="w-5 h-3.5 rounded-[2px]" />
                            )}
                            <span className="font-bold text-foreground">{activeInfo.code}</span>
                            <span className="text-muted-foreground truncate hidden xs:inline text-xs">
                                ({activeInfo.name})
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span className="font-black text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                {activeInfo.symbol}
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                        </div>
                    </Button>
                )}
            </PopoverTrigger>

            <PopoverContent
                className="w-72 xs:w-80 p-2 bg-card/95 backdrop-blur-xl border-border rounded-2xl shadow-2xl z-[150] text-foreground max-h-[60vh] flex flex-col"
                align="start"
                sideOffset={8}
                collisionPadding={16}
            >
                <div className="space-y-2">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search code, country or name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-8 pl-8 pr-2 text-xs bg-muted/40 border-border/60 rounded-lg focus-visible:ring-1"
                        />
                    </div>

                    {/* Quick popular currencies when not searching */}
                    {!search && (
                        <div className="px-1 pt-1 pb-0.5">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                                Popular Currencies
                            </div>
                            <div className="grid grid-cols-4 gap-1">
                                {POPULAR_CURRENCIES.slice(0, 8).map((cur) => (
                                    <button
                                        key={cur.code}
                                        type="button"
                                        onClick={() => handleSelect(cur.code)}
                                        className={cn(
                                            "flex flex-col items-center py-1.5 px-1 rounded-lg border text-center transition-all touch-manipulation active:scale-95",
                                            cur.code === activeCurrencyCode
                                                ? "bg-primary/15 border-primary/40 text-primary font-black"
                                                : "bg-muted/20 border-transparent hover:bg-muted/40 text-foreground"
                                        )}
                                    >
                                        <CountryFlag countryCode={cur.countryCode} className="w-4 h-3 mb-0.5" />
                                        <span className="text-[10px] font-bold leading-tight">{cur.code}</span>
                                        <span className="text-[8px] opacity-70 leading-none">{cur.symbol}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Full Currencies List */}
                    <div className="border-t border-border/40 pt-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1 mb-1">
                            {search ? `Results (${filteredCurrencies.length})` : 'All Currencies'}
                        </div>
                        <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1 overscroll-contain">
                            {filteredCurrencies.length === 0 ? (
                                <div className="text-center py-6 text-xs text-muted-foreground">
                                    No currency found
                                </div>
                            ) : (
                                filteredCurrencies.map((cur) => {
                                    const isSelected = cur.code === activeCurrencyCode;
                                    return (
                                        <button
                                            key={cur.code}
                                            type="button"
                                            onClick={() => handleSelect(cur.code)}
                                            className={cn(
                                                "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left touch-manipulation",
                                                isSelected
                                                    ? "bg-primary/15 text-primary font-bold"
                                                    : "hover:bg-muted/40 text-foreground"
                                            )}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <CountryFlag countryCode={cur.countryCode} className="w-4 h-3 rounded-[2px]" />
                                                <span className="font-bold shrink-0">{cur.code}</span>
                                                <span className="text-[11px] text-muted-foreground truncate">
                                                    {cur.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                                <span className="font-mono text-[11px] text-muted-foreground">
                                                    {cur.symbol}
                                                </span>
                                                {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

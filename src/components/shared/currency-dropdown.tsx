'use client';

import { useState, useEffect, useMemo } from 'react';
import { useBillStore } from '@/store/useBillStore';
import {
    POPULAR_CURRENCIES,
    fetchAllCurrencies,
    getCurrencyInfo,
    useVndRates,
    fetchVndRates,
    formatVndRate,
    formatVndRateCompact,
    type CurrencyInfo
} from '@/lib/currency';
import { CountryFlag } from './country-flag';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, Search, Check, Loader2, RotateCw, Clock } from 'lucide-react';
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
    const [isRefreshingRates, setIsRefreshingRates] = useState(false);

    // TanStack Query hook with 8 hours caching for VND exchange rates
    const { data: vndRatesData, refetch: refetchVndRates, isFetching } = useVndRates();

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

    const handleManualRefreshRates = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsRefreshingRates(true);
        try {
            await fetchVndRates(true);
            await refetchVndRates();
        } finally {
            setIsRefreshingRates(false);
        }
    };

    const formattedRetrievalTime = useMemo(() => {
        if (!vndRatesData?.retrievedAt) return null;
        const d = new Date(vndRatesData.retrievedAt);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, [vndRatesData?.retrievedAt]);

    const dismissKeyboard = () => {
        if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen} modal={true}>
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
                            "w-full h-10 px-3 justify-between font-medium rounded-xl bg-foreground/[0.03] border-border hover:bg-foreground/[0.06] text-xs",
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
                            <span className="font-black text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                {activeInfo.symbol}
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                        </div>
                    </Button>
                )}
            </PopoverTrigger>

            <PopoverContent
                className="w-80 sm:w-96 p-3 bg-card/95 backdrop-blur-2xl border-border/80 rounded-2xl shadow-2xl z-[150] text-foreground max-h-[82vh] flex flex-col gap-2.5 overscroll-contain"
                align="start"
                sideOffset={8}
                collisionPadding={16}
                onOpenAutoFocus={(e) => {
                    // Prevent mobile keyboard from jumping open and covering dropdown
                    e.preventDefault();
                }}
            >
                {/* Search Header */}
                <div className="relative shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Search code, country or currency..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-9 pl-9 pr-3 text-xs bg-muted/40 border-border/60 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/40 font-medium"
                    />
                </div>

                {/* Popular Currencies Quick Grid */}
                {!search && (
                    <div className="shrink-0 space-y-1.5 px-0.5">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <span>Popular Currencies</span>
                            <span className="text-[9px] font-semibold text-muted-foreground/70 lowercase">vs VND</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                            {POPULAR_CURRENCIES.slice(0, 8).map((cur) => {
                                const isSelected = cur.code === activeCurrencyCode;
                                const rate = vndRatesData?.rates?.[cur.code];
                                const compactRate = cur.code === 'VND' ? 'Base' : formatVndRateCompact(rate);

                                return (
                                    <button
                                        key={cur.code}
                                        type="button"
                                        onClick={() => handleSelect(cur.code)}
                                        className={cn(
                                            "flex flex-col items-center py-2 px-1 rounded-xl border text-center transition-all touch-manipulation active:scale-95",
                                            isSelected
                                                ? "bg-primary/15 border-primary/40 text-primary font-bold shadow-sm"
                                                : "bg-muted/30 border-transparent hover:bg-muted/60 text-foreground"
                                        )}
                                    >
                                        <CountryFlag countryCode={cur.countryCode} className="w-4 h-3 mb-1 rounded-[2px]" />
                                        <span className="text-[11px] font-bold leading-tight">{cur.code}</span>
                                        <span className={cn(
                                            "text-[9px] font-medium leading-tight mt-0.5 truncate max-w-full",
                                            isSelected ? "text-primary/90 font-bold" : "text-muted-foreground"
                                        )}>
                                            {compactRate}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Rates Meta Header & Currency List */}
                <div className="flex-1 min-h-0 flex flex-col border-t border-border/50 pt-2">
                    <div className="flex items-center justify-between px-1 mb-1.5 shrink-0 text-[10px] font-bold text-muted-foreground">
                        <span className="uppercase tracking-wider">
                            {search ? `Results (${filteredCurrencies.length})` : 'All Currencies'}
                        </span>
                        <div className="flex items-center gap-1.5 font-normal text-muted-foreground/80">
                            <Clock className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                            <span>
                                {formattedRetrievalTime ? `Rates at ${formattedRetrievalTime}` : '8h cached rates'}
                            </span>
                            <button
                                type="button"
                                onClick={handleManualRefreshRates}
                                disabled={isRefreshingRates || isFetching}
                                title="Refresh rates vs VND"
                                className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors ml-0.5"
                            >
                                <RotateCw className={cn("w-3 h-3", (isRefreshingRates || isFetching) && "animate-spin text-primary")} />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable list with native stopPropagation to prevent parent Dialog scroll trapping */}
                    <ScrollArea
                        className="h-56 sm:h-64 pr-2"
                        onWheel={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                    >
                        <div className="space-y-1">
                            {filteredCurrencies.length === 0 ? (
                                <div className="text-center py-8 text-xs text-muted-foreground">
                                    No currency found
                                </div>
                            ) : (
                                filteredCurrencies.map((cur) => {
                                    const isSelected = cur.code === activeCurrencyCode;
                                    const rate = vndRatesData?.rates?.[cur.code];
                                    const formattedRate = cur.code === 'VND' ? 'Base (1:1)' : formatVndRate(rate);

                                    return (
                                        <button
                                            key={cur.code}
                                            type="button"
                                            onClick={() => handleSelect(cur.code)}
                                            className={cn(
                                                "w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors text-left touch-manipulation group",
                                                isSelected
                                                    ? "bg-primary/15 text-primary font-bold shadow-xs"
                                                    : "hover:bg-muted/50 text-foreground"
                                            )}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                                                <CountryFlag countryCode={cur.countryCode} className="w-4 h-3 rounded-[2px] shrink-0" />
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-bold">{cur.code}</span>
                                                        <span className="text-[11px] text-muted-foreground truncate hidden xs:inline">
                                                            {cur.name}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Exchange rate against VND & selection mark */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                {formattedRate && (
                                                    <span className={cn(
                                                        "font-mono text-[11px] tabular-nums",
                                                        cur.code === 'VND'
                                                            ? "text-primary/90 font-bold bg-primary/10 px-1.5 py-0.5 rounded"
                                                            : isSelected
                                                            ? "text-primary/90 font-medium"
                                                            : "text-muted-foreground group-hover:text-foreground/80"
                                                    )}>
                                                        {cur.code === 'VND' ? formattedRate : `≈ ${formattedRate}`}
                                                    </span>
                                                )}
                                                {isSelected ? (
                                                    <Check className="w-4 h-4 text-primary shrink-0" />
                                                ) : (
                                                    <span className="w-4 h-4" />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </ScrollArea>

                    {/* Footer info banner */}
                    <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-between px-1 text-[10px] text-muted-foreground/70">
                        <span>Central bank FX rates</span>
                        <span>Auto-cached up to 8 hours</span>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

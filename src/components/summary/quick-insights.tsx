import { useBillState } from "@/hooks/useBillState";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { Receipt, TrendingUp, ArrowUpRight } from "lucide-react";

export function QuickInsights() {
    const { people, items, calculate } = useBillState();
    const { totalBill, totalExtras } = calculate();

    if (people.length === 0 && items.length === 0) return null;

    const avgCommitment = totalBill / (people.length || 1);
    const itemVolume = items.length;

    return (
        <div className="insights-grid animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
            <Card className="bg-card border border-foreground/[0.05] rounded-xl shadow-none hover:border-foreground/15 transition-all group overflow-hidden">
                <CardContent className="p-3.5 relative">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Receipt className="w-7 h-7 text-foreground" />
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-cyan-700 dark:text-cyan-400 uppercase tracking-widest">Live Volume</p>
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-base sm:text-lg font-black text-foreground tabular-nums truncate max-w-full">{formatCurrency(totalBill)}</span>
                            {totalExtras > 0 && <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">+{formatCurrency(totalExtras)}</span>}
                        </div>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">{itemVolume} items documented</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-card border border-foreground/[0.05] rounded-xl shadow-none hover:border-foreground/15 transition-all group overflow-hidden">
                <CardContent className="p-3.5 relative">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="w-7 h-7 text-foreground" />
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-muted-foreground/90 uppercase tracking-widest">Avg. Commitment</p>
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-base sm:text-lg font-black text-foreground tabular-nums truncate max-w-full">{formatCurrency(avgCommitment)}</span>
                            <ArrowUpRight className="w-2.5 h-2.5 text-foreground/50 shrink-0" />
                        </div>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">{people.length} active members</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

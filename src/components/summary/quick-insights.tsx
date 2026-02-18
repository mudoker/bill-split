import { useBillState } from "@/hooks/useBillState";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { Receipt, TrendingUp, Wallet, ArrowUpRight } from "lucide-react";

export function QuickInsights() {
    const { people, items, calculate } = useBillState();
    const { totalBill, totalItemCost, totalExtras } = calculate();

    if (people.length === 0 && items.length === 0) return null;

    const avgCommitment = totalBill / (people.length || 1);
    const itemVolume = items.length;

    return (
        <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
            <Card className="bg-card border border-foreground/[0.05] rounded-xl shadow-none hover:border-primary/20 transition-all group overflow-hidden">
                <CardContent className="p-4 relative">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Receipt className="w-8 h-8 text-primary" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">Live Volume</p>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-black text-foreground tabular-nums">{formatCurrency(totalBill)}</span>
                            {totalExtras > 0 && <span className="text-[9px] font-bold text-amber-500">+{formatCurrency(totalExtras)}</span>}
                        </div>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight opacity-70">{itemVolume} items documented</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-card border border-foreground/[0.05] rounded-xl shadow-none hover:border-primary/20 transition-all group overflow-hidden">
                <CardContent className="p-4 relative">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="w-8 h-8 text-primary" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-muted-foreground/80 uppercase tracking-widest">Avg. Commitment</p>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-black text-foreground tabular-nums">{formatCurrency(avgCommitment)}</span>
                            <ArrowUpRight className="w-2.5 h-2.5 text-primary" />
                        </div>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight opacity-70">{people.length} active members</p>
                    </div>
                </CardContent>
            </Card>

            <div className="col-span-2 p-4 rounded-xl bg-primary/[0.03] border border-primary/10 flex items-center justify-between group cursor-default">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Wallet className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Efficiency Metric</p>
                        <p className="text-[10px] text-muted-foreground font-medium">Session is fully documented and ready for settlement.</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm font-black text-amber-400 uppercase tracking-tighter tabular-nums">{people.length > 0 ? (totalItemCost / people.length).toFixed(0) : 0}</p>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter opacity-70">Score</p>
                </div>
            </div>
        </div>
    );
}

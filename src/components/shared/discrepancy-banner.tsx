import { useBillState } from "@/hooks/useBillState";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

export function DiscrepancyBanner() {
    const { calculate } = useBillState();
    const { discrepancy } = calculate();

    if (Math.abs(discrepancy) < 100) return null;

    return (
        <div className="flex-none px-3 sm:px-6 md:px-8 lg:px-10 max-w-[94%] 2xl:max-w-[2000px] mx-auto w-full mb-2 sm:mb-4">
             <div className={cn(
                "p-2.5 sm:p-3 rounded-xl sm:rounded-2xl flex items-center gap-2.5 sm:gap-3 border shadow-sm animate-in fade-in slide-in-from-top-2",
                discrepancy < 0 ? "bg-red-500/10 border-red-500/20 text-red-600" : "bg-amber-500/10 border-amber-500/20 text-amber-600"
            )}>
                <div className={cn("w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm", discrepancy < 0 ? "bg-red-500/20 text-red-600" : "bg-amber-500/20 text-amber-600")}>
                    <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-80 flex items-center gap-2">
                        {discrepancy < 0 ? "Payment Shortfall" : "Excess Collected"}
                    </div>
                    <div className="text-[11px] sm:text-xs font-bold leading-tight mt-0.5 opacity-90">
                        {discrepancy < 0
                            ? <span>Missing <span className="font-black underline decoration-red-500/30 underline-offset-2">{formatCurrency(Math.abs(discrepancy))}</span> to cover the bill. Check host payment?</span>
                            : <span>Surplus of <span className="font-black underline decoration-amber-500/30 underline-offset-2">{formatCurrency(discrepancy)}</span> detected. Check overpayments?</span>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}

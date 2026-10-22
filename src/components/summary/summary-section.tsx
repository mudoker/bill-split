import { useBillState } from "@/hooks/useBillState";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, TableIcon, BarChart3, PieChartIcon, CheckCircle2, AlertTriangle, Share2, Eye, Copy, Receipt, Tag, TrendingUp, Wallet, LayoutGrid, ArrowRight, QrCode, MapPin } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import html2canvas from 'html2canvas';
import { CostPieChart, CompareBarChart, buildChartData } from "./summary-charts";
import { generateShareUrl } from "@/lib/share";
import { useState } from "react";

export function SummarySection() {
    const {
        people,
        items,
        hostId,
        globalCharges,
        calculate,
        currentBillId,
        qrCode,
        billName,
        location,
    } = useBillState();

    const [copiedView, setCopiedView] = useState(false);

    const { totalCosts, finalPayables, totalBill, totalExtras, totalSurplus, totalItemCost, settlementFlows } = calculate();
    const { pieData, barData, itemCostData } = buildChartData(people, items, totalCosts, finalPayables);











    // Verification: sum of all final payables + total surplus should equal total bill
    const sumFinalPayables = Object.values(finalPayables).reduce((a, b) => a + b, 0);
    const totalSponsored = people.reduce((sum, p) => sum + (p.sponsorAmount || 0), 0);
    const verificationDiff = Math.abs(totalBill - sumFinalPayables - Math.min(totalSponsored, totalBill));
    const isBalanced = verificationDiff < 1; // within 1 dong rounding tolerance

    const handleDownload = async () => {
        const element = document.getElementById('summary-card');
        if (element) {
            const canvas = await html2canvas(element, { scale: 2 });
            const link = document.createElement('a');
            const sanitizedName = billName ? billName.trim().toLowerCase().replace(/[^a-z0-9_-]+/gi, '-') : 'bill';
            link.download = `${sanitizedName}-summary.png`;
            link.href = canvas.toDataURL();
            link.click();
        }
    };

    const handleCopyShare = () => {
        const url = generateShareUrl({ people, items, globalCharges, hostId, currentBillId }, true);
        navigator.clipboard.writeText(url);
        setCopiedView(true);
        setTimeout(() => setCopiedView(false), 2000);
    };

    return (
        <Card id="summary-card" className="w-full h-full flex flex-col border-none shadow-none md:border md:shadow-sm bg-background">


            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3 sm:pt-4 px-3 sm:px-4 md:px-6 md:pt-6 shrink-0 gap-2">
                <div className="space-y-0.5 min-w-0 flex-1">
                    <CardTitle className="text-base sm:text-xl font-black uppercase tracking-widest flex items-center gap-1.5 sm:gap-2 text-foreground truncate max-w-[160px] xs:max-w-xs sm:max-w-md">
                        <Receipt className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" /> <span className="truncate">{billName || "Summary"}</span>
                    </CardTitle>
                    {location && (
                        <p className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1 font-medium pl-5 sm:pl-7 truncate">
                            <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="truncate">{location}</span>
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 print:hidden shrink-0" data-html2canvas-ignore>
                    {qrCode && (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1.5 text-foreground font-bold hover:bg-primary/10 hover:text-primary transition-all border-foreground/10 px-2.5 sm:px-3 text-xs"
                                    title="Show Host Payment QR"
                                >
                                    <QrCode className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Pay Host</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md rounded-2xl border-foreground/10 bg-background shadow-2xl p-4 sm:p-6">
                                <DialogHeader>
                                    <DialogTitle className="text-lg sm:text-xl font-black uppercase tracking-widest flex items-center gap-2 text-primary">
                                        <QrCode className="w-5 h-5" /> Host Payment
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="flex flex-col items-center justify-center p-4 sm:p-6 gap-4">
                                    <div className="w-full aspect-square max-w-[260px] sm:max-w-[300px] bg-white rounded-xl overflow-hidden border border-foreground/10 p-2 shadow-sm">
                                        <img src={qrCode} alt="Host Payment QR" className="w-full h-full object-contain" />
                                    </div>
                                    <p className="text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        Scan to pay the host directly
                                    </p>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 text-foreground font-bold hover:bg-primary/10 hover:text-primary transition-all border-foreground/10 px-2.5 sm:px-3 text-xs"
                            >
                                <Share2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Share</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2 bg-background/95 backdrop-blur-xl border-primary/20" align="end">
                            <div className="flex flex-col gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn("justify-start h-9 text-xs gap-2 font-bold", copiedView && "bg-primary/10 text-primary")}
                                    onClick={handleCopyShare}
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    <div className="flex-1 text-left">
                                        <div className="uppercase tracking-tighter">{copiedView ? "Copied!" : "View-only Link"}</div>
                                    </div>
                                    <Copy className="w-3 h-3 opacity-40" />
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Button variant="outline" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary border-foreground/10 shrink-0" onClick={handleDownload} title="Download Summary">
                        <Download className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                <ScrollArea className="flex-1 px-3 sm:px-4 md:px-6">
                    <div className="space-y-4 sm:space-y-6 pt-3 pb-8 sm:py-6 pr-1 sm:pr-3">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
                            <div className="bg-card/30 rounded-xl sm:rounded-2xl p-2 xs:p-2.5 sm:p-4 border border-foreground/5 transition-all hover:border-primary/20 group" title={`Items Subtotal: ${formatCurrency(totalItemCost)}`}>
                                <div className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1 group-hover:text-primary transition-colors">Items</div>
                                <div className="text-[11px] xs:text-xs sm:text-sm font-bold text-foreground tabular-nums truncate tracking-tight">{formatCurrency(totalItemCost)}</div>
                            </div>
                            <div className="bg-amber-500/10 rounded-xl sm:rounded-2xl p-2 xs:p-2.5 sm:p-4 border border-amber-500/20 transition-all hover:bg-amber-500/20" title={`Extras/Taxes: ${formatCurrency(totalExtras)}`}>
                                <div className="text-[9px] sm:text-[10px] text-amber-600 dark:text-amber-400 uppercase font-black tracking-widest mb-1">Extras</div>
                                <div className="text-[11px] xs:text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 tabular-nums truncate tracking-tight">+{formatCurrency(totalExtras)}</div>
                            </div>
                            <div className="relative overflow-hidden bg-primary/10 rounded-xl sm:rounded-2xl p-2 xs:p-2.5 sm:p-4 border border-primary/20 transition-all hover:bg-primary/20 group text-primary" title={`Total Bill: ${formatCurrency(totalBill)}`}>
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                                <div className="text-[9px] sm:text-[10px] uppercase font-black tracking-[0.15em] sm:tracking-[0.2em] mb-1 opacity-90 text-primary">Total Bill</div>
                                <div className="text-xs xs:text-sm sm:text-xl font-black tabular-nums tracking-tight drop-shadow-sm text-primary truncate">{formatCurrency(totalBill)}</div>
                            </div>
                        </div>

                        {totalSurplus > 0.01 && (
                            <div className="bg-primary/5 rounded-xl p-2.5 sm:p-3 border border-primary/20 flex items-center justify-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                                <span className="text-xs text-primary font-black uppercase tracking-tight text-center">Sponsor surplus: {formatCurrency(totalSurplus)}</span>
                            </div>
                        )}

                        {/* Tabbed Content */}
                        <Tabs defaultValue="table" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 h-9 sm:h-10 bg-muted/20 p-1 border border-foreground/5 rounded-xl">
                                <TabsTrigger value="table" className="text-[11px] sm:text-xs gap-1 sm:gap-1.5 font-bold uppercase transition-all data-[state=active]:bg-background data-[state=active]:text-primary py-1">
                                    <TableIcon className="w-3.5 h-3.5" /> Splits
                                </TabsTrigger>
                                <TabsTrigger value="pie" className="text-[11px] sm:text-xs gap-1 sm:gap-1.5 font-bold uppercase transition-all data-[state=active]:bg-background data-[state=active]:text-primary py-1">
                                    <PieChartIcon className="w-3.5 h-3.5" /> Charts
                                </TabsTrigger>
                                <TabsTrigger value="bar" className="text-[11px] sm:text-xs gap-1 sm:gap-1.5 font-bold uppercase transition-all data-[state=active]:bg-background data-[state=active]:text-primary py-1">
                                    <BarChart3 className="w-3.5 h-3.5" /> Compare
                                </TabsTrigger>
                            </TabsList>

                            {/* TABLE TAB */}
                            <TabsContent value="table" className="mt-4 space-y-4 sm:space-y-6">
                                <div className="rounded-xl sm:rounded-2xl border border-foreground/5 bg-card/30 overflow-hidden shadow-sm shadow-black/5">
                                    <div className="overflow-x-auto">
                                        <Table className="w-full min-w-[280px]">
                                            <TableHeader>
                                                <TableRow className="bg-muted/30 border-b border-foreground/5">
                                                    <TableHead className="px-2.5 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Participant</TableHead>
                                                    <TableHead className="text-right px-2.5 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">Subtotal</TableHead>
                                                    <TableHead className="text-right px-2.5 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">Sponsor</TableHead>
                                                    <TableHead className="text-right px-2.5 sm:px-4 py-2 sm:py-3 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-primary whitespace-nowrap">Final Pay</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {people.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="text-center text-muted-foreground h-20 text-xs sm:text-sm font-medium italic">
                                                            No participants yet...
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                                {people.map((p) => {
                                                    const total = totalCosts[p.id] || 0;
                                                    const pay = finalPayables[p.id] || 0;
                                                    return (
                                                        <TableRow key={p.id} className="hover:bg-primary/[0.02] transition-colors border-b border-foreground/5 last:border-0">
                                                            <TableCell className="font-bold px-2.5 sm:px-4 py-2.5 sm:py-3">
                                                                <span className="truncate max-w-[80px] xs:max-w-[120px] sm:max-w-[160px] block text-xs sm:text-sm" title={p.name}>{p.name}</span>
                                                            </TableCell>
                                                            <TableCell className="text-right text-muted-foreground px-2.5 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap text-xs tabular-nums">
                                                                {formatCurrency(total)}
                                                            </TableCell>
                                                            <TableCell className="text-right px-2.5 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap text-xs tabular-nums">
                                                                {p.sponsorAmount > 0
                                                                    ? <span className="text-emerald-700 dark:text-emerald-400 font-bold">-{formatCurrency(p.sponsorAmount)}</span>
                                                                    : <span className="text-muted-foreground/30">—</span>
                                                                }
                                                            </TableCell>
                                                            <TableCell className="text-right font-black px-2.5 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap text-xs tabular-nums">
                                                                <span className={pay < 0.01 ? "text-primary" : "text-foreground"}>
                                                                    {pay < 0.01 ? "✓ PAID" : formatCurrency(pay)}
                                                                </span>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    {/* Verification Footer */}
                                    {people.length > 0 && (
                                        <div className="border-t border-foreground/5 px-3 sm:px-4 py-2 sm:py-2.5 bg-muted/10 flex items-center justify-between text-[9px] sm:text-[10px] flex-wrap gap-1">
                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                                {isBalanced
                                                    ? <><CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /><span className="text-primary font-black uppercase tracking-widest">Balanced</span></>
                                                    : <><AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" /><span className="text-amber-500 font-black uppercase tracking-widest">System Gap</span></>
                                                }
                                            </div>
                                            <div className="text-muted-foreground font-bold uppercase tracking-tighter">
                                                Net Payable: <span className="text-foreground">{formatCurrency(sumFinalPayables)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {people.length > 0 && (
                                    <div className="relative p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-foreground/[0.02] border border-primary/10 overflow-hidden shadow-xl shadow-black/10 transition-all hover:bg-foreground/[0.03]">
                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-4 sm:mb-8">
                                                <div className="space-y-0.5 sm:space-y-1">
                                                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-primary">Settlement Flows</h4>
                                                    <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase">Optimized Peer-to-Peer Payments</p>
                                                </div>
                                                <div className="px-2.5 sm:px-3 py-1 bg-primary text-black rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 shrink-0">
                                                    Plan Ready
                                                </div>
                                            </div>

                                            <div className="space-y-2.5 sm:space-y-4">
                                                {settlementFlows.length > 0 ? (
                                                    settlementFlows.map((flow, idx) => {
                                                        const debtor = people.find(p => p.id === flow.from);
                                                        const creditor = people.find(p => p.id === flow.to);
                                                        if (!debtor || !creditor) return null;

                                                        return (
                                                            <div key={idx} className="flex items-center gap-2 sm:gap-4 bg-background/40 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-foreground/5 transition-transform hover:scale-[1.01]">
                                                                <div className="flex flex-col items-center gap-1 min-w-[48px] sm:min-w-[60px]">
                                                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-foreground/5 flex items-center justify-center font-black text-xs border border-foreground/10 text-foreground shrink-0">
                                                                        {debtor.name[0]}
                                                                    </div>
                                                                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-tighter truncate max-w-[48px] sm:max-w-[60px]">{debtor.name}</span>
                                                                </div>

                                                                <div className="flex-1 flex flex-col items-center gap-0.5 sm:gap-1 min-w-0">
                                                                    <div className="text-xs sm:text-sm font-black text-primary tabular-nums italic truncate max-w-full">{formatCurrency(flow.amount)}</div>
                                                                    <div className="w-full h-1 bg-primary/5 rounded-full overflow-hidden relative">
                                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-shimmer" />
                                                                        <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-primary opacity-50" />
                                                                    </div>
                                                                    <div className="text-[8px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-muted-foreground flex items-center gap-1">
                                                                        Transfer <ArrowRight className="w-2 h-2" />
                                                                    </div>
                                                                </div>

                                                                <div className="flex flex-col items-center gap-1 min-w-[48px] sm:min-w-[60px]">
                                                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-black flex items-center justify-center font-black text-xs shadow-lg shadow-primary/20 shrink-0">
                                                                        {creditor.name[0]}
                                                                    </div>
                                                                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-tighter truncate max-w-[48px] sm:max-w-[60px]">{creditor.name}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="text-center py-4 text-muted-foreground text-xs italic">
                                                        No transfers needed. Everyone is settled!
                                                    </div>
                                                )}
                                            </div>

                                            {/* Show Settled / Uninvolved People */}
                                            {(() => {
                                                const involvedIds = new Set<string>();
                                                settlementFlows.forEach(f => {
                                                    involvedIds.add(f.from);
                                                    involvedIds.add(f.to);
                                                });
                                                const settledPeople = people.filter(p => !involvedIds.has(p.id));

                                                if (settledPeople.length === 0) return null;

                                                return (
                                                    <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-foreground/5">
                                                        <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 sm:mb-3 opacity-60">Already Settled</h5>
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                                                            {settledPeople.map(p => (
                                                                <div key={p.id} className="flex items-center gap-2 bg-foreground/[0.02] p-2 rounded-xl border border-transparent hover:border-emerald-500/20 transition-colors">
                                                                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                                                        <CheckCircle2 className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-emerald-500" />
                                                                    </div>
                                                                    <span className="text-[10px] font-bold text-muted-foreground/80 truncate">{p.name}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            {/* PIE CHART TAB */}
                            <TabsContent value="pie" className="mt-4 space-y-4 sm:space-y-6">
                                <div className="grid gap-4 sm:gap-6">
                                    <div className="rounded-2xl sm:rounded-3xl border border-foreground/5 bg-card/30 p-4 sm:p-8 shadow-sm">
                                        <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-8">
                                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                                                <PieChartIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs sm:text-sm font-black uppercase tracking-[0.1em]">Share Breakdown</h4>
                                                <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Consumption per person</p>
                                            </div>
                                        </div>
                                        <CostPieChart data={pieData} />
                                    </div>

                                    {itemCostData.length > 0 && (
                                        <div className="rounded-2xl sm:rounded-3xl border border-foreground/5 bg-card/30 p-4 sm:p-8 shadow-sm">
                                            <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-8">
                                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
                                                    <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs sm:text-sm font-black uppercase tracking-[0.1em]">Categoric Volume</h4>
                                                    <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Distribution by menu item</p>
                                                </div>
                                            </div>
                                            <CostPieChart data={itemCostData} />
                                        </div>
                                    )}

                                    {/* Neon Insight Card */}
                                    <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-primary/[0.03] border border-primary/10 flex items-start gap-3 sm:gap-4">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 shadow-inner">
                                            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h5 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] mb-1 sm:mb-1.5 text-primary">Consumption Insights</h5>
                                            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                                                Primary contributor identified: <span className="font-bold text-foreground">{(pieData[0]?.name || 'N/A')}</span> with a dominance of
                                                <span className="text-primary font-black ml-1">
                                                    {pieData.length > 0 ? ((pieData[0].value / totalBill) * 100).toFixed(1) : 0}%
                                                </span> of total bill volume.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* BAR CHART TAB */}
                            <TabsContent value="bar" className="mt-4 space-y-4 sm:space-y-6">
                                <div className="rounded-2xl sm:rounded-3xl border border-foreground/5 bg-card/30 p-4 sm:p-8 shadow-sm">
                                    <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-8">
                                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                                            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs sm:text-sm font-black uppercase tracking-[0.1em]">Value Comparison</h4>
                                            <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Ordered vs Sponsored vs Pay</p>
                                        </div>
                                    </div>
                                    <CompareBarChart data={barData} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                    <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-foreground/[0.02] border border-foreground/5 hover:border-primary/20 transition-all">
                                        <div className="flex items-center gap-2 mb-2 sm:mb-4">
                                            <Wallet className="w-4 h-4 text-primary" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Fiscal Relief</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Total sponsorship of <span className="font-bold text-foreground">{formatCurrency(totalSponsored)}</span> provided a
                                            <span className="font-bold text-primary ml-1">
                                                {totalBill > 0 ? ((totalSponsored / totalBill) * 100).toFixed(0) : 0}%
                                            </span> average cost reduction for participants.
                                        </p>
                                    </div>
                                    <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-foreground/[0.02] border border-foreground/5 hover:border-amber-500/20 transition-all">
                                        <div className="flex items-center gap-2 mb-2 sm:mb-4">
                                            <Tag className="w-4 h-4 text-amber-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Density Metric</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Session density: <span className="font-bold text-foreground">{people.length}</span> members sharing <span className="font-bold text-foreground">{items.length}</span> items.
                                            Average commitment: <span className="font-bold text-primary">{formatCurrency(totalBill / (people.length || 1))}</span>.
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

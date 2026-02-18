import { useBillState } from "@/hooks/useBillState";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Download, TableIcon, BarChart3, PieChartIcon, CheckCircle2, AlertTriangle, Share2, Eye, Pencil, Copy, Receipt, Tag, TrendingUp, Wallet, LayoutGrid, ArrowRight } from "lucide-react";
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
        resetBill,
        isReadOnly,
        currentBillId,
    } = useBillState();

    const [copiedView, setCopiedView] = useState(false);
    const [copiedEdit, setCopiedEdit] = useState(false);

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
            link.download = 'bill-summary.png';
            link.href = canvas.toDataURL();
            link.click();
        }
    };

    const handleCopyShare = (readOnly: boolean) => {
        const url = generateShareUrl({ people, items, globalCharges, hostId, currentBillId }, readOnly);
        navigator.clipboard.writeText(url);
        if (readOnly) {
            setCopiedView(true);
            setTimeout(() => setCopiedView(false), 2000);
        } else {
            setCopiedEdit(true);
            setTimeout(() => setCopiedEdit(false), 2000);
        }
    };

    return (
        <Card id="summary-card" className="w-full h-full flex flex-col border-none shadow-none md:border md:shadow-sm bg-background">


            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 md:px-6 md:pt-6 shrink-0">
                <CardTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-2 text-primary">
                    <Receipt className="w-5 h-5" /> Summary
                </CardTitle>
                <div className="flex gap-1.5 print:hidden" data-html2canvas-ignore>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-2 text-foreground font-bold hover:bg-primary/10 hover:text-primary transition-all border-foreground/10 px-3"
                            >
                                <Share2 className="w-3.5 h-3.5" /> Share
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2 bg-background/95 backdrop-blur-xl border-primary/20" align="end">
                            <div className="flex flex-col gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn("justify-start h-9 text-xs gap-2 font-bold", copiedView && "bg-primary/10 text-primary")}
                                    onClick={() => handleCopyShare(true)}
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    <div className="flex-1 text-left">
                                        <div className="uppercase tracking-tighter">{copiedView ? "Copied!" : "View-only Link"}</div>
                                    </div>
                                    <Copy className="w-3 h-3 opacity-40" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn("justify-start h-9 text-xs gap-2 font-bold", copiedEdit && "bg-primary/10 text-primary")}
                                    onClick={() => handleCopyShare(false)}
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                    <div className="flex-1 text-left">
                                        <div className="uppercase tracking-tighter">{copiedEdit ? "Copied!" : "Editor Link"}</div>
                                    </div>
                                    <Copy className="w-3 h-3 opacity-40" />
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Button variant="outline" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary border-foreground/10" onClick={handleDownload} title="Download Summary">
                        <Download className="w-4 h-4" />
                    </Button>
                    {!isReadOnly && (
                        <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 border-destructive/20" onClick={resetBill} title="Reset Bill">
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                <ScrollArea className="flex-1 px-4 md:px-6">
                    <div className="space-y-6 py-6 pr-3">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-card/30 rounded-2xl p-4 border border-foreground/5 transition-all hover:border-primary/20 group">
                                <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1.5 opacity-60 group-hover:text-primary transition-colors">Items</div>
                                <div className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(totalItemCost)}</div>
                            </div>
                            <div className="bg-amber-500/5 rounded-2xl p-4 border border-amber-500/20 transition-all hover:bg-amber-500/10">
                                <div className="text-[10px] text-amber-500 uppercase font-black tracking-widest mb-1.5">Extras</div>
                                <div className="text-sm font-bold text-amber-500 tabular-nums">+{formatCurrency(totalExtras)}</div>
                            </div>
                            <div className="relative overflow-hidden bg-primary/10 rounded-2xl p-4 border border-primary/20 transition-all hover:bg-primary/20 group text-primary-foreground dark:text-primary">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                                <div className="text-[10px] uppercase font-black tracking-[0.2em] mb-1.5 opacity-80">Total Bill</div>
                                <div className="text-xl font-black tabular-nums tracking-tighter drop-shadow-sm">{formatCurrency(totalBill)}</div>
                            </div>
                        </div>

                        {totalSurplus > 0.01 && (
                            <div className="bg-primary/5 rounded-xl p-3 border border-primary/20 flex items-center justify-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-primary" />
                                <span className="text-xs text-primary font-black uppercase tracking-tight">Sponsor surplus: {formatCurrency(totalSurplus)}</span>
                            </div>
                        )}

                        {/* Tabbed Content */}
                        <Tabs defaultValue="table" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 h-10 bg-muted/20 p-1 border border-foreground/5 rounded-xl">
                                <TabsTrigger value="table" className="text-xs gap-1.5 font-bold uppercase transition-all data-[state=active]:bg-background data-[state=active]:text-primary">
                                    <TableIcon className="w-3.5 h-3.5" /> Splits
                                </TabsTrigger>
                                <TabsTrigger value="pie" className="text-xs gap-1.5 font-bold uppercase transition-all data-[state=active]:bg-background data-[state=active]:text-primary">
                                    <PieChartIcon className="w-3.5 h-3.5" /> Charts
                                </TabsTrigger>
                                <TabsTrigger value="bar" className="text-xs gap-1.5 font-bold uppercase transition-all data-[state=active]:bg-background data-[state=active]:text-primary">
                                    <BarChart3 className="w-3.5 h-3.5" /> Compare
                                </TabsTrigger>
                            </TabsList>

                            {/* TABLE TAB */}
                            <TabsContent value="table" className="mt-4 space-y-6">
                                <div className="rounded-2xl border border-foreground/5 bg-card/30 overflow-hidden shadow-sm shadow-black/5">
                                    <div className="overflow-x-auto">
                                        <Table className="min-w-[300px]">
                                            <TableHeader>
                                                <TableRow className="bg-muted/30 border-b border-foreground/5">
                                                    <TableHead className="w-[90px] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Participant</TableHead>
                                                    <TableHead className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">Subtotal</TableHead>
                                                    <TableHead className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">Sponsor</TableHead>
                                                    <TableHead className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-primary whitespace-nowrap">Final Pay</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {people.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="text-center text-muted-foreground h-24 text-sm font-medium italic">
                                                            No participants yet...
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                                {people.map((p) => {
                                                    const total = totalCosts[p.id] || 0;
                                                    const pay = finalPayables[p.id] || 0;
                                                    return (
                                                        <TableRow key={p.id} className="hover:bg-primary/[0.02] transition-colors border-b border-foreground/5 last:border-0">
                                                            <TableCell className="font-bold px-4 py-3">
                                                                <span className="truncate max-w-[100px] block text-sm" title={p.name}>{p.name}</span>
                                                            </TableCell>
                                                            <TableCell className="text-right text-muted-foreground px-4 py-3 whitespace-nowrap text-xs tabular-nums">
                                                                {formatCurrency(total)}
                                                            </TableCell>
                                                            <TableCell className="text-right px-4 py-3 whitespace-nowrap text-xs tabular-nums">
                                                                {p.sponsorAmount > 0
                                                                    ? <span className="text-emerald-500 font-bold">-{formatCurrency(p.sponsorAmount)}</span>
                                                                    : <span className="text-muted-foreground/20">—</span>
                                                                }
                                                            </TableCell>
                                                            <TableCell className="text-right font-black px-4 py-3 whitespace-nowrap text-xs tabular-nums">
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
                                        <div className="border-t border-foreground/5 px-4 py-2.5 bg-muted/10 flex items-center justify-between text-[10px]">
                                            <div className="flex items-center gap-2">
                                                {isBalanced
                                                    ? <><CheckCircle2 className="w-3.5 h-3.5 text-primary" /><span className="text-primary font-black uppercase tracking-widest">Balanced</span></>
                                                    : <><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /><span className="text-amber-500 font-black uppercase tracking-widest">System Gap</span></>
                                                }
                                            </div>
                                            <div className="text-muted-foreground font-bold uppercase tracking-tighter">
                                                Net Payable: <span className="text-foreground">{formatCurrency(sumFinalPayables)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {people.length > 0 && (
                                    <div className="relative p-6 rounded-3xl bg-foreground/[0.02] border border-primary/10 overflow-hidden shadow-xl shadow-black/10 transition-all hover:bg-foreground/[0.03]">
                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="space-y-1">
                                                    <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Settlement Flows</h4>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Optimized Peer-to-Peer Payments</p>
                                                </div>
                                                <div className="px-3 py-1 bg-primary text-black rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                                                    Plan Ready
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                {settlementFlows.length > 0 ? (
                                                    settlementFlows.map((flow, idx) => {
                                                        const debtor = people.find(p => p.id === flow.from);
                                                        const creditor = people.find(p => p.id === flow.to);
                                                        if (!debtor || !creditor) return null;

                                                        return (
                                                            <div key={idx} className="flex items-center gap-4 bg-background/40 p-3 rounded-2xl border border-foreground/5 transition-transform hover:scale-[1.01]">
                                                                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                                                                    <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center font-black text-xs border border-foreground/10 text-foreground">
                                                                        {debtor.name[0]}
                                                                    </div>
                                                                    <span className="text-[9px] font-black uppercase tracking-tighter truncate max-w-[60px]">{debtor.name}</span>
                                                                </div>

                                                                <div className="flex-1 flex flex-col items-center gap-1">
                                                                    <div className="text-sm font-black text-primary tabular-nums italic">{formatCurrency(flow.amount)}</div>
                                                                    <div className="w-full h-1 bg-primary/5 rounded-full overflow-hidden relative">
                                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-shimmer" />
                                                                        <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-primary opacity-50" />
                                                                    </div>
                                                                    <div className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1">
                                                                        Transfer <ArrowRight className="w-2 h-2" />
                                                                    </div>
                                                                </div>

                                                                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                                                                    <div className="w-8 h-8 rounded-full bg-primary text-black flex items-center justify-center font-black text-xs shadow-lg shadow-primary/20">
                                                                        {creditor.name[0]}
                                                                    </div>
                                                                    <span className="text-[9px] font-black uppercase tracking-tighter truncate max-w-[60px]">{creditor.name}</span>
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
                                            {/* We filter out people who are part of any flow (as from or to) */}
                                            {(() => {
                                                const involvedIds = new Set<string>();
                                                settlementFlows.forEach(f => {
                                                    involvedIds.add(f.from);
                                                    involvedIds.add(f.to);
                                                });
                                                const settledPeople = people.filter(p => !involvedIds.has(p.id));

                                                if (settledPeople.length === 0) return null;

                                                return (
                                                    <div className="mt-6 pt-6 border-t border-foreground/5">
                                                        <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 opacity-60">Already Settled</h5>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                            {settledPeople.map(p => (
                                                                <div key={p.id} className="flex items-center gap-2 bg-foreground/[0.02] p-2 rounded-xl border border-transparent hover:border-emerald-500/20 transition-colors">
                                                                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
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
                            <TabsContent value="pie" className="mt-4 space-y-6">
                                <div className="grid gap-6">
                                    <div className="rounded-3xl border border-foreground/5 bg-card/30 p-8 shadow-sm">
                                        <div className="flex items-center gap-3 mb-8">
                                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                                <PieChartIcon className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black uppercase tracking-[0.1em]">Share Breakdown</h4>
                                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter opacity-60">Consumption per person</p>
                                            </div>
                                        </div>
                                        <CostPieChart data={pieData} />
                                    </div>

                                    {itemCostData.length > 0 && (
                                        <div className="rounded-3xl border border-foreground/5 bg-card/30 p-8 shadow-sm">
                                            <div className="flex items-center gap-3 mb-8">
                                                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                                    <LayoutGrid className="w-5 h-5 text-amber-500" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black uppercase tracking-[0.1em]">Categoric Volume</h4>
                                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter opacity-60">Distribution by menu item</p>
                                                </div>
                                            </div>
                                            <CostPieChart data={itemCostData} />
                                        </div>
                                    )}

                                    {/* Neon Insight Card */}
                                    <div className="p-6 rounded-3xl bg-primary/[0.03] border border-primary/10 flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 shadow-inner">
                                            <TrendingUp className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h5 className="text-[11px] font-black uppercase tracking-[0.2em] mb-1.5 text-primary">Consumption Insights</h5>
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
                            <TabsContent value="bar" className="mt-4 space-y-6">
                                <div className="rounded-3xl border border-foreground/5 bg-card/30 p-8 shadow-sm">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                            <BarChart3 className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black uppercase tracking-[0.1em]">Value Comparison</h4>
                                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter opacity-60">Ordered vs Sponsored vs Pay</p>
                                        </div>
                                    </div>
                                    <CompareBarChart data={barData} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-6 rounded-3xl bg-foreground/[0.02] border border-foreground/5 hover:border-primary/20 transition-all">
                                        <div className="flex items-center gap-2 mb-4">
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
                                    <div className="p-6 rounded-3xl bg-foreground/[0.02] border border-foreground/5 hover:border-amber-500/20 transition-all">
                                        <div className="flex items-center gap-2 mb-4">
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

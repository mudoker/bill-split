import { useBillState } from "@/hooks/useBillState";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Download, TableIcon, BarChart3, PieChartIcon, CheckCircle2, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import html2canvas from 'html2canvas';
import { BillSettings } from "./bill-settings";
import { CostPieChart, CompareBarChart, buildChartData } from "./summary-charts";

export function SummarySection() {
    const {
        people,
        items,
        hostId,
        globalCharges,
        setHostId,
        addGlobalCharge,
        updateGlobalCharge,
        removeGlobalCharge,
        calculate,
        resetBill
    } = useBillState();

    const { totalCosts, finalPayables, totalBill, totalExtras, totalSurplus, totalItemCost } = calculate();
    const host = people.find(p => p.id === hostId);
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

    return (
        <Card id="summary-card" className="w-full h-full flex flex-col border-none shadow-none md:border md:shadow-sm bg-background">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 md:px-6 md:pt-6 shrink-0">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <span className="text-primary">Summary</span>
                </CardTitle>
                <div className="flex gap-1.5 print:hidden" data-html2canvas-ignore>
                    <Button variant="outline" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={handleDownload} title="Download Summary">
                        <Download className="w-4 h-4" />
                    </Button>
                    <BillSettings
                        people={people}
                        hostId={hostId}
                        globalCharges={globalCharges}
                        setHostId={setHostId}
                        addGlobalCharge={addGlobalCharge}
                        updateGlobalCharge={updateGlobalCharge}
                        removeGlobalCharge={removeGlobalCharge}
                    />
                    <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={resetBill} title="Reset Bill">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                <ScrollArea className="flex-1 px-4 md:px-6">
                    <div className="space-y-4 py-4 pr-3">
                        {/* Summary Stats */}
                        <div className="bg-gradient-to-br from-primary/5 via-primary/8 to-primary/5 rounded-xl p-4 space-y-3 border border-primary/10">
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-background/80 rounded-lg p-2.5 text-center backdrop-blur-sm">
                                    <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Items</div>
                                    <div className="text-sm font-bold text-foreground leading-tight">{formatCurrency(totalItemCost)}</div>
                                </div>
                                <div className="bg-background/80 rounded-lg p-2.5 text-center backdrop-blur-sm">
                                    <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Extras</div>
                                    <div className="text-sm font-bold text-amber-600 leading-tight">{formatCurrency(totalExtras)}</div>
                                </div>
                                <div className="bg-background/80 rounded-lg p-2.5 text-center backdrop-blur-sm border-2 border-primary/20">
                                    <div className="text-[9px] text-primary uppercase font-bold tracking-wider mb-0.5">Total</div>
                                    <div className="text-sm font-bold text-primary leading-tight">{formatCurrency(totalBill)}</div>
                                </div>
                            </div>
                            {totalSurplus > 0.01 && (
                                <div className="bg-green-500/10 rounded-lg p-2 text-center border border-green-500/20">
                                    <span className="text-xs text-green-600 font-medium">💚 Sponsor surplus: {formatCurrency(totalSurplus)}</span>
                                </div>
                            )}
                        </div>

                        {/* Tabbed Content */}
                        <Tabs defaultValue="table" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 h-9">
                                <TabsTrigger value="table" className="text-xs gap-1.5">
                                    <TableIcon className="w-3.5 h-3.5" /> Splits
                                </TabsTrigger>
                                <TabsTrigger value="pie" className="text-xs gap-1.5">
                                    <PieChartIcon className="w-3.5 h-3.5" /> Charts
                                </TabsTrigger>
                                <TabsTrigger value="bar" className="text-xs gap-1.5">
                                    <BarChart3 className="w-3.5 h-3.5" /> Compare
                                </TabsTrigger>
                            </TabsList>

                            {/* TABLE TAB */}
                            <TabsContent value="table" className="mt-3">
                                <div className="rounded-lg border bg-card overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <Table className="min-w-[300px]">
                                            <TableHeader>
                                                <TableRow className="bg-muted/30">
                                                    <TableHead className="w-[90px] px-3 py-2 text-xs font-semibold">Person</TableHead>
                                                    <TableHead className="text-right px-3 py-2 text-xs font-semibold whitespace-nowrap">Subtotal</TableHead>
                                                    <TableHead className="text-right px-3 py-2 text-xs font-semibold whitespace-nowrap">Sponsored</TableHead>
                                                    <TableHead className="text-right px-3 py-2 text-xs font-semibold whitespace-nowrap">To Pay</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {people.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="text-center text-muted-foreground h-20 text-sm">
                                                            Add people to see splits
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                                {people.map((p) => {
                                                    const total = totalCosts[p.id] || 0;
                                                    const pay = finalPayables[p.id] || 0;
                                                    const isHost = p.id === hostId;
                                                    return (
                                                        <TableRow key={p.id} className={isHost ? "bg-primary/5" : "hover:bg-muted/30 transition-colors"}>
                                                            <TableCell className="font-medium px-3 py-2.5">
                                                                <div className="flex flex-col items-start gap-0.5">
                                                                    <span className="truncate max-w-[80px] block text-sm font-semibold" title={p.name}>{p.name}</span>
                                                                    {isHost && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold inline-block leading-tight">HOST</span>}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right text-muted-foreground px-3 py-2.5 whitespace-nowrap text-xs tabular-nums">
                                                                {formatCurrency(total)}
                                                            </TableCell>
                                                            <TableCell className="text-right px-3 py-2.5 whitespace-nowrap text-xs tabular-nums">
                                                                {p.sponsorAmount > 0
                                                                    ? <span className="text-green-600 font-medium">-{formatCurrency(p.sponsorAmount)}</span>
                                                                    : <span className="text-muted-foreground/40">—</span>
                                                                }
                                                            </TableCell>
                                                            <TableCell className="text-right font-bold px-3 py-2.5 whitespace-nowrap text-xs tabular-nums">
                                                                <span className={pay < 0.01 ? "text-green-600" : "text-foreground"}>
                                                                    {pay < 0.01 ? "✓ Covered" : formatCurrency(pay)}
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
                                        <div className="border-t px-3 py-2 bg-muted/20 flex items-center justify-between text-[10px]">
                                            <div className="flex items-center gap-1.5">
                                                {isBalanced
                                                    ? <><CheckCircle2 className="w-3 h-3 text-green-600" /><span className="text-green-600 font-medium">Balanced</span></>
                                                    : <><AlertTriangle className="w-3 h-3 text-amber-500" /><span className="text-amber-500 font-medium">Off by {formatCurrency(verificationDiff)}</span></>
                                                }
                                            </div>
                                            <span className="text-muted-foreground">
                                                Payable: {formatCurrency(sumFinalPayables)}
                                                {totalSponsored > 0 && ` + Sponsor: ${formatCurrency(Math.min(totalSponsored, totalBill))}`}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* PIE CHART TAB */}
                            <TabsContent value="pie" className="mt-3">
                                <div className="space-y-4">
                                    <div className="rounded-lg border bg-card p-4">
                                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Cost Share by Person</h4>
                                        <CostPieChart data={pieData} />
                                    </div>

                                    {itemCostData.length > 0 && (
                                        <div className="rounded-lg border bg-card p-4">
                                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Cost by Item</h4>
                                            <CostPieChart data={itemCostData} />
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* BAR CHART TAB */}
                            <TabsContent value="bar" className="mt-3">
                                <div className="rounded-lg border bg-card p-4">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Ordered vs To Pay</h4>
                                    <CompareBarChart data={barData} />
                                </div>
                            </TabsContent>
                        </Tabs>

                        {/* Payback Instructions */}
                        {host && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl text-sm">
                                <p className="font-bold mb-2.5 text-xs uppercase tracking-wide text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                                    💸 Payback to {host.name}
                                </p>
                                <ul className="space-y-1.5">
                                    {people
                                        .filter(p => (finalPayables[p.id] || 0) > 0.01 && p.id !== hostId)
                                        .map(p => (
                                            <li key={p.id} className="flex items-center justify-between text-xs bg-white/60 dark:bg-background/40 rounded-lg px-3 py-2 shadow-sm">
                                                <span className="font-medium text-foreground">{p.name}</span>
                                                <span className="font-bold text-primary text-sm tabular-nums">{formatCurrency(finalPayables[p.id])}</span>
                                            </li>
                                        ))
                                    }
                                    {people.filter(p => (finalPayables[p.id] || 0) > 0.01 && p.id !== hostId).length === 0 && (
                                        <li className="text-xs text-center py-3 opacity-70 text-blue-600 dark:text-blue-400">
                                            No one owes anything! 🎉
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

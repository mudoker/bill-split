import { useBillState } from "@/hooks/useBillState";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Download, TableIcon, BarChart3, PieChartIcon } from "lucide-react";
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

    const { rawCosts, finalPayables, totalBill, totalExtras, totalSurplus } = calculate();
    const host = people.find(p => p.id === hostId);
    const { pieData, barData, itemCostData } = buildChartData(people, items, rawCosts, finalPayables);

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
                        {/* Summary Cards */}
                        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-background/80 rounded-lg p-3 text-center backdrop-blur-sm">
                                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Total Bill</div>
                                    <div className="text-lg font-bold text-primary leading-tight">{formatCurrency(totalBill)}</div>
                                </div>
                                <div className="bg-background/80 rounded-lg p-3 text-center backdrop-blur-sm">
                                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Extras</div>
                                    <div className="text-lg font-bold text-amber-600 leading-tight">{formatCurrency(totalExtras)}</div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5">Tax, Service, etc.</div>
                                </div>
                            </div>
                            {totalSurplus > 0 && (
                                <div className="bg-green-500/10 rounded-lg p-2 text-center">
                                    <span className="text-xs text-green-600 font-medium">Sponsor Surplus: {formatCurrency(totalSurplus)}</span>
                                </div>
                            )}
                        </div>

                        {/* Tabbed Content */}
                        <Tabs defaultValue="table" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 h-9">
                                <TabsTrigger value="table" className="text-xs gap-1.5">
                                    <TableIcon className="w-3.5 h-3.5" /> Table
                                </TabsTrigger>
                                <TabsTrigger value="pie" className="text-xs gap-1.5">
                                    <PieChartIcon className="w-3.5 h-3.5" /> Breakdown
                                </TabsTrigger>
                                <TabsTrigger value="bar" className="text-xs gap-1.5">
                                    <BarChart3 className="w-3.5 h-3.5" /> Compare
                                </TabsTrigger>
                            </TabsList>

                            {/* TABLE TAB */}
                            <TabsContent value="table">
                                <div className="rounded-lg border bg-card overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <Table className="min-w-[320px]">
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[80px] px-2 py-2.5 text-xs">Person</TableHead>
                                                    <TableHead className="text-right px-2 py-2.5 text-xs whitespace-nowrap">Ordered</TableHead>
                                                    <TableHead className="text-right px-2 py-2.5 text-xs whitespace-nowrap">Sponsored</TableHead>
                                                    <TableHead className="text-right font-bold px-2 py-2.5 text-xs whitespace-nowrap">To Pay</TableHead>
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
                                                    const raw = rawCosts[p.id] || 0;
                                                    const pay = finalPayables[p.id] || 0;
                                                    const isHost = p.id === hostId;
                                                    return (
                                                        <TableRow key={p.id} className={isHost ? "bg-primary/5" : ""}>
                                                            <TableCell className="font-medium px-2 py-2.5">
                                                                <div className="flex flex-col items-start gap-0.5">
                                                                    <span className="truncate max-w-[75px] block text-sm" title={p.name}>{p.name}</span>
                                                                    {isHost && <span className="text-[8px] px-1 py-0.5 rounded-full bg-primary text-primary-foreground font-bold inline-block leading-tight">HOST</span>}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right text-muted-foreground px-2 py-2.5 whitespace-nowrap text-xs">
                                                                {formatCurrency(raw)}
                                                            </TableCell>
                                                            <TableCell className="text-right text-green-600 px-2 py-2.5 whitespace-nowrap text-xs">
                                                                {p.sponsorAmount > 0 ? `-${formatCurrency(p.sponsorAmount)}` : "-"}
                                                            </TableCell>
                                                            <TableCell className="text-right font-bold text-foreground px-2 py-2.5 whitespace-nowrap text-xs">
                                                                {formatCurrency(pay)}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* PIE CHART TAB */}
                            <TabsContent value="pie">
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
                            <TabsContent value="bar">
                                <div className="rounded-lg border bg-card p-4">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Ordered vs To Pay</h4>
                                    <CompareBarChart data={barData} />
                                </div>
                            </TabsContent>
                        </Tabs>

                        {/* Payback Instructions */}
                        {host && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg text-sm text-blue-800 dark:text-blue-300">
                                <p className="font-semibold mb-2 text-xs uppercase tracking-wide">Payback to {host.name}</p>
                                <ul className="space-y-1.5">
                                    {people
                                        .filter(p => (finalPayables[p.id] || 0) > 0.01 && p.id !== hostId)
                                        .map(p => (
                                            <li key={p.id} className="flex items-center justify-between text-xs bg-background/50 rounded-md px-2.5 py-1.5">
                                                <span className="font-medium">{p.name}</span>
                                                <span className="font-bold text-primary">{formatCurrency(finalPayables[p.id])}</span>
                                            </li>
                                        ))
                                    }
                                    {people.filter(p => (finalPayables[p.id] || 0) > 0.01 && p.id !== hostId).length === 0 && (
                                        <li className="text-xs text-center py-2 opacity-70">No one owes anything! 🎉</li>
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

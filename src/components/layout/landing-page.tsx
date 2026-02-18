import { useEffect } from 'react';
import { useBillStore } from "@/store/useBillStore";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Clock, ChevronRight, Calculator, Receipt, Users as UsersIcon, Play, History, MapPin, Database } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { formatCurrency } from '@/lib/format';
import { motion } from 'framer-motion';

interface LandingPageProps {
    onNewBill: () => void;
    onSelectBill: (id: string | 'current') => void;
    onLoadDemo: () => void;
}

export function LandingPage({ onNewBill, onSelectBill, onLoadDemo }: LandingPageProps) {
    const { billHistory, fetchHistory, isHydrated, people, items } = useBillStore();

    useEffect(() => {
        if (isHydrated) {
            fetchHistory();
        }
    }, [isHydrated, fetchHistory]);

    const hasActiveLocalData = people.length > 0 || items.length > 0;

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
            {/* Hero Section */}
            <div className="flex-none pt-12 pb-16 px-6 text-center space-y-6 max-w-2xl mx-auto">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex p-3 bg-foreground/5 rounded-2xl mb-2"
                >
                    <Calculator className="w-10 h-10 text-foreground/80" />
                </motion.div>
                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-4xl md:text-5xl font-black tracking-tight text-foreground"
                >
                    Split Bills. <br />Not Friendships.
                </motion.h1>
                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-muted-foreground text-lg max-w-md mx-auto"
                >
                    The smartest way to split group bills, handle sponsors, and manage late arrivals.
                </motion.p>
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col items-center gap-4 pt-4"
                >
                    <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
                        {hasActiveLocalData && (
                            <Button
                                onClick={() => onSelectBill('current')}
                                variant="outline"
                                size="lg"
                                className="h-14 px-8 text-lg font-bold gap-2 rounded-2xl border-2 transition-all hover:bg-foreground/5"
                            >
                                <Play className="w-6 h-6" /> Resume Last
                            </Button>
                        )}
                        <Button
                            onClick={onNewBill}
                            size="lg"
                            className="h-14 px-8 text-lg font-bold gap-2 rounded-2xl shadow-xl shadow-foreground/10 transition-all hover:scale-105 active:scale-95 bg-foreground text-background hover:bg-foreground/90"
                        >
                            <Plus className="w-6 h-6" /> Start New
                        </Button>
                    </div>

                    <Button
                        onClick={onLoadDemo}
                        variant="ghost"
                        size="sm"
                        className="text-xs font-bold text-muted-foreground hover:text-foreground gap-2 mt-2"
                    >
                        <Database className="w-3 h-3" /> Load Demo Data
                    </Button>
                </motion.div>
            </div>

            {/* Recent History Section */}
            <div className="flex-1 px-6 max-w-2xl mx-auto w-full flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Recent Transactions</h2>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase">Local DB</span>
                </div>

                <ScrollArea className="flex-1 pr-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="grid gap-4 pb-12"
                    >
                        {billHistory.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 rounded-3xl border-2 border-dashed bg-muted/20">
                                <Receipt className="w-12 h-12 text-muted-foreground/30" />
                                <div className="space-y-1">
                                    <p className="text-muted-foreground font-medium italic">No recent history found.</p>
                                    <p className="text-xs text-muted-foreground/60">Start your first bill to see it here!</p>
                                </div>
                            </div>
                        ) : (
                            billHistory.map((bill) => (
                                <Card
                                    key={bill.id}
                                    className="group overflow-hidden border-border/50 hover:border-foreground/20 hover:shadow-2xl hover:shadow-black/5 transition-all duration-300 cursor-pointer rounded-2xl"
                                    onClick={() => onSelectBill(bill.id)}
                                >
                                    <CardContent className="p-0">
                                        <div className="flex items-center gap-4 p-5">
                                            <div className="p-3 bg-muted rounded-xl group-hover:bg-foreground group-hover:text-background transition-colors">
                                                <Receipt className="w-6 h-6 text-muted-foreground transition-colors group-hover:text-inherit" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-lg truncate flex-1 text-foreground">
                                                        {bill.name || `Bill ${bill.id.slice(0, 8)}`}
                                                    </h3>
                                                    {bill.totalAmount !== undefined && (
                                                        <span className="text-foreground font-black tabular-nums">
                                                            {formatCurrency(bill.totalAmount)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 mt-1 text-[10px] text-muted-foreground font-medium">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDistanceToNow(new Date(bill.updated_at), { addSuffix: true })}
                                                    </div>
                                                    {bill.location && (
                                                        <div className="flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            {bill.location}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-muted group-hover:bg-foreground group-hover:text-background transition-all duration-300">
                                                    <ChevronRight className="w-5 h-5" />
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </motion.div>
                </ScrollArea>
            </div>

            {/* Feature Pills */}
            <div className="flex-none py-8 px-6 border-t bg-muted/30">
                <div className="max-w-2xl mx-auto flex flex-wrap justify-center gap-x-8 gap-y-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                    <div className="flex items-center gap-2">
                        <UsersIcon className="w-4 h-4 text-foreground/40" />
                        <span>Group Splitting</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ScanLine className="w-4 h-4 text-foreground/40" />
                        <span>Receipt Scanning</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-foreground/40" />
                        <span>Auto-Save to Local DB</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ScanLine({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
            <path d="M3 17v2a2 2 0 0 1 2 2h2" />
            <line x1="7" x2="17" y1="12" y2="12" />
        </svg>
    );
}

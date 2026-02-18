import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Settings, Percent, Banknote, Tag, MapPin, Check, CloudUpload } from "lucide-react";
import type { Person, GlobalCharge, Item } from "@/store/useBillStore";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CurrencyInput } from "@/components/shared/currency-input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from "@/components/ui/dialog";

interface BillConfigurationProps {
    people: Person[];
    hostId: string | null;
    globalCharges: GlobalCharge[];
    billName: string;
    location: string;
    items: Item[];
    setHostId: (id: string) => void;
    addGlobalCharge: (charge: Omit<GlobalCharge, 'id'>) => void;
    updateGlobalCharge: (id: string, data: Partial<GlobalCharge>) => void;
    removeGlobalCharge: (id: string) => void;
    setBillName: (name: string) => void;
    setLocation: (location: string) => void;
    onSave: () => Promise<any>;
}

export function BillConfiguration({
    people,
    hostId,
    globalCharges,
    billName,
    location,
    items,
    setHostId,
    addGlobalCharge,
    updateGlobalCharge,
    removeGlobalCharge,
    setBillName,
    setLocation,
    onSave,
}: BillConfigurationProps) {
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const totalItemCost = items.reduce((sum, item) => sum + (item.price || 0), 0);

    const handleTypeChange = (chargeId: string, currentAmount: number, currentType: 'fixed' | 'percent', targetType: 'fixed' | 'percent') => {
        if (currentType === targetType) return;

        let newAmount = currentAmount;
        if (totalItemCost > 0) {
            if (targetType === 'fixed') {
                // Convert % to fixed: (total * %) / 100
                newAmount = Math.round((totalItemCost * currentAmount) / 100);
            } else {
                // Convert fixed to %: (amount / total) * 100
                newAmount = Number(((currentAmount / totalItemCost) * 100).toFixed(1));
            }
        }

        updateGlobalCharge(chargeId, { type: targetType, amount: newAmount });
    };

    // Debounced auto-save
    useEffect(() => {
        const timer = setTimeout(async () => {
            setSaving(true);
            setSaved(false);
            try {
                await onSave();
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            } catch (e) {
                console.error(e);
            } finally {
                setSaving(false);
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [billName, location, hostId, globalCharges, onSave]);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-10 gap-2 rounded-xl bg-background border-foreground/10 hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all group"
                >
                    <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Configure Bill</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-3xl border-foreground/10 bg-background shadow-2xl">
                <DialogHeader>
                    <div className="flex items-center justify-between pr-6">
                        <div className="space-y-1">
                            <DialogTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-2 text-foreground">
                                <Settings className="w-5 h-5 text-primary" /> Configuration
                            </DialogTitle>
                            <DialogDescription className="text-[10px] uppercase font-black tracking-tighter opacity-70">
                                Setup session details and automated charges
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {saving ? (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/5 rounded-full border border-primary/10">
                                    <div className="w-2 h-2 border-[1.5px] border-primary/30 border-t-primary rounded-full animate-spin" />
                                    <span className="text-[9px] font-black uppercase text-primary tracking-widest">Saving...</span>
                                </div>
                            ) : saved ? (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 animate-in fade-in zoom-in-95">
                                    <Check className="w-2.5 h-2.5 text-primary" />
                                    <span className="text-[9px] font-black uppercase text-primary tracking-widest">Saved</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-foreground/[0.03] rounded-full border border-foreground/[0.05]">
                                    <CloudUpload className="w-2.5 h-2.5 text-muted-foreground/40" />
                                    <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest">Synced</span>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex flex-col h-[60vh] -mx-1">
                    <ScrollArea className="flex-1 px-1">
                        <div className="grid gap-8 pb-4 py-4 pr-3">
                            {/* Bill Metadata */}
                            <div className="space-y-4">
                                <Label className="text-[11px] font-black text-foreground/60 uppercase tracking-[0.2em] pl-1">Bill Details</Label>
                                <div className="grid gap-3">
                                    <div className="relative group">
                                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <Input
                                            placeholder="Bill name (e.g. Lunch at KFC)"
                                            value={billName}
                                            onChange={(e) => setBillName(e.target.value)}
                                            className="pl-12 h-12 bg-muted/20 border-foreground/5 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/40 font-bold"
                                        />
                                    </div>
                                    <div className="relative group">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <Input
                                            placeholder="Location"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            className="pl-12 h-12 bg-muted/20 border-foreground/5 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/40 font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Host Selection */}
                            <div className="space-y-4">
                                <Label className="text-[11px] font-black text-foreground/60 uppercase tracking-[0.2em] pl-1">Primary Payer (Host)</Label>
                                <Select value={hostId || ""} onValueChange={setHostId}>
                                    <SelectTrigger className="w-full h-12 bg-muted/20 border-foreground/5 rounded-xl hover:bg-primary/5 hover:border-primary/20 transition-all font-bold">
                                        <SelectValue placeholder="Who paid the bill?" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-foreground/10 bg-background">
                                        {people.map((p) => (
                                            <SelectItem key={p.id} value={p.id} className="rounded-lg font-bold">{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Extra Charges */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <Label className="text-[11px] font-black text-foreground/60 uppercase tracking-[0.2em]">Extra Charges & Taxes</Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 gap-1.5 text-[10px] font-black uppercase text-foreground hover:bg-foreground/10 rounded-full px-4 border border-foreground/10"
                                        onClick={() => addGlobalCharge({ name: "Service Tax", amount: 10, type: 'percent' })}
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Add Charge
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {globalCharges.map((charge) => (
                                        <div key={charge.id} className="group relative flex items-start gap-4 p-5 bg-muted/10 border border-foreground/[0.03] rounded-2xl transition-all hover:border-primary/20 hover:bg-muted/20">
                                            <div className="grid gap-3 flex-1">
                                                <Input
                                                    value={charge.name}
                                                    onChange={(e) => updateGlobalCharge(charge.id, { name: e.target.value })}
                                                    className="h-7 text-xs font-black bg-transparent border-none p-0 focus-visible:ring-0 placeholder:text-muted-foreground/30 text-foreground"
                                                    placeholder="Charge name..."
                                                />
                                                <div className="flex items-center gap-2">
                                                    <div className="relative flex-1">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-primary font-black z-10 pointer-events-none">
                                                            {charge.type === 'percent' ? <Percent className="w-3.5 h-3.5" /> : <Banknote className="w-3.5 h-3.5" />}
                                                        </span>
                                                        <CurrencyInput
                                                            value={charge.amount}
                                                            onChange={(val) => updateGlobalCharge(charge.id, { amount: val })}
                                                            className="h-10 pl-10 text-xs bg-background border-foreground/[0.05] focus-visible:ring-1 focus-visible:ring-primary/40 rounded-xl font-bold"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <div className="flex bg-background border border-foreground/[0.1] rounded-xl p-0.5 gap-0.5 shadow-sm">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className={cn(
                                                                "h-9 px-3 rounded-lg text-[10px] font-black transition-all",
                                                                charge.type === 'percent'
                                                                    ? "bg-foreground text-background shadow-md scale-[1.02]"
                                                                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/5 opacity-50"
                                                            )}
                                                            onClick={() => handleTypeChange(charge.id, charge.amount, charge.type, 'percent')}
                                                        >
                                                            %
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className={cn(
                                                                "h-9 px-3 rounded-lg text-[10px] font-black transition-all",
                                                                charge.type === 'fixed'
                                                                    ? "bg-foreground text-background shadow-md scale-[1.02]"
                                                                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/5 opacity-50"
                                                            )}
                                                            onClick={() => handleTypeChange(charge.id, charge.amount, charge.type, 'fixed')}
                                                        >
                                                            ₫
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors rounded-xl opacity-0 group-hover:opacity-100"
                                                onClick={() => removeGlobalCharge(charge.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}

                                    {globalCharges.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-12 text-center gap-4 rounded-3xl border border-dashed border-foreground/10 bg-muted/5">
                                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/5">
                                                <Percent className="w-6 h-6 text-primary/40" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">No automated charges</p>
                                                <p className="text-[9px] text-muted-foreground/20 px-12 leading-relaxed italic font-bold">Add Taxes or Service Fees to apply them globally.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}

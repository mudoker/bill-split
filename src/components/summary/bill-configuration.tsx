import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Settings, Percent, Banknote, Tag, MapPin, Check, CloudUpload } from "lucide-react";
import { useBillStore, type Person, type GlobalCharge, type Item } from "@/store/useBillStore";
import { cn } from "@/lib/utils";
import { CurrencyInput } from "@/components/shared/currency-input";
import { CurrencyDropdown } from "@/components/shared/currency-dropdown";
import { getCurrencySymbol } from "@/lib/currency";
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
    updatePerson: (id: string, data: Partial<Person>) => void;
    onSave: () => Promise<any>;
    qrCode: string | null;
    setQrCode: (url: string) => void;
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
    updatePerson,
    onSave,
    qrCode,
    setQrCode,
}: BillConfigurationProps) {
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const currency = useBillStore((state) => state.currency);

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
                    className="h-9 px-2.5 sm:px-3 gap-1.5 sm:gap-2 rounded-xl bg-background border-foreground/10 hover:bg-foreground/5 hover:border-foreground/20 hover:text-foreground transition-all group"
                    title="Configure Bill Settings"
                >
                    <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform shrink-0" />
                    <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Configure</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-28px)] sm:w-full max-w-lg md:max-w-2xl max-h-[86vh] max-h-[86dvh] flex flex-col p-4 sm:p-6 text-foreground shadow-2xl overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card">
                <DialogHeader className="shrink-0 pb-3 border-b border-border/60">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pr-7 sm:pr-8">
                        <div className="space-y-0.5 text-left">
                            <DialogTitle className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                                <Settings className="w-4 h-4 text-foreground/80 shrink-0" /> Configuration
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Setup session details and automated charges
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                            {saving ? (
                                <div className="flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 bg-foreground/5 rounded-full border border-foreground/10">
                                    <div className="w-2 h-2 border-[1.5px] border-foreground/30 border-t-foreground rounded-full animate-spin" />
                                    <span className="text-[9px] font-black uppercase text-foreground/80 tracking-widest">Saving...</span>
                                </div>
                            ) : saved ? (
                                <div className="flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 bg-foreground/10 rounded-full border border-foreground/20 animate-in fade-in zoom-in-95">
                                    <Check className="w-2.5 h-2.5 text-foreground" />
                                    <span className="text-[9px] font-black uppercase text-foreground tracking-widest">Saved</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 bg-foreground/[0.03] rounded-full border border-foreground/[0.05]">
                                    <CloudUpload className="w-2.5 h-2.5 text-muted-foreground/40" />
                                    <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest">Synced</span>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-3 space-y-6 pr-1">
                    <div className="grid gap-6 sm:gap-7 pb-4">
                        {/* Bill Metadata */}
                        <div className="space-y-3 sm:space-y-4">
                            <Label className="text-[11px] font-black text-foreground/60 uppercase tracking-[0.2em] pl-1">Bill Details</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                                <div className="relative group">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors pointer-events-none" />
                                    <Input
                                        placeholder="Bill name (e.g. Lunch at KFC)"
                                        value={billName}
                                        onChange={(e) => setBillName(e.target.value)}
                                        className="pl-9 h-9 bg-foreground/[0.03] border-border rounded-xl focus-visible:ring-1 focus-visible:ring-foreground/20 font-medium text-xs"
                                    />
                                </div>
                                <div className="relative group">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors pointer-events-none" />
                                    <Input
                                        placeholder="Location"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        className="pl-9 h-9 bg-foreground/[0.03] border-border rounded-xl focus-visible:ring-1 focus-visible:ring-foreground/20 font-medium text-xs"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Currency Setting */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <Label className="text-[11px] font-black text-foreground/60 uppercase tracking-[0.2em]">Currency</Label>
                                <span className="text-[10px] text-muted-foreground font-semibold">Live Frankfurter exchange rates</span>
                            </div>
                            <CurrencyDropdown variant="default" />
                            <p className="text-[10px] text-muted-foreground/80 px-1 font-medium">Switching currency automatically converts all prices and amounts using central bank rates.</p>
                        </div>

                            {/* QR Code Upload */}
                            <div className="space-y-4">
                                <Label className="text-[11px] font-black text-foreground/60 uppercase tracking-[0.2em] pl-1">Payment QR Code</Label>
                                <div className="flex flex-col gap-4 p-5 bg-muted/10 border border-foreground/[0.03] rounded-2xl">
                                    {qrCode ? (
                                        <div className="relative group w-full aspect-square max-w-[200px] mx-auto bg-white rounded-xl overflow-hidden border border-foreground/10">
                                            <img src={qrCode} alt="Payment QR" className="w-full h-full object-contain" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => setQrCode("")}
                                                    className="h-8 text-xs font-bold uppercase tracking-wider"
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-foreground/10 rounded-xl hover:border-foreground/30 hover:bg-foreground/5 transition-all text-center gap-3 cursor-pointer relative">
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            setQrCode(reader.result as string);
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                            <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center text-foreground border border-foreground/10">
                                                <CloudUpload className="w-5 h-5" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[11px] font-black uppercase tracking-wider">Upload QR Image</p>
                                                <p className="text-[9px] text-muted-foreground font-bold">Recommended for Host Payment</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Host Selection */}
                            <div className="space-y-2 sm:space-y-3">
                                <Label className="text-[11px] font-black text-foreground/60 uppercase tracking-[0.2em] pl-1">Primary Payer (Host)</Label>
                                <Select value={hostId || ""} onValueChange={setHostId}>
                                    <SelectTrigger className="w-full h-9 sm:h-10 bg-muted/20 border-foreground/5 rounded-xl hover:bg-foreground/5 hover:border-foreground/20 transition-all font-semibold text-xs sm:text-sm">
                                        <SelectValue placeholder="Who paid the bill?" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-foreground/10 bg-background">
                                        {people.map((p) => (
                                            <SelectItem key={p.id} value={p.id} className="rounded-lg font-bold">{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Upfront Payments */}
                            <div className="space-y-4">
                                <Label className="text-[11px] font-black text-foreground/60 uppercase tracking-[0.2em] pl-1">Upfront Payments</Label>
                                <div className="grid gap-2 sm:gap-3">
                                    {people.map((p) => (
                                        <div key={p.id} className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-muted/10 border border-foreground/[0.03] gap-2">
                                            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-foreground/5 flex items-center justify-center font-black text-xs text-foreground/80 border border-foreground/10 shrink-0">
                                                    {p.name[0]}
                                                </div>
                                                <span className="text-xs font-bold truncate">{p.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {p.id === hostId ? (
                                                    <div className="h-8 sm:h-9 px-2.5 sm:px-3 flex items-center justify-center bg-foreground/5 rounded-lg border border-foreground/10">
                                                        <span className="text-[9px] sm:text-[10px] font-black text-foreground/80 uppercase">Pays Remaining</span>
                                                    </div>
                                                ) : (
                                                    <CurrencyInput
                                                        value={p.paidAmount || 0}
                                                        onChange={(val) => updatePerson(p.id, { paidAmount: val })}
                                                        className="w-24 xs:w-28 sm:w-32 h-8 sm:h-9 text-right text-xs bg-background border-foreground/[0.05] focus-visible:ring-1 focus-visible:ring-foreground/20 rounded-lg font-bold tabular-nums"
                                                        showCurrencySymbol={true}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Extra Charges */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <Label className="text-[11px] font-black text-foreground/60 uppercase tracking-[0.2em]">Extra Charges & Taxes</Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 gap-1.5 text-[10px] font-black uppercase text-foreground hover:bg-foreground/10 rounded-full px-3 sm:px-4 border border-foreground/10 touch-manipulation active:scale-95"
                                        onClick={() => addGlobalCharge({ name: "Service Tax", amount: 10, type: 'percent' })}
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Add Charge
                                    </Button>
                                </div>

                                <div className="space-y-2.5 sm:space-y-3">
                                    {globalCharges.map((charge) => (
                                        <div key={charge.id} className="group relative flex items-start gap-2.5 sm:gap-4 p-3 sm:p-5 bg-muted/10 border border-foreground/[0.03] rounded-2xl transition-all hover:border-foreground/20 hover:bg-muted/20">
                                            <div className="grid gap-2 sm:gap-3 flex-1 min-w-0">
                                                <Input
                                                    value={charge.name}
                                                    onChange={(e) => updateGlobalCharge(charge.id, { name: e.target.value })}
                                                    className="h-7 text-xs font-black bg-transparent border-none p-0 focus-visible:ring-0 placeholder:text-muted-foreground/30 text-foreground"
                                                    placeholder="Charge name..."
                                                />
                                                <div className="flex items-center gap-1.5 sm:gap-2">
                                                    <div className="relative flex-1 min-w-0">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-foreground/70 font-black z-10 pointer-events-none">
                                                            {charge.type === 'percent' ? <Percent className="w-3.5 h-3.5" /> : <Banknote className="w-3.5 h-3.5" />}
                                                        </span>
                                                        <CurrencyInput
                                                            value={charge.amount}
                                                            onChange={(val) => updateGlobalCharge(charge.id, { amount: val })}
                                                            className="h-9 pl-9 text-xs bg-background border-foreground/[0.05] focus-visible:ring-1 focus-visible:ring-foreground/20 rounded-xl font-bold"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <div className="flex bg-background border border-foreground/[0.1] rounded-xl p-0.5 gap-0.5 shadow-sm shrink-0">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className={cn(
                                                                "h-8 sm:h-9 px-2 sm:px-3 rounded-lg text-[10px] font-black transition-all touch-manipulation active:scale-95",
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
                                                                "h-8 sm:h-9 px-2 sm:px-3 rounded-lg text-[10px] font-black transition-all touch-manipulation active:scale-95",
                                                                charge.type === 'fixed'
                                                                    ? "bg-foreground text-background shadow-md scale-[1.02]"
                                                                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/5 opacity-50"
                                                                )}
                                                            onClick={() => handleTypeChange(charge.id, charge.amount, charge.type, 'fixed')}
                                                        >
                                                            {getCurrencySymbol(currency)}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors rounded-xl opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shrink-0 touch-manipulation active:scale-95"
                                                onClick={() => removeGlobalCharge(charge.id)}
                                                title="Delete charge"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                            </Button>
                                        </div>
                                    ))}

                                    {globalCharges.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-12 text-center gap-4 rounded-3xl border border-dashed border-foreground/10 bg-muted/5">
                                            <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center border border-foreground/10">
                                                <Percent className="w-6 h-6 text-foreground/40" />
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
                </div>
            </DialogContent>
        </Dialog>
    );
}

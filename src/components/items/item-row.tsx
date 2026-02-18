import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Trash2, Edit2, Users, Check, X } from "lucide-react";
import { useBillStore, type Item } from "@/store/useBillStore";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { CurrencyInput } from "@/components/shared/currency-input";

export function ItemRow({ item }: { item: Item }) {
    const { updateItem, removeItem, people, isReadOnly } = useBillStore();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(item.name);
    const [price, setPrice] = useState(item.price);
    const [quantity, setQuantity] = useState(item.quantity?.toString() || "1");

    const handleSave = () => {
        updateItem(item.id, {
            name: name.trim() || item.name,
            price,
            quantity: Math.max(1, parseInt(quantity) || 1),
        });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setName(item.name);
        setPrice(item.price);
        setQuantity(item.quantity?.toString() || "1");
        setIsEditing(false);
    };

    const togglePerson = (personId: string) => {
        if (isReadOnly) return;
        const assignments = item.assignments || {};
        const newAssignments = { ...assignments };
        if (newAssignments[personId] !== undefined) {
            delete newAssignments[personId];
        } else {
            newAssignments[personId] = 1;
        }
        updateItem(item.id, { assignments: newAssignments });
    };

    const updatePersonQty = (personId: string, qty: number) => {
        if (isReadOnly) return;
        const assignments = item.assignments || {};
        const newAssignments = { ...assignments, [personId]: Math.max(0.1, qty) };
        updateItem(item.id, { assignments: newAssignments });
    };

    const toggleAll = () => {
        if (isReadOnly) return;
        const assignments = item.assignments || {};
        const allAssignedCount = people.filter(p => assignments[p.id] !== undefined).length;
        const everyoneAssigned = people.length > 0 && allAssignedCount === people.length;

        if (everyoneAssigned) {
            updateItem(item.id, { assignments: {} });
        } else {
            const newAssignments: Record<string, number> = {};
            people.forEach(p => {
                newAssignments[p.id] = assignments[p.id] || 1;
            });
            updateItem(item.id, { assignments: newAssignments });
        }
    };

    const qty = item.quantity || 1;
    const unitPrice = qty > 0 ? item.price / qty : 0;
    const assignments = item.assignments || {};
    const assignedPeopleIds = Object.keys(assignments);
    const totalClaimedQty = Object.values(assignments).reduce((sum, pQty) => {
        return sum + Math.min(pQty, qty);
    }, 0);

    const getPersonShare = (pQty: number) => {
        const cappedPQty = Math.min(pQty, qty);
        if (totalClaimedQty <= 0) return 0;

        if (totalClaimedQty >= qty) {
            return (cappedPQty / totalClaimedQty) * item.price;
        } else {
            return (cappedPQty / qty) * item.price;
        }
    };

    return (
        <div className="relative group bg-card border border-foreground/[0.05] rounded-xl p-4 hover:bg-muted/5 hover:border-primary/30 transition-all duration-200">
            {isEditing ? (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Edit Item</span>
                        <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-foreground/5" onClick={handleCancel}>
                                <X className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={handleSave}>
                                <Check className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-11 bg-background/50 border-foreground/5 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/40 font-bold px-4"
                        autoFocus
                        placeholder="Item name..."
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-foreground/60 tracking-widest pl-1">Quantity</Label>
                            <Input
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="h-10 bg-background/50 border-foreground/5 rounded-xl text-center font-bold"
                                type="number"
                                min={1}
                                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-foreground/60 tracking-widest pl-1">Total Price</Label>
                            <CurrencyInput
                                value={price}
                                onChange={setPrice}
                                className="h-10 bg-background/50 border-foreground/5 rounded-xl text-right font-bold"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                </div>
            ) : (
                    <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-black text-sm tracking-tight text-foreground truncate max-w-[200px]" title={item.name}>
                                    {item.name}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    {qty > 1 && (
                                        <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                            ×{qty}
                                        </span>
                                )}
                                    <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 tabular-nums">
                                    {formatCurrency(item.price)}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs flex-wrap">
                                {qty > 1 && (
                                    <span className="text-[10px] font-bold text-foreground/70 uppercase tracking-tighter">
                                        {formatCurrency(unitPrice)} PER UNIT
                                </span>
                            )}
                                <div className="h-3 w-[1px] bg-foreground/10 mx-1" />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-80 flex items-center gap-1.5">
                                    {assignedPeopleIds.length > 0 ? (
                                        <>
                                            <span className="bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 font-black tabular-nums">{assignedPeopleIds.length}</span> members sharing
                                        </>
                                    ) : (
                                        people.length > 0 ? "Default total split" : "Awaiting participants"
                                    )}
                            </span>
                        </div>
                    </div>
                        {!isReadOnly && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                                        < MoreHorizontal className="w-5 h-5" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-40 p-1.5 bg-background/95 backdrop-blur-xl border-primary/20 shadow-2xl" align="end">
                                    <div className="flex flex-col gap-1">
                                        <Button variant="ghost" size="sm" className="justify-start h-10 text-[10px] font-black uppercase tracking-widest gap-2" onClick={() => { setName(item.name); setPrice(item.price); setQuantity(item.quantity?.toString() || "1"); setIsEditing(true); }}>
                                            <Edit2 className="w-3.5 h-3.5" /> Edit Details
                                        </Button>
                                        <Button variant="ghost" size="sm" className="justify-start h-10 text-[10px] font-black uppercase tracking-widest gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => removeItem(item.id)}>
                                            <Trash2 className="w-3.5 h-3.5" /> Delete Item
                                        </Button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        )}
                </div>
            )}

            {/* Splits row */}
            <div className="flex flex-wrap gap-2 mt-4 items-center">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 text-[9px] font-black uppercase tracking-widest gap-1.5 border-foreground/10 bg-foreground/5 text-foreground hover:bg-foreground/10 rounded-full px-3 transition-all">
                            <Users className="w-3.5 h-3.5" />
                            {isReadOnly ? "View Splits" : (assignedPeopleIds.length > 0 ? "Modify Splits" : "Assign Shares")}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-0 bg-background/95 backdrop-blur-xl border-primary/20 shadow-2xl" align="start">
                        <div className="p-4 border-b border-foreground/5 bg-primary/5">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="font-black text-[11px] uppercase tracking-widest text-foreground truncate max-w-[140px]" title={item.name}>{item.name}</div>
                                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter opacity-70">
                                        {formatCurrency(item.price)} · {qty} units
                                    </div>
                                </div>
                                {!isReadOnly && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-[9px] font-black uppercase px-3 text-primary hover:bg-primary/10 rounded-full border border-primary/20"
                                        onClick={toggleAll}
                                    >
                                        {people.length > 0 && assignedPeopleIds.length === people.length ? "Clear all" : "Split among all"}
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="h-72">
                            <ScrollArea className="h-full w-full">
                                <div className="p-2 space-y-1">
                                    {people.map((p) => {
                                        const pQty = assignments[p.id];
                                        const isSelected = pQty !== undefined;
                                        return (
                                            <div
                                                key={p.id}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                                                    isSelected ? "bg-primary/10 border border-primary/10" : "hover:bg-foreground/5 border border-transparent"
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        "w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all",
                                                        !isReadOnly && "cursor-pointer",
                                                        isSelected
                                                            ? "border-primary bg-primary text-black"
                                                            : "border-foreground/20 bg-background/50"
                                                    )}
                                                    onClick={() => !isReadOnly && togglePerson(p.id)}
                                                >
                                                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                </div>
                                                <div className={cn("flex-1 min-w-0 pr-2", !isReadOnly && "cursor-pointer")} onClick={() => !isReadOnly && togglePerson(p.id)}>
                                                    <div className={cn("text-xs font-black tracking-tight", isSelected ? "text-foreground" : "text-muted-foreground opacity-60")}>{p.name}</div>
                                                    {isSelected && (
                                                        <div className="text-[10px] font-bold text-primary tabular-nums mt-0.5">
                                                            {formatCurrency(getPersonShare(pQty))}
                                                        </div>
                                                    )}
                                                </div>
                                                {isSelected && (
                                                    <div className="flex items-center gap-1.5 shrink-0 bg-background/50 px-2 py-1 rounded-lg border border-foreground/5">
                                                        {isReadOnly ? (
                                                            <span className="text-[11px] font-black text-foreground tabular-nums">×{pQty}</span>
                                                        ) : (
                                                            <Input
                                                                type="number"
                                                                value={pQty}
                                                                onChange={(e) => updatePersonQty(p.id, parseFloat(e.target.value) || 0.1)}
                                                                className="h-7 w-12 text-[11px] p-0 text-center font-black bg-transparent border-none focus-visible:ring-0 tabular-nums"
                                                                step={0.5}
                                                                min={0.1}
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        )}
                                                        <span className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground">parts</span>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                    {people.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-10 gap-3 opacity-30">
                                            <Users className="w-8 h-8" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Awaiting participants</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Person tags - Neon style */}
                {people.length > 0 && assignedPeopleIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {people.filter(p => assignments[p.id] !== undefined).slice(0, 8).map(p => {
                            const pQty = assignments[p.id];
                            return (
                                <div
                                    key={p.id}
                                    onClick={() => !isReadOnly && togglePerson(p.id)}
                                    className={cn(
                                        "px-2.5 py-1 rounded-lg text-[9px] border font-black uppercase tracking-tighter transition-all flex items-center gap-1.5",
                                        !isReadOnly && "cursor-pointer hover:border-primary/40 hover:bg-primary/5",
                                        "bg-foreground/[0.03] border-foreground/10 text-muted-foreground"
                                    )}
                                >
                                    <span className="truncate max-w-[60px]">{p.name}</span>
                                    {pQty !== 1 && <span className="text-amber-500 opacity-90">×{pQty}</span>}
                                </div>
                            );
                        })}
                        {assignedPeopleIds.length > 8 && (
                            <div className="px-2 py-1 rounded-lg text-[9px] font-black bg-primary/10 text-primary border border-primary/20">
                                +{assignedPeopleIds.length - 8}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

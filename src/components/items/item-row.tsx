import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MoreHorizontal, Trash2, Edit2, Users, Check, X } from "lucide-react";
import { useBillStore, type Item } from "@/store/useBillStore";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { CurrencyInput } from "@/components/shared/currency-input";

export function ItemRow({ item }: { item: Item }) {
    const { updateItem, removeItem, people } = useBillStore();
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
        const assignments = item.assignments || {};
        const newAssignments = { ...assignments, [personId]: Math.max(0.1, qty) };
        updateItem(item.id, { assignments: newAssignments });
    };

    const toggleAll = () => {
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
            // Over-assigned/Exact: Split full price proportionally
            return (cappedPQty / totalClaimedQty) * item.price;
        } else {
            // Under-assigned: Pay for your specific consumption
            return (cappedPQty / qty) * item.price;
        }
    };

    return (
        <div className="relative group bg-card border rounded-xl p-3.5 hover:shadow-md hover:border-primary/20 transition-all duration-200">
            {isEditing ? (
                <div className="space-y-2.5 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Edit Item</span>
                        <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={handleCancel}>
                                <X className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-100" onClick={handleSave}>
                                <Check className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-sm w-full" autoFocus placeholder="Item name" onKeyDown={(e) => e.key === 'Enter' && handleSave()} />
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <label className="text-[10px] text-muted-foreground shrink-0 w-7">Qty</label>
                            <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} className="h-8 text-center text-sm p-1" type="number" min={1} onKeyDown={(e) => e.key === 'Enter' && handleSave()} />
                        </div>
                        <div className="flex items-center gap-1.5 flex-[2] min-w-0">
                            <label className="text-[10px] text-muted-foreground shrink-0 w-7">Total</label>
                            <CurrencyInput value={price} onChange={setPrice} className="h-8 text-sm text-right" placeholder="Price" />
                        </div>
                    </div>
                </div>
            ) : (
                    <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 pr-2">
                        <div className="font-medium flex items-center gap-2 flex-wrap">
                                <span className="truncate text-sm" title={item.name}>{item.name}</span>
                            <span className="shrink-0 flex items-center gap-1.5 font-mono">
                                    {qty > 1 && (
                                        <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded font-normal">×{qty}</span>
                                )}
                                    <span className="text-muted-foreground text-xs font-semibold bg-secondary px-1.5 py-0.5 rounded">
                                    {formatCurrency(item.price)}
                                </span>
                            </span>
                        </div>
                            <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground flex-wrap">
                                {qty > 1 && (
                                    <span className="text-[10px] font-medium text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded">
                                        {formatCurrency(unitPrice)} / unit
                                </span>
                            )}
                                <span className="text-[10px] text-muted-foreground/80">
                                    {assignedPeopleIds.length > 0
                                        ? `Shared by ${assignedPeopleIds.length} ${assignedPeopleIds.length === 1 ? 'person' : 'people'}`
                                        : (people.length > 0 ? "Split equally (default)" : "No people yet")}
                            </span>
                        </div>
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0 -mr-1">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-32 p-1" align="end">
                                <div className="flex flex-col gap-0.5">
                                    <Button variant="ghost" size="sm" className="justify-start h-8 text-xs w-full" onClick={() => { setName(item.name); setPrice(item.price); setQuantity(item.quantity?.toString() || "1"); setIsEditing(true); }}>
                                    <Edit2 className="w-3 h-3 mr-2" /> Edit
                                </Button>
                                <Button variant="ghost" size="sm" className="justify-start h-8 text-xs w-full text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => removeItem(item.id)}>
                                    <Trash2 className="w-3 h-3 mr-2" /> Delete
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            )}

            {/* Splits row */}
            <div className="flex flex-wrap gap-1.5 mt-2.5 items-center">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1 border-dashed px-2 bg-transparent hover:bg-secondary/50">
                            <Users className="w-3 h-3" />
                            {assignedPeopleIds.length > 0 ? "Edit Splits" : "Assign People"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-0" align="start">
                        <div className="p-3 border-b bg-muted/30">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-xs truncate max-w-[140px]" title={item.name}>{item.name}</div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5">
                                        {formatCurrency(item.price)} · {qty} {qty === 1 ? 'unit' : 'units'}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-[10px] px-2 text-primary hover:text-primary/80"
                                    onClick={toggleAll}
                                >
                                    {people.length > 0 && assignedPeopleIds.length === people.length ? "Deselect All" : "Select All"}
                                </Button>
                            </div>
                        </div>
                        <ScrollArea className="max-h-60">
                            <div className="p-2 space-y-0.5">
                                {people.map((p) => {
                                    const pQty = assignments[p.id];
                                    const isSelected = pQty !== undefined;
                                    return (
                                        <div
                                            key={p.id}
                                            className={cn(
                                                "flex items-center gap-2 px-2 py-2 rounded-lg transition-all duration-150",
                                                isSelected ? "bg-primary/5 shadow-sm" : "hover:bg-muted/50"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer shrink-0 transition-all",
                                                    isSelected
                                                        ? "border-primary bg-primary text-primary-foreground scale-105"
                                                        : "border-muted-foreground/40 bg-background hover:border-primary/50"
                                                )}
                                                onClick={() => togglePerson(p.id)}
                                            >
                                                {isSelected && <Check className="w-2.5 h-2.5" />}
                                            </div>
                                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => togglePerson(p.id)}>
                                                <div className={cn("text-xs truncate", isSelected ? "font-semibold" : "text-muted-foreground")}>{p.name}</div>
                                                {isSelected && (
                                                    <div className="text-[10px] text-muted-foreground font-medium">
                                                        {formatCurrency(getPersonShare(pQty))}
                                                    </div>
                                                )}
                                            </div>
                                            {isSelected && (
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <Input
                                                        type="number"
                                                        value={pQty}
                                                        onChange={(e) => updatePersonQty(p.id, parseFloat(e.target.value) || 0.1)}
                                                        className="h-7 w-14 text-[11px] p-1 text-center font-medium"
                                                        step={0.5}
                                                        min={0.1}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                    <span className="text-[10px] text-muted-foreground/60">shares</span>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                                {people.length === 0 && (
                                    <div className="text-xs text-center py-6 text-muted-foreground">
                                        Add people first to assign splits
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                        {assignedPeopleIds.length > 0 && (
                            <div className="p-2 border-t bg-muted/20">
                                <div className="flex items-center justify-between text-[10px] text-muted-foreground px-2">
                                    <span>{assignedPeopleIds.length} {assignedPeopleIds.length === 1 ? 'person' : 'people'} sharing</span>
                                    <span className="font-medium text-foreground">{formatCurrency(item.price)}</span>
                                </div>
                            </div>
                        )}
                    </PopoverContent>
                </Popover>

                {/* Person tags */}
                {people.length > 0 && assignedPeopleIds.length > 0 && (
                    <>
                        {people.filter(p => assignments[p.id] !== undefined).slice(0, 10).map(p => {
                            const pQty = assignments[p.id];
                            return (
                                <div
                                    key={p.id}
                                    onClick={() => togglePerson(p.id)}
                                    className="px-2 py-0.5 rounded-full text-[10px] border cursor-pointer select-none transition-all hover:shadow-sm bg-primary/8 border-primary/15 text-primary font-medium flex items-center gap-1"
                                    title={`${p.name}: ${formatCurrency(getPersonShare(pQty))}`}
                                >
                                    <span className="truncate max-w-[60px]">{p.name}</span>
                                    {pQty !== 1 && <span className="opacity-60 font-bold">×{pQty}</span>}
                                </div>
                            );
                        })}
                        {assignedPeopleIds.length > 10 && (
                            <span
                                className="text-[10px] text-muted-foreground self-center bg-secondary px-1.5 py-0.5 rounded-full cursor-help hover:bg-secondary/80 transition-colors"
                                title={people
                                    .filter(p => assignments[p.id] !== undefined)
                                    .slice(10)
                                    .map(p => `${p.name} (${formatCurrency(getPersonShare(assignments[p.id]))})`)
                                    .join("\n")
                                }
                            >
                                +{assignedPeopleIds.length - 10}
                            </span>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

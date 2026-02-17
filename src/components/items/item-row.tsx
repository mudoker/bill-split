import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MoreHorizontal, Trash2, Edit2, Users, Check } from "lucide-react";
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
            name,
            price,
            quantity: parseInt(quantity) || 1
        });
        setIsEditing(false);
    };

    const togglePerson = (personId: string) => {
        const current = new Set(item.involvedPeopleIds);
        if (current.has(personId)) {
            current.delete(personId);
        } else {
            current.add(personId);
        }
        updateItem(item.id, { involvedPeopleIds: Array.from(current) });
    };

    const toggleAll = () => {
        if (item.involvedPeopleIds.length === people.length) {
            updateItem(item.id, { involvedPeopleIds: [] });
        } else {
            updateItem(item.id, { involvedPeopleIds: people.map(p => p.id) });
        }
    };

    const perItemPrice = (item.quantity || 1) > 1 ? item.price / (item.quantity || 1) : null;

    return (
        <div className="relative group bg-card border rounded-lg p-3 hover:shadow-md hover:border-primary/20 transition-all duration-200">
            {isEditing ? (
                <div className="flex items-center gap-2 mb-2 animate-in fade-in zoom-in-95">
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-sm flex-1" autoFocus placeholder="Item name" />
                    <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} className="h-8 w-14 text-center text-sm p-1" type="number" min={1} placeholder="Qty" />
                    <div className="w-24">
                        <CurrencyInput value={price} onChange={setPrice} className="h-8 text-sm text-right" placeholder="Price" />
                    </div>
                    <Button size="sm" onClick={handleSave} variant="ghost" className="h-8 w-8 text-green-600 hover:bg-green-100 hover:text-green-700 p-0"><Check className="w-4 h-4" /></Button>
                </div>
            ) : (
                <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0 pr-2">
                        <div className="font-medium flex items-center gap-2 flex-wrap">
                            <span className="truncate" title={item.name}>
                                {item.name}
                            </span>
                            <span className="shrink-0 flex items-center gap-1.5 font-mono">
                                {(item.quantity || 1) > 1 && (
                                    <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded font-normal">
                                        ×{item.quantity}
                                    </span>
                                )}
                                <span className="text-muted-foreground text-xs font-normal bg-secondary px-1.5 py-0.5 rounded">
                                    {formatCurrency(item.price)}
                                </span>
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            {perItemPrice && (
                                <span className="text-[10px] opacity-70">
                                    ({formatCurrency(perItemPrice)}/ea)
                                </span>
                            )}
                            <span className="text-[10px]">
                                {item.involvedPeopleIds.length > 0
                                    ? <span className="text-primary/80">Shared by {item.involvedPeopleIds.length}</span>
                                    : (people.length > 0 ? "Everyone (default)" : "No people yet")}
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
                            <div className="flex flex-col gap-1">
                                <Button variant="ghost" size="sm" className="justify-start h-8 text-xs w-full" onClick={() => setIsEditing(true)}>
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

            <div className="flex flex-wrap gap-1 mt-1">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1 border-dashed px-2 bg-transparent hover:bg-secondary/50">
                            <Users className="w-3 h-3" />
                            {item.involvedPeopleIds.length > 0 ? "Edit" : "Assign"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2" align="start">
                        <div className="space-y-1">
                            <div className="flex items-center justify-between mb-2 px-2">
                                <div className="font-medium text-xs text-muted-foreground">Who shared this?</div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-[10px] px-2 text-primary hover:text-primary/80"
                                    onClick={toggleAll}
                                >
                                    {item.involvedPeopleIds.length === people.length ? "Deselect All" : "Select All"}
                                </Button>
                            </div>
                            <ScrollArea className="h-48 pr-2">
                                {people.map((p) => {
                                    const isSelected = item.involvedPeopleIds.includes(p.id);
                                    return (
                                        <div
                                            key={p.id}
                                            className={cn(
                                                "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors mb-1",
                                                isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                                            )}
                                            onClick={() => togglePerson(p.id)}
                                        >
                                            <div className={cn("w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors shadow-sm", isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground bg-background")}>
                                                {isSelected && <Check className="w-2.5 h-2.5" />}
                                            </div>
                                            {p.name}
                                        </div>
                                    )
                                })}
                                {people.length === 0 && <div className="text-xs text-center py-4 text-muted-foreground">Add people first!</div>}
                            </ScrollArea>
                        </div>
                    </PopoverContent>
                </Popover>

                {people.length > 0 && item.involvedPeopleIds.length > 0 && people.slice(0, 5).map(p => {
                    const isSelected = item.involvedPeopleIds.includes(p.id);
                    if (!isSelected) return null;
                    return (
                        <div
                            key={p.id}
                            onClick={() => togglePerson(p.id)}
                            className="px-2 py-0.5 rounded-full text-[10px] border cursor-pointer select-none transition-all bg-primary/10 border-primary/20 text-primary font-medium"
                        >
                            {p.name}
                        </div>
                    );
                })}
                {item.involvedPeopleIds.length > 5 && (
                    <span className="text-[10px] text-muted-foreground self-center bg-secondary px-1.5 rounded-full">+{item.involvedPeopleIds.length - 5}</span>
                )}
            </div>
        </div>
    );
}

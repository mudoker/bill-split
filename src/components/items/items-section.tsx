import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Receipt, ScanLine } from "lucide-react";
import { useBillStore } from "@/store/useBillStore";
import { cn } from "@/lib/utils";
import { BillUploader } from "./bill-uploader";
import { ItemRow } from "./item-row";
import { CurrencyInput } from "@/components/shared/currency-input";
import { formatCurrency } from "@/lib/format";

export function ItemsSection() {
    const { items, addItem, isReadOnly } = useBillStore();
    const [newItemName, setNewItemName] = useState("");
    const [newItemPrice, setNewItemPrice] = useState(0);
    const [newItemQuantity, setNewItemQuantity] = useState("1");
    const [showScanner, setShowScanner] = useState(false);

    const handleAdd = () => {
        const quantity = Math.max(1, parseInt(newItemQuantity) || 1);
        if (newItemName.trim() && newItemPrice > 0) {
            addItem(newItemName.trim(), newItemPrice, quantity);
            setNewItemName("");
            setNewItemPrice(0);
            setNewItemQuantity("1");
        }
    };

    const totalItemsCost = items.reduce((sum, item) => sum + item.price, 0);

    return (
        <Card className="w-full h-full flex flex-col border border-foreground/[0.05] bg-card/20 overflow-hidden shadow-none">
            <CardHeader className="pb-4 flex-row items-center justify-between space-y-0 px-4 pt-4 md:px-6 md:pt-6 shrink-0">
                <div className="flex flex-col gap-1">
                    <CardTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-2 text-foreground">
                        <Receipt className="w-5 h-5 text-primary" />
                        Bill Items
                        {items.length > 0 && (
                            <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                                {items.length} · {formatCurrency(totalItemsCost)}
                            </span>
                        )}
                    </CardTitle>
                    <CardDescription className="text-[10px] uppercase font-bold tracking-tight opacity-70">Add items manually or scan a receipt</CardDescription>
                </div>
                {!isReadOnly && (
                    <Button variant="ghost" size="icon" onClick={() => setShowScanner(!showScanner)} className={cn("h-10 w-10 text-muted-foreground hover:text-primary transition-all rounded-xl", showScanner && "text-primary bg-primary/10")}>
                        <ScanLine className="w-5 h-5" />
                    </Button>
                )}
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                <ScrollArea className="flex-1 px-4 md:px-6">
                    <div className="space-y-4 py-4 pr-3">
                        {showScanner && !isReadOnly && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <BillUploader onScanComplete={() => setShowScanner(false)} />
                            </div>
                        )}

                        {/* Add Item Form */}
                        {!isReadOnly && (
                            <div className="relative group p-4 rounded-xl bg-card border border-foreground/[0.05] overflow-hidden">
                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                <div className="relative space-y-3">
                                    <Input
                                        placeholder="Item name (e.g. Wagyu Beef)..."
                                        value={newItemName}
                                        onChange={(e) => setNewItemName(e.target.value)}
                                        className="h-11 bg-background/50 border-foreground/5 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/40 font-bold px-4"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                    />
                                    <div className="flex gap-3 items-center">
                                        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                            <label className="text-[10px] font-black uppercase text-foreground/60 tracking-widest pl-1">Quantity</label>
                                            <Input
                                                type="number"
                                                placeholder="1"
                                                value={newItemQuantity}
                                                onChange={(e) => setNewItemQuantity(e.target.value)}
                                                className="h-10 bg-background/50 border-foreground/5 rounded-xl text-center font-bold"
                                                min={1}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5 flex-[2] min-w-0">
                                            <label className="text-[10px] font-black uppercase text-foreground/60 tracking-widest pl-1">Total Price</label>
                                            <CurrencyInput
                                                value={newItemPrice}
                                                onChange={setNewItemPrice}
                                                className="h-10 bg-background/50 border-foreground/5 rounded-xl text-right"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5 shrink-0">
                                            <label className="text-[10px] opacity-0">Add</label>
                                            <Button onClick={handleAdd} size="icon" className="h-10 w-10 bg-primary text-black hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all" disabled={!newItemName.trim() || newItemPrice <= 0}>
                                                <Plus className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Item List */}
                        <div className="space-y-2.5 pb-4">
                            {items.length === 0 && (
                                <div className="text-center text-muted-foreground py-10 text-sm border-2 border-dashed rounded-xl bg-muted/10">
                                    No items added yet.<br />
                                    <span className="text-xs opacity-70">Add manually or click the scan icon above.</span>
                                </div>
                            )}
                            {items.map((item) => (
                                <ItemRow key={item.id} item={item} />
                            ))}
                        </div>
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

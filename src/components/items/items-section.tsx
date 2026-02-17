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
    const { items, addItem } = useBillStore();
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
        <Card className="w-full h-full flex flex-col border-none shadow-none md:border md:shadow-sm">
            <CardHeader className="pb-3 flex-row items-center justify-between space-y-0 px-4 pt-4 md:px-6 md:pt-6">
                <div className="flex flex-col gap-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-primary" />
                        Bill Items
                        {items.length > 0 && (
                            <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                                {items.length} · {formatCurrency(totalItemsCost)}
                            </span>
                        )}
                    </CardTitle>
                    <CardDescription>Add items manually or scan a receipt</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowScanner(!showScanner)} className={cn("text-muted-foreground hover:text-primary transition-colors", showScanner && "text-primary bg-primary/10")}>
                    <ScanLine className="w-5 h-5" />
                </Button>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                <ScrollArea className="flex-1 px-4 md:px-6">
                    <div className="space-y-4 py-4 pr-3">
                        {showScanner && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <BillUploader onScanComplete={() => setShowScanner(false)} />
                            </div>
                        )}

                        {/* Add Item Form */}
                        <div className="rounded-xl bg-card border shadow-sm overflow-hidden">
                            <div className="p-3 space-y-2">
                                <Input
                                    placeholder="Item name..."
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    className="h-9 text-sm"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                />
                                <div className="flex gap-2 items-center">
                                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                        <label className="text-[10px] text-muted-foreground shrink-0 w-6">Qty</label>
                                        <Input
                                            type="number"
                                            placeholder="1"
                                            value={newItemQuantity}
                                            onChange={(e) => setNewItemQuantity(e.target.value)}
                                            className="h-8 text-center text-sm"
                                            min={1}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                        />
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-[2] min-w-0">
                                        <label className="text-[10px] text-muted-foreground shrink-0 w-6">Total</label>
                                        <CurrencyInput
                                            value={newItemPrice}
                                            onChange={setNewItemPrice}
                                            className="h-8 text-right text-sm"
                                            placeholder="Price"
                                        />
                                    </div>
                                    <Button onClick={handleAdd} size="icon" className="shrink-0 h-8 w-8" disabled={!newItemName.trim() || newItemPrice <= 0}>
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

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

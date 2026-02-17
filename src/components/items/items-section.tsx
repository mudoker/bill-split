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

export function ItemsSection() {
    const { items, addItem } = useBillStore();
    const [newItemName, setNewItemName] = useState("");
    const [newItemPrice, setNewItemPrice] = useState(0);
    const [newItemQuantity, setNewItemQuantity] = useState("1");
    const [showScanner, setShowScanner] = useState(false);

    const handleAdd = () => {
        const quantity = parseInt(newItemQuantity) || 1;
        if (newItemName.trim() && newItemPrice > 0) {
            addItem(newItemName.trim(), newItemPrice, quantity);
            setNewItemName("");
            setNewItemPrice(0);
            setNewItemQuantity("1");
        }
    };

    return (
        <Card className="w-full h-full flex flex-col border-none shadow-none md:border md:shadow-sm">
            <CardHeader className="pb-3 flex-row items-center justify-between space-y-0 px-4 pt-4 md:px-6 md:pt-6">
                <div className="flex flex-col gap-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-primary" />
                        Bill Items
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

                        <div className="flex gap-2 items-center p-2 rounded-lg bg-card border shadow-sm">
                            <Input
                                placeholder="Item name..."
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                className="flex-1 h-9"
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            />
                            <Input
                                type="number"
                                placeholder="Qty"
                                value={newItemQuantity}
                                onChange={(e) => setNewItemQuantity(e.target.value)}
                                className="w-14 shrink-0 text-center h-9"
                                min={1}
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            />
                            <div className="w-28 shrink-0">
                                <CurrencyInput
                                    value={newItemPrice}
                                    onChange={setNewItemPrice}
                                    className="h-9 text-right text-sm"
                                    placeholder="Price"
                                />
                            </div>
                            <Button onClick={handleAdd} size="icon" className="shrink-0 h-9 w-9">
                                <Plus className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="space-y-3 pb-4">
                            {items.length === 0 && (
                                <div className="text-center text-muted-foreground py-8 text-sm border-2 border-dashed rounded-lg bg-muted/10">
                                    No items added yet.<br />
                                    <span className="text-xs opacity-70">Add manually or click the scan icon.</span>
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

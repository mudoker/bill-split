import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tag, MapPin, User, ArrowRight, ReceiptText, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CreateBillFormData {
  name: string;
  location: string;
  hostName?: string;
  currency?: 'VND' | 'USD';
}

interface CreateBillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateBillFormData) => void;
}

export function CreateBillModal({ open, onOpenChange, onSubmit }: CreateBillModalProps) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [hostName, setHostName] = useState('');
  const [currency, setCurrency] = useState<'VND' | 'USD'>('VND');
  const [error, setError] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) {
      setError('Please enter a bill name');
      return;
    }
    setError('');
    onSubmit({
      name: name.trim(),
      location: location.trim(),
      hostName: hostName.trim() || undefined,
      currency,
    });
    setName('');
    setLocation('');
    setHostName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] rounded-3xl border-foreground/10 bg-background shadow-2xl p-6">
        <DialogHeader className="space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-foreground/5 border border-foreground/10 flex items-center justify-center text-foreground mb-1">
            <ReceiptText className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-black uppercase tracking-tight">
            Create New Bill
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-medium">
            Enter basic information before entering the bill page.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="bill-name" className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-muted-foreground" /> Bill Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="bill-name"
              placeholder="e.g. Friday BBQ, Team Lunch, Trip to Da Lat"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              autoFocus
              className="h-11 bg-muted/20 border-foreground/10 focus-visible:ring-foreground/20 rounded-xl font-bold"
            />
            {error && (
              <p className="text-[11px] font-bold text-destructive pl-1">{error}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bill-location" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Venue / Location (Optional)
            </Label>
            <Input
              id="bill-location"
              placeholder="e.g. Gyu-Kaku, District 1"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-11 bg-muted/20 border-foreground/10 focus-visible:ring-foreground/20 rounded-xl font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bill-host" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Host / Payer (Optional)
            </Label>
            <Input
              id="bill-host"
              placeholder="e.g. Alex"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              className="h-11 bg-muted/20 border-foreground/10 focus-visible:ring-foreground/20 rounded-xl font-bold"
            />
            <p className="text-[10px] text-muted-foreground/60 pl-1">
              Creates the first participant and sets them as the payer.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5" /> Currency
            </Label>
            <div className="grid grid-cols-2 gap-2 bg-muted/20 p-1 rounded-2xl border border-foreground/10">
              <button
                type="button"
                onClick={() => setCurrency('VND')}
                className={cn(
                  "flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black transition-all",
                  currency === 'VND'
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                )}
              >
                <span>₫</span>
                <span>VND</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={cn(
                  "flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black transition-all",
                  currency === 'USD'
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                )}
              >
                <span>$</span>
                <span>USD</span>
              </button>
            </div>
          </div>

          <DialogFooter className="pt-3 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim()}
              className="rounded-xl font-bold gap-2 px-5 bg-foreground text-background hover:bg-foreground/90 shadow-md"
            >
              Continue to Bill <ArrowRight className="w-4 h-4" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

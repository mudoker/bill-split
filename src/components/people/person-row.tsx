import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, PlusCircle, Check, X, Heart, Pencil, Banknote } from "lucide-react";
import { useBillStore, type Person } from "@/store/useBillStore";
import { formatCurrency } from "@/lib/format";
import { CurrencyInput } from "@/components/shared/currency-input";
import { cn } from "@/lib/utils";
import { getAvatarColor, getInitials } from "@/constants/colors";

interface PersonRowProps {
    person: Person;
    index: number;
    onUpdate: (id: string, data: Partial<Person>) => void;
    onRemove: (id: string) => void;
}

export function PersonRow({ person, index, onUpdate, onRemove }: PersonRowProps) {
    const { isReadOnly } = useBillStore();
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(person.name);
    const [editSponsor, setEditSponsor] = useState(person.sponsorAmount);
    const [editPaid, setEditPaid] = useState(person.paidAmount || 0);

    const avatarGradient = getAvatarColor(person.name);
    const initials = getInitials(person.name);

    const handleStartEdit = () => {
        if (isReadOnly) return;
        setEditName(person.name);
        setEditSponsor(person.sponsorAmount);
        setEditPaid(person.paidAmount || 0);
        setIsEditing(true);
    };

    const handleSave = () => {
        onUpdate(person.id, {
            name: editName,
            sponsorAmount: editSponsor,
            paidAmount: editPaid
        });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditName(person.name);
        setEditSponsor(person.sponsorAmount);
        setEditPaid(person.paidAmount || 0);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="border-2 border-primary/30 bg-primary/5 rounded-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200 shadow-xl shadow-primary/5">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Edit Participant</span>
                    <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-foreground/5" onClick={handleCancel}>
                            <X className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={handleSave}>
                            <Check className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-foreground/40 tracking-widest pl-1">Identity</Label>
                    <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-11 bg-background/50 border-foreground/5 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/40 font-bold"
                        placeholder="Name..."
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-foreground/40 tracking-widest pl-1 flex items-center gap-1.5">
                            <Banknote className="w-3 h-3 text-emerald-500" /> Paid
                        </Label>
                        <CurrencyInput
                            value={editPaid}
                            onChange={(val) => setEditPaid(val)}
                            className="h-11 bg-background/50 border-foreground/5 rounded-xl text-xs font-mono"
                            placeholder="Amount paid"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-foreground/40 tracking-widest pl-1 flex items-center gap-1.5">
                            <Heart className="w-3 h-3 text-amber-500" /> Sponsor
                        </Label>
                        <CurrencyInput
                            value={editSponsor}
                            onChange={(val) => setEditSponsor(val)}
                            className="h-11 bg-background/50 border-foreground/5 rounded-xl text-xs font-mono"
                            placeholder="Sponsor amt"
                        />
                    </div>
                </div>
                <p className="text-[10px] text-foreground/80 font-medium italic px-1">Tip: Use "Paid" if this person paid part of the bill at the restaurant.</p>
            </div>
        );
    }

    return (
        <div
            className="group relative flex items-center gap-3 p-3 bg-card border border-foreground/[0.05] rounded-xl hover:bg-card/80 hover:border-primary/30 transition-all duration-200 cursor-default animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0",
                avatarGradient
            )}>
                {initials}
            </div>

            <div className="flex flex-col min-w-0 flex-1">
                <span className="font-black text-sm tracking-tight text-foreground">{person.name}</span>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                    {person.paidAmount > 0 && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                            <Banknote className="w-3 h-3 text-emerald-500" />
                            <span className="text-[10px] font-black text-emerald-500 tabular-nums uppercase">{formatCurrency(person.paidAmount)} paid</span>
                        </div>
                    )}
                    {person.sponsorAmount > 0 && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 rounded-full border border-amber-500/20">
                            <Heart className="w-3 h-3 text-amber-500" />
                            <span className="text-[10px] font-black text-amber-500 tabular-nums uppercase">{formatCurrency(person.sponsorAmount)} spon.</span>
                        </div>
                    )}
                    {!(person.paidAmount > 0) && !(person.sponsorAmount > 0) && !isReadOnly && (
                        <button
                            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-foreground/[0.05] border border-foreground/[0.1] text-[9px] font-black uppercase tracking-wider text-muted-foreground/70 hover:text-primary hover:border-primary/40 transition-all"
                            onClick={handleStartEdit}
                        >
                            <PlusCircle className="w-2.5 h-2.5" /> Sponsor
                        </button>
                    )}
                </div>
            </div>

            {!isReadOnly && (
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shrink-0">
                    <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl" onClick={handleStartEdit} title="Edit">
                        <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl" onClick={() => onRemove(person.id)} title="Remove">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}

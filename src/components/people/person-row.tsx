import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, PlusCircle, Check, X, Heart, Pencil, Banknote, User } from "lucide-react";
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
    const { isReadOnly, hostId } = useBillStore();
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(person.name);
    const [editEmail, setEditEmail] = useState(person.email || '');
    const [editSponsor, setEditSponsor] = useState(person.sponsorAmount);
    const [editPaid, setEditPaid] = useState(person.paidAmount || 0);

    const avatarGradient = getAvatarColor(person.name);
    const initials = getInitials(person.name);
    const isAppMember = Boolean(person.userId || person.email);

    const handleStartEdit = () => {
        if (isReadOnly) return;
        setEditName(person.name);
        setEditEmail(person.email || '');
        setEditSponsor(person.sponsorAmount);
        setEditPaid(person.paidAmount || 0);
        setIsEditing(true);
    };

    const handleSave = () => {
        onUpdate(person.id, {
            name: editName,
            email: editEmail.trim() || null,
            sponsorAmount: editSponsor,
            paidAmount: editPaid
        });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditName(person.name);
        setEditEmail(person.email || '');
        setEditSponsor(person.sponsorAmount);
        setEditPaid(person.paidAmount || 0);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="border border-foreground/15 bg-card/60 rounded-2xl p-4 space-y-3.5 animate-in fade-in zoom-in-95 duration-200 shadow-md">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-foreground/80 uppercase tracking-[0.2em]">Edit Participant</span>
                    <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded-lg" onClick={handleCancel}>
                            <X className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-foreground hover:bg-foreground/10 rounded-lg" onClick={handleSave}>
                            <Check className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-foreground/60 tracking-widest pl-1">Identity</Label>
                    <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-9 bg-background/50 border-foreground/5 rounded-xl focus-visible:ring-1 focus-visible:ring-foreground/20 font-bold text-xs"
                        placeholder="Name..."
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-foreground/60 tracking-widest pl-1">
                        User Email (Optional - Leave blank for Anon)
                    </Label>
                    <Input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="h-9 bg-background/50 border-foreground/5 rounded-xl text-xs font-medium"
                        placeholder="e.g. friend@example.com"
                    />
                </div>

                <div className="person-edit-grid">
                    <div className="space-y-1.5 min-w-0">
                        <Label className="text-[10px] font-black uppercase text-foreground/60 tracking-widest pl-1 flex items-center gap-1.5">
                            <Banknote className="w-3 h-3 text-emerald-700 dark:text-emerald-400" /> Paid
                        </Label>
                        <CurrencyInput
                            value={editPaid}
                            onChange={(val) => setEditPaid(val)}
                            className="h-9 bg-background/50 border-foreground/5 rounded-xl text-xs font-mono font-bold"
                            showCurrencySymbol={true}
                        />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                        <Label className="text-[10px] font-black uppercase text-foreground/60 tracking-widest pl-1 flex items-center gap-1.5">
                            <Heart className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Sponsor
                        </Label>
                        <CurrencyInput
                            value={editSponsor}
                            onChange={(val) => setEditSponsor(val)}
                            className="h-9 bg-background/50 border-foreground/5 rounded-xl text-xs font-mono font-bold"
                            showCurrencySymbol={true}
                        />
                    </div>
                </div>
                <p className="text-[10px] text-muted-foreground font-medium italic px-1">Tip: If no email is provided, this person is an Anon participant.</p>
            </div>
        );
    }

    return (
        <div
            className="group relative flex items-center justify-between gap-2.5 p-2.5 sm:p-3 bg-card border border-foreground/[0.05] rounded-xl hover:bg-card/80 hover:border-foreground/20 transition-all duration-200 cursor-default animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className={cn(
                    "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0 shadow-sm",
                    avatarGradient
                )}>
                    {initials}
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm tracking-tight text-foreground truncate" title={person.name}>
                            {person.name}
                        </span>
                        {/* Anon or Member Badge */}
                        {isAppMember ? (
                            <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 text-[9px] font-black uppercase tracking-wider shrink-0"
                                title={person.email ? `Registered user: ${person.email}` : "App User"}
                            >
                                <User className="w-2.5 h-2.5" /> Member
                            </span>
                        ) : (
                            <span
                                className="inline-flex items-center px-1.5 py-0.2 rounded bg-muted/70 text-muted-foreground border border-border text-[9px] font-black uppercase tracking-wider shrink-0"
                                title="Guest participant (no account in app)"
                            >
                                Anon
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        {/* Host Badge - Pays Remaining */}
                        {person.id === hostId && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-foreground/5 rounded-full border border-foreground/10">
                                <span className="text-[10px] font-black text-foreground/80 tabular-nums uppercase">Pays Remaining</span>
                            </div>
                        )}

                        {/* Guest Paid Badge (Only if NOT host) */}
                        {person.id !== hostId && person.paidAmount > 0 && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                <Banknote className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                                <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 tabular-nums uppercase">{formatCurrency(person.paidAmount)} paid</span>
                            </div>
                        )}

                        {person.sponsorAmount > 0 && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 rounded-full border border-amber-500/20">
                                <Heart className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 tabular-nums uppercase">{formatCurrency(person.sponsorAmount)} spon.</span>
                            </div>
                        )}
                        {!(person.paidAmount > 0) && !(person.sponsorAmount > 0) && !isReadOnly && person.id !== hostId && (
                            <button
                                className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-foreground/[0.05] border border-foreground/[0.1] text-[9px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-all touch-manipulation active:scale-95"
                                onClick={handleStartEdit}
                            >
                                <PlusCircle className="w-2.5 h-2.5" /> Sponsor
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {!isReadOnly && (
                <div className="flex items-center gap-0.5 shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded-lg touch-manipulation active:scale-95" onClick={handleStartEdit} title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg touch-manipulation active:scale-95" onClick={() => onRemove(person.id)} title="Remove">
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            )}
        </div>
    );
}

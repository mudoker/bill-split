import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, PlusCircle, Check, X, Heart, Pencil } from "lucide-react";
import { type Person } from "@/store/useBillStore";
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
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(person.name);
    const [editSponsor, setEditSponsor] = useState(person.sponsorAmount);

    const avatarGradient = getAvatarColor(person.name);
    const initials = getInitials(person.name);

    const handleStartEdit = () => {
        setEditName(person.name);
        setEditSponsor(person.sponsorAmount);
        setIsEditing(true);
    };

    const handleSave = () => {
        onUpdate(person.id, {
            name: editName,
            sponsorAmount: editSponsor
        });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditName(person.name);
        setEditSponsor(person.sponsorAmount);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="border-2 border-primary/30 bg-primary/5 rounded-xl p-4 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">Edit Person</span>
                    <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={handleCancel}>
                            <X className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-100" onClick={handleSave}>
                            <Check className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Name</Label>
                    <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-9 bg-background"
                        placeholder="Person's name"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Heart className="w-3 h-3 text-pink-500" />
                        Sponsor Amount
                    </Label>
                    <CurrencyInput
                        value={editSponsor}
                        onChange={setEditSponsor}
                        className="h-9 bg-background"
                        placeholder="0 = not sponsoring"
                    />
                    <p className="text-[10px] text-muted-foreground/70">Leave at 0 if not sponsoring anyone.</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="group relative flex items-center gap-3 p-3 bg-card border rounded-xl hover:shadow-lg hover:border-primary/20 transition-all duration-300 cursor-default animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <div className={cn(
                "w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md",
                avatarGradient
            )}>
                {initials}
            </div>

            <div className="flex flex-col min-w-0 flex-1">
                <span className="font-semibold text-sm truncate">{person.name}</span>
                {person.sponsorAmount > 0 ? (
                    <div className="flex items-center gap-1 mt-0.5">
                        <Heart className="w-3 h-3 text-pink-500 fill-pink-500" />
                        <span className="text-xs text-green-600 font-medium">
                            {formatCurrency(person.sponsorAmount)}
                        </span>
                    </div>
                ) : (
                    <button
                        className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1 mt-0.5 transition-colors text-left"
                        onClick={handleStartEdit}
                    >
                        <PlusCircle className="w-3 h-3" /> Add sponsor
                    </button>
                )}
            </div>

            <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleStartEdit} title="Edit">
                    <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => onRemove(person.id)} title="Remove">
                    <Trash2 className="w-3.5 h-3.5" />
                </Button>
            </div>
        </div>
    );
}

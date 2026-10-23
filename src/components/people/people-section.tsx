import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserPlus, PlusCircle, Sparkles, UserCheck } from "lucide-react";
import { useBillStore } from "@/store/useBillStore";
import { PersonRow } from "./person-row";
import { QuickInsights } from "../summary/quick-insights";

interface UserSuggestion {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
}

export function PeopleSection() {
    const { people, addPerson, updatePerson, removePerson, isReadOnly, loadSeedData } = useBillStore();
    const [newName, setNewName] = useState("");
    const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        const term = newName.trim();
        if (term.length < 2) {
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/users/search?q=${encodeURIComponent(term)}`);
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data.users || []);
                    setShowSuggestions((data.users || []).length > 0);
                }
            } catch {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [newName]);

    const handleAdd = (email?: string, userId?: string, selectedName?: string) => {
        const participantName = (selectedName || newName).trim();
        if (participantName) {
            const isEmailFormat = participantName.includes('@');
            const resolvedEmail = email || (isEmailFormat ? participantName : null);
            const resolvedName = selectedName || (isEmailFormat ? participantName.split('@')[0] : participantName);

            addPerson(resolvedName, resolvedEmail, userId || null);
            setNewName("");
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    return (
        <Card className="w-full h-full flex flex-col border-0 md:border md:border-foreground/[0.05] bg-transparent md:bg-card/20 overflow-hidden shadow-none rounded-none md:rounded-2xl">
            <CardHeader className="pb-2.5 pt-1 px-1.5 sm:px-4 md:px-5 md:pt-5 shrink-0">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-lg sm:text-xl font-black uppercase tracking-widest flex items-center gap-2 text-foreground">
                        <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-foreground/80 shrink-0" />
                        Participants
                        {people.length > 0 && (
                            <span className="text-[10px] font-black bg-foreground/5 text-muted-foreground px-2 py-0.5 rounded-full border border-foreground/10">
                                {people.length}
                            </span>
                        )}
                    </CardTitle>
                    {people.length === 0 && !isReadOnly && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={loadSeedData}
                            className="h-7 sm:h-8 gap-1.5 text-[10px] font-black uppercase tracking-widest text-foreground/80 hover:bg-foreground/10 transition-all border border-foreground/20 rounded-full px-3"
                        >
                            <Sparkles className="w-3.5 h-3.5" /> Demo Sample
                        </Button>
                    )}
                </div>
                <CardDescription className="text-[10px] uppercase font-bold tracking-tight text-muted-foreground/90">
                    Add registered members or Anon friends
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden flex flex-col container-query-pane">
                <ScrollArea className="flex-1 px-1 sm:px-4 md:px-5">
                    <div className="space-y-4 sm:space-y-5 py-3 pr-1 sm:pr-2">
                        {!isReadOnly && (
                            <div className="relative group">
                                <div className="relative flex gap-2">
                                    <Input
                                        placeholder="Add participant name or email..."
                                        value={newName}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setNewName(val);
                                            if (val.trim().length < 2) {
                                                setSuggestions([]);
                                                setShowSuggestions(false);
                                            }
                                        }}
                                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                                        className="h-9 bg-background border-foreground/[0.05] rounded-xl focus-visible:ring-1 focus-visible:ring-foreground/20 font-bold px-3 text-xs"
                                    />
                                    <Button onClick={() => handleAdd()} size="icon" className="h-9 w-9 shrink-0 bg-foreground text-background hover:bg-foreground/90 rounded-xl transition-all active:scale-95 shadow-sm">
                                        <PlusCircle className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* Autocomplete dropdown for app users */}
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute z-20 left-0 right-12 mt-1 bg-card border border-border rounded-xl shadow-xl p-1 max-h-48 overflow-y-auto">
                                        <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase">
                                            Found App Users
                                        </div>
                                        {suggestions.map((s) => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => handleAdd(s.email, s.id, s.name || s.email.split('@')[0])}
                                                className="w-full text-left px-2.5 py-1.5 hover:bg-foreground/5 rounded-lg flex items-center justify-between text-xs"
                                            >
                                                <div className="min-w-0">
                                                    <span className="font-bold text-foreground block truncate">{s.name || s.email}</span>
                                                    <span className="text-[10px] text-muted-foreground block truncate">{s.email}</span>
                                                </div>
                                                <UserCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="people-grid">
                            {people.map((person, index) => (
                                <PersonRow
                                    key={person.id}
                                    person={person}
                                    index={index}
                                    onUpdate={updatePerson}
                                    onRemove={removePerson}
                                />
                            ))}
                        </div>
                        {people.length === 0 && (
                            <div
                                className={`flex flex-col items-center justify-center py-20 gap-6 rounded-3xl border border-dashed border-foreground/10 bg-muted/5 group ${!isReadOnly ? 'hover:border-primary/20 transition-all cursor-pointer' : ''}`}
                                onClick={() => {
                                    if (!isReadOnly) {
                                        loadSeedData();
                                    }
                                }}
                            >
                                <div className="w-16 h-16 rounded-full bg-foreground/[0.03] flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                    <UserPlus className="w-8 h-8 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                                </div>
                                <div className="text-center space-y-1.5 p-4">
                                    <p className="text-xs font-black text-muted-foreground/70 uppercase tracking-[0.2em] group-hover:text-foreground">Workspace is empty</p>
                                    <p className="text-[10px] text-muted-foreground/50 uppercase font-bold tracking-tighter leading-relaxed">
                                        Start by adding friends or <span className="text-primary/60 underline decoration-dotted underline-offset-4">loading our BBQ demo</span>
                                    </p>
                                </div>
                            </div>
                        )}
                        <div className="pt-4 mt-4 pb-8 sm:pb-6 border-t border-foreground/[0.03]">
                            <QuickInsights />
                        </div>
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

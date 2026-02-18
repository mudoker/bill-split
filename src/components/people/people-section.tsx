import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserPlus, PlusCircle, Sparkles } from "lucide-react";
import { useBillStore } from "@/store/useBillStore";
import { PersonRow } from "./person-row";
import { QuickInsights } from "../summary/quick-insights";

export function PeopleSection() {
    const { people, addPerson, updatePerson, removePerson, isReadOnly, loadSeedData } = useBillStore();
    const [newName, setNewName] = useState("");

    const handleAdd = () => {
        if (newName.trim()) {
            addPerson(newName.trim());
            setNewName("");
        }
    };

    return (
        <Card className="w-full h-full flex flex-col border border-foreground/[0.05] bg-card/20 overflow-hidden shadow-none">
            <CardHeader className="pb-4 pt-4 px-4 md:px-6 md:pt-6 shrink-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-2 text-foreground">
                        <UserPlus className="w-5 h-5 text-primary" />
                        Participants
                    </CardTitle>
                    {people.length === 0 && !isReadOnly && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={loadSeedData}
                            className="h-8 gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 transition-all border border-primary/20 rounded-full px-4"
                        >
                            <Sparkles className="w-3.5 h-3.5" /> Demo Sample
                        </Button>
                    )}
                </div>
                <CardDescription className="text-[10px] uppercase font-bold tracking-tight opacity-70">Manage friends and their payment contributions</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                <ScrollArea className="flex-1 px-4 md:px-6">
                    <div className="space-y-6 py-4 pr-3">
                        {!isReadOnly && (
                            <div className="relative group">
                                <div className="relative flex gap-2">
                                    <Input
                                        placeholder="Add a participant..."
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                                        className="h-11 bg-background border-foreground/[0.05] rounded-xl focus-visible:ring-1 focus-visible:ring-primary/30 font-bold px-4"
                                    />
                                    <Button onClick={handleAdd} size="icon" className="h-11 w-11 shrink-0 bg-foreground text-background hover:bg-foreground/90 rounded-xl transition-all active:scale-95 shadow-sm">
                                        <PlusCircle className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
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
                            <div className="flex flex-col items-center justify-center py-20 gap-6 rounded-3xl border border-dashed border-foreground/10 bg-muted/5 group hover:border-primary/20 transition-all cursor-pointer" onClick={() => !isReadOnly && loadSeedData()}>
                                <div className="w-16 h-16 rounded-full bg-foreground/[0.03] flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                    <UserPlus className="w-8 h-8 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                                </div>
                                <div className="text-center space-y-1.5 p-4">
                                    <p className="text-xs font-black text-muted-foreground/70 uppercase tracking-[0.2em] group-hover:text-foreground">Workspace is empty</p>
                                    <p className="text-[10px] text-muted-foreground/50 uppercase font-bold tracking-tighter leading-relaxed">Start by adding friends or <span className="text-primary/60 underline decoration-dotted underline-offset-4">loading our BBQ demo</span></p>
                                </div>
                            </div>
                        )}
                        <div className="pt-4 mt-4 border-t border-foreground/[0.03]">
                            <QuickInsights />
                        </div>
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

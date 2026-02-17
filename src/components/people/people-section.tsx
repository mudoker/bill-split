import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserPlus, PlusCircle } from "lucide-react";
import { useBillStore } from "@/store/useBillStore";
import { PersonRow } from "./person-row";

export function PeopleSection() {
    const { people, addPerson, updatePerson, removePerson } = useBillStore();
    const [newName, setNewName] = useState("");

    const handleAdd = () => {
        if (newName.trim()) {
            addPerson(newName.trim());
            setNewName("");
        }
    };

    return (
        <Card className="w-full h-full flex flex-col border-none shadow-none md:border md:shadow-sm">
            <CardHeader className="pb-3 pt-4 px-4 md:px-6 md:pt-6">
                <CardTitle className="text-xl flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-primary" />
                    People
                </CardTitle>
                <CardDescription>Add friends and their sponsor amounts</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                <ScrollArea className="flex-1 px-4 md:px-6">
                    <div className="space-y-4 py-4 pr-3">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Enter name..."
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                            />
                            <Button onClick={handleAdd} size="icon" className="shrink-0">
                                <PlusCircle className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {people.map((person, index) => (
                                <PersonRow
                                    key={person.id}
                                    person={person}
                                    index={index}
                                    onUpdate={updatePerson}
                                    onRemove={removePerson}
                                />
                            ))}
                            {people.length === 0 && (
                                <div className="text-center text-muted-foreground py-8 text-sm border-2 border-dashed rounded-lg bg-muted/10">
                                    No people added yet.
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

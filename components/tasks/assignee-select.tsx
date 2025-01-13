"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TeamMember {
    id: string
    name: string
    email: string
    image?: string
}

interface AssigneeSelectProps {
    teamMembers: TeamMember[]
    selectedAssigneeId: string | null
    onAssigneeSelect: (assigneeId: string | null) => void
}

export function AssigneeSelect({
    teamMembers = [],
    selectedAssigneeId,
    onAssigneeSelect,
}: AssigneeSelectProps) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")

    const selectedMember = teamMembers?.find((m) => m.id === selectedAssigneeId)
    const filteredMembers = teamMembers?.filter(member =>
        member.name.toLowerCase().includes(search.toLowerCase()) ||
        member.email.toLowerCase().includes(search.toLowerCase())
    ) || []

    return (
        <div className="w-[200px]">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        {selectedMember ? (
                            <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={selectedMember.image} />
                                    <AvatarFallback>
                                        {selectedMember.name?.[0]?.toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <span>{selectedMember.name}</span>
                            </div>
                        ) : (
                            <span>Select assignee...</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                    <Command>
                        <CommandInput
                            placeholder="Search team members..."
                            value={search}
                            onValueChange={setSearch}
                        />
                        <CommandList>
                            <CommandEmpty>No team members found.</CommandEmpty>
                            <CommandGroup>
                                <ScrollArea className="h-64">
                                    {selectedAssigneeId && (
                                        <CommandItem
                                            value="unassign"
                                            onSelect={() => {
                                                onAssigneeSelect(null)
                                                setOpen(false)
                                            }}
                                            className="text-red-500"
                                        >
                                            Unassign
                                        </CommandItem>
                                    )}
                                    {filteredMembers.map((member) => {
                                        const isSelected = selectedAssigneeId === member.id
                                        return (
                                            <CommandItem
                                                key={member.id}
                                                value={member.email}
                                                onSelect={() => {
                                                    onAssigneeSelect(member.id)
                                                    setOpen(false)
                                                }}
                                            >
                                                <div className="flex items-center gap-2 flex-1">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src={member.image} />
                                                        <AvatarFallback>
                                                            {member.name?.[0]?.toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span>{member.name}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {member.email}
                                                        </span>
                                                    </div>
                                                </div>
                                                {isSelected && <Check className="ml-auto h-4 w-4" />}
                                            </CommandItem>
                                        )
                                    })}
                                </ScrollArea>
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
} 
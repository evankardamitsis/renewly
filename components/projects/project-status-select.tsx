"use client"

import * as React from "react"
import { useProjectStatuses } from "@/hooks/useProjectStatuses"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface ProjectStatusSelectProps {
    value?: string | null
    onChange: (value: string) => void
    disabled?: boolean
}

export function ProjectStatusSelect({
    value,
    onChange,
    disabled
}: ProjectStatusSelectProps) {
    const [open, setOpen] = React.useState(false)
    const { statuses, isLoading, error } = useProjectStatuses()

    const selectedStatus = statuses.find((status) => status.id === value)

    if (isLoading) return <LoadingSpinner />
    if (error) return <div>Error loading statuses</div>

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    disabled={disabled}
                >
                    {selectedStatus ? (
                        <div className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: selectedStatus.color }}
                            />
                            {selectedStatus.name}
                        </div>
                    ) : (
                        "Select status..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput placeholder="Search status..." />
                    <CommandEmpty>No status found.</CommandEmpty>
                    <CommandGroup>
                        {statuses.map((status) => (
                            <CommandItem
                                key={status.id}
                                value={status.name}
                                onSelect={() => {
                                    onChange(status.id)
                                    setOpen(false)
                                }}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        value === status.id ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: status.color }}
                                    />
                                    {status.name}
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    )
} 
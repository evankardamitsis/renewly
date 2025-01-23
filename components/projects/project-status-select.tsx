"use client"

import * as React from "react"
import { useProjectStatuses } from "@/hooks/useProjectStatuses"
import { useProjectStatusTransitions } from "@/hooks/useProjectStatusTransitions"
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface ProjectStatusSelectProps {
    projectId: string
    value?: string | null
    onChange?: (value: string) => void
    disabled?: boolean
}

// Define status transitions that require confirmation
const REQUIRES_CONFIRMATION: Record<string, string[]> = {
    "In Progress": ["Cancelled", "On Hold"],
    "Completed": ["In Progress", "Planning"],
    "Cancelled": ["In Progress", "Planning"],
} as const

export function ProjectStatusSelect({
    projectId,
    value,
    onChange,
    disabled,
}: ProjectStatusSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [showCommentDialog, setShowCommentDialog] = React.useState(false)
    const [showConfirmDialog, setShowConfirmDialog] = React.useState(false)
    const [selectedStatusId, setSelectedStatusId] = React.useState<string>()
    const [comment, setComment] = React.useState("")

    const { statuses, isLoading } = useProjectStatuses()
    const { transitionStatus, isTransitioning } = useProjectStatusTransitions(projectId)

    const selectedStatus = React.useMemo(
        () => statuses.find((status) => status.id === value),
        [statuses, value]
    )

    const targetStatus = React.useMemo(
        () => statuses.find((status) => status.id === selectedStatusId),
        [statuses, selectedStatusId]
    )

    const requiresConfirmation = React.useMemo(() => {
        if (!selectedStatus || !targetStatus) return false
        return REQUIRES_CONFIRMATION[selectedStatus.name]?.includes(targetStatus.name)
    }, [selectedStatus, targetStatus])

    const handleStatusSelect = (statusId: string) => {
        setSelectedStatusId(statusId)
        setOpen(false)

        const target = statuses.find((s) => s.id === statusId)
        const current = statuses.find((s) => s.id === value)

        if (current && target && REQUIRES_CONFIRMATION[current.name]?.includes(target.name)) {
            setShowConfirmDialog(true)
        } else {
            setShowCommentDialog(true)
        }
    }

    const handleTransitionConfirm = async () => {
        if (!selectedStatusId) return

        await transitionStatus({
            projectId,
            fromStatusId: value ?? null,
            toStatusId: selectedStatusId,
            comment: comment.trim() || undefined,
        })

        setShowCommentDialog(false)
        setShowConfirmDialog(false)
        setComment("")
        onChange?.(selectedStatusId)
    }

    if (isLoading) return <LoadingSpinner />

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-[200px] justify-between"
                        disabled={disabled}
                    >
                        {selectedStatus ? (
                            <div className="flex items-center gap-2">
                                <div
                                    className="h-2 w-2 rounded-full"
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
                                    onSelect={() => handleStatusSelect(status.id)}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === status.id
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="h-2 w-2 rounded-full"
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

            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to change the status from{" "}
                            <strong>{selectedStatus?.name}</strong> to{" "}
                            <strong>{targetStatus?.name}</strong>? This action may have
                            significant implications for the project.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            setShowConfirmDialog(false)
                            setShowCommentDialog(true)
                        }}>
                            Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add a comment</DialogTitle>
                        <DialogDescription>
                            Add an optional comment to explain why you&apos;re changing the status
                            {requiresConfirmation && " (recommended for this transition)"}.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        placeholder="Type your comment here..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowCommentDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleTransitionConfirm}
                            disabled={isTransitioning}
                        >
                            {isTransitioning ? (
                                <LoadingSpinner className="mr-2" />
                            ) : null}
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
} 
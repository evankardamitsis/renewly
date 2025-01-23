"use client"

import * as React from "react"
import { useProjectStatuses } from "@/hooks/useProjectStatuses"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { PlusIcon } from "lucide-react"
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd"

export function ProjectStatusDialog() {
    const [open, setOpen] = React.useState(false)
    const [newStatus, setNewStatus] = React.useState({
        name: "",
        color: "#000000",
        description: "",
    })

    const {
        statuses,
        isLoading,
        error,
        createStatus,
        deleteStatus,
        reorderStatuses,
        isCreating,
    } = useProjectStatuses()

    const handleCreateStatus = async (e: React.FormEvent) => {
        e.preventDefault()
        await createStatus({
            ...newStatus,
            sort_order: statuses.length,
        })
        setNewStatus({ name: "", color: "#000000", description: "" })
    }

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return

        const items = Array.from(statuses)
        const [reorderedItem] = items.splice(result.source.index, 1)
        items.splice(result.destination.index, 0, reorderedItem)

        // Update sort orders
        const updatedStatuses = items.map((item, index) => ({
            id: item.id,
            sort_order: index,
        }))

        reorderStatuses(updatedStatuses)
    }

    if (error) return (
        <div className="p-4 text-sm text-destructive">
            Error loading statuses. Please try again.
        </div>
    )

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Manage Statuses
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Project Statuses</DialogTitle>
                    <DialogDescription>
                        Create and manage project statuses. Drag to reorder.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="py-8 flex justify-center">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <>
                        <form onSubmit={handleCreateStatus} className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Name
                                </Label>
                                <Input
                                    id="name"
                                    value={newStatus.name}
                                    onChange={(e) => setNewStatus({ ...newStatus, name: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="color" className="text-right">
                                    Color
                                </Label>
                                <div className="col-span-3 flex gap-2">
                                    <Input
                                        id="color"
                                        type="color"
                                        value={newStatus.color}
                                        onChange={(e) => setNewStatus({ ...newStatus, color: e.target.value })}
                                        className="w-[100px]"
                                    />
                                    <div
                                        className="w-8 h-8 rounded border"
                                        style={{ backgroundColor: newStatus.color }}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="description" className="text-right">
                                    Description
                                </Label>
                                <Input
                                    id="description"
                                    value={newStatus.description}
                                    onChange={(e) => setNewStatus({ ...newStatus, description: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="ml-auto"
                                disabled={isCreating}
                            >
                                {isCreating ? <LoadingSpinner className="mr-2" /> : null}
                                Add Status
                            </Button>
                        </form>

                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="statuses">
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="space-y-2"
                                    >
                                        {statuses.map((status, index) => (
                                            <Draggable
                                                key={status.id}
                                                draggableId={status.id}
                                                index={index}
                                            >
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className="flex items-center justify-between p-2 rounded-lg border bg-card"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="w-4 h-4 rounded"
                                                                style={{ backgroundColor: status.color }}
                                                            />
                                                            <span>{status.name}</span>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => deleteStatus(status.id)}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
} 
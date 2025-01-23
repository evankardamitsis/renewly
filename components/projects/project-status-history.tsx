"use client"

import * as React from "react"
import { useProjectStatusTransitions } from "@/hooks/useProjectStatusTransitions"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface ProjectStatusHistoryProps {
    projectId: string
    className?: string
}

export function ProjectStatusHistory({ projectId, className }: ProjectStatusHistoryProps) {
    const { history, isLoading } = useProjectStatusTransitions(projectId)

    if (isLoading) return <LoadingSpinner />

    return (
        <ScrollArea className={cn("h-[400px] pr-4", className)}>
            <div className="space-y-4">
                {history.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-4">
                        <Avatar className="h-8 w-8">
                            <AvatarImage
                                src={entry.user.avatar_url ?? undefined}
                                alt={entry.user.full_name ?? entry.user.email}
                            />
                            <AvatarFallback>
                                {entry.user.full_name
                                    ? entry.user.full_name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                    : entry.user.email[0].toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">
                                    {entry.user.full_name ?? entry.user.email}
                                </span>
                                <span className="text-muted-foreground text-sm">
                                    {formatDistanceToNow(new Date(entry.created_at), {
                                        addSuffix: true,
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant="outline"
                                    style={{
                                        backgroundColor: entry.status.color,
                                        color: entry.status.color.startsWith("#f")
                                            ? "black"
                                            : "white",
                                    }}
                                >
                                    {entry.status.name}
                                </Badge>
                                {entry.comment && (
                                    <span className="text-sm text-muted-foreground">
                                        {entry.comment}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    )
} 
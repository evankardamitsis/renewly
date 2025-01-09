"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { NotificationItem } from "@/components/notifications/notification-item"
import { formatDistanceToNow } from "date-fns"
import { useNotificationsQuery } from "@/hooks/useNotificationsQuery"
import { Notification } from "@/types/database"

interface AllNotificationsProps {
    userId: string
}

const NOTIFICATIONS_PER_PAGE = 20

export function AllNotifications({ userId }: AllNotificationsProps) {
    const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set())
    const [isBulkEditMode, setIsBulkEditMode] = useState(false)
    const router = useRouter()
    const loadMoreRef = useRef<HTMLDivElement>(null)

    const {
        notifications,
        hasMore,
        isLoading,
        isFetchingNextPage,
        fetchNextPage,
        refetch,
        markAsRead,
        deleteNotification,
        deleteAllNotifications,
        deleteMultipleNotifications,
        markMultipleAsRead,
    } = useNotificationsQuery({
        userId,
        limit: NOTIFICATIONS_PER_PAGE,
        isMenu: false,
    })

    // Set up intersection observer for infinite scrolling
    useEffect(() => {
        if (!fetchNextPage) return

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isFetchingNextPage) {
                    void fetchNextPage()
                }
            },
            { threshold: 0.1 }
        )

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current)
        }

        return () => observer.disconnect()
    }, [hasMore, isFetchingNextPage, fetchNextPage])

    const handleRefresh = () => {
        void refetch()
    }

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            await markAsRead(notification.id)
        }
        if (notification.action_url) {
            router.push(notification.action_url)
        }
    }

    const handleDeleteNotification = async (e: React.MouseEvent, notification: Notification) => {
        e.stopPropagation() // Prevent triggering the notification click
        await deleteNotification(notification.id)
    }

    const handleDeleteAllNotifications = async () => {
        await deleteAllNotifications()
        setSelectedNotifications(new Set())
        setIsBulkEditMode(false)
    }

    const handleSelectNotification = (id: string, checked: boolean | "indeterminate") => {
        const newSelected = new Set(selectedNotifications)
        if (checked === true) {
            newSelected.add(id)
        } else {
            newSelected.delete(id)
        }
        setSelectedNotifications(newSelected)
    }

    const handleSelectAllNotifications = (checked: boolean | "indeterminate") => {
        if (checked) {
            const allIds = notifications.map(n => n.id)
            setSelectedNotifications(new Set(allIds))
        } else {
            setSelectedNotifications(new Set())
        }
    }

    const handleDeleteSelected = async () => {
        const selectedIds = Array.from(selectedNotifications)
        await deleteMultipleNotifications(selectedIds)
        setSelectedNotifications(new Set())
        setIsBulkEditMode(false)
    }

    const handleMarkSelectedAsRead = async () => {
        const selectedIds = Array.from(selectedNotifications)
        await markMultipleAsRead(selectedIds)
        setSelectedNotifications(new Set())
        setIsBulkEditMode(false)
    }

    return (
        <div className="space-y-4">
            {notifications.length > 0 && (
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsBulkEditMode(!isBulkEditMode)}
                        >
                            {isBulkEditMode ? "Cancel" : "Select"}
                        </Button>
                        {isBulkEditMode && (
                            <>
                                <Checkbox
                                    checked={selectedNotifications.size === notifications.length}
                                    onCheckedChange={handleSelectAllNotifications}
                                    aria-label="Select all notifications"
                                />
                                <span className="text-sm text-muted-foreground">
                                    {selectedNotifications.size} selected
                                </span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {isBulkEditMode && selectedNotifications.size > 0 ? (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleMarkSelectedAsRead}
                                >
                                    Mark as Read
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleDeleteSelected}
                                >
                                    Delete Selected
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleDeleteAllNotifications}
                            >
                                Clear All
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {notifications.length === 0 ? (
                <div className="min-h-[400px] w-full flex flex-col items-center justify-center p-8 border rounded-lg">
                    <div className="text-muted-foreground mb-4">No notifications</div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isLoading}
                    >
                        {isLoading ? "Refreshing..." : "Refresh"}
                    </Button>
                </div>
            ) : (
                <div className="min-h-[400px] space-y-2">
                    {notifications.map(notification => (
                        <div key={notification.id} className="group relative flex gap-2 items-start">
                            {isBulkEditMode && (
                                <div className="pt-2 pl-2">
                                    <Checkbox
                                        checked={selectedNotifications.has(notification.id)}
                                        onCheckedChange={(checked) => handleSelectNotification(notification.id, checked)}
                                        aria-label={`Select notification: ${notification.title}`}
                                    />
                                </div>
                            )}
                            <NotificationItem
                                notification={notification}
                                onClick={handleNotificationClick}
                                dateFormatter={(date) => formatDistanceToNow(date, { addSuffix: true })}
                                className="flex-1"
                            />
                            {!isBulkEditMode && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => handleDeleteNotification(e, notification)}
                                >
                                    Delete
                                </Button>
                            )}
                        </div>
                    ))}

                    {/* Infinite scroll trigger */}
                    <div
                        ref={loadMoreRef}
                        className="h-8 flex items-center justify-center"
                    >
                        {isFetchingNextPage && (
                            <div className="text-sm text-muted-foreground">
                                Loading more...
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
} 
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NotificationItem } from "@/components/notifications/notification-item"
import { useNotificationsQuery } from "@/hooks/useNotificationsQuery"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Notification } from "@/types/database"

export function NotificationsMenu() {
    const router = useRouter()
    const { user } = useAuth()

    const {
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
    } = useNotificationsQuery({
        userId: user?.id || "",
        limit: 5,
        isMenu: true,
    })

    // Filter to show only unread notifications in the menu
    const unreadNotifications = notifications.filter(n => !n.read)

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            await markAsRead(notification.id)
        }
        if (notification.action_url) {
            router.push(notification.action_url)
        }
    }

    const handleViewAll = () => {
        router.push('/notifications')
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    disabled={isLoading || !user}
                >
                    <Bell className="size-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                            {unreadCount}
                        </span>
                    )}
                    <span className="sr-only">View notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[380px]">
                <div className="flex items-center justify-between px-4 py-2 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAllAsRead()}
                                className="text-xs"
                            >
                                Mark all as read
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleViewAll}
                            className="text-xs"
                        >
                            View all
                        </Button>
                    </div>
                </div>
                <ScrollArea className="h-[300px]">
                    {unreadNotifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-muted-foreground">
                            No unread notifications
                        </div>
                    ) : (
                        unreadNotifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onClick={handleNotificationClick}
                            />
                        ))
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    )
} 
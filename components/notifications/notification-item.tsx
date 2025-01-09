import { cn } from "@/lib/utils"
import { Notification } from "@/types/database"

export const NOTIFICATION_STYLES = {
    "DUE_DATE": {
        border: "border-l-yellow-500",
        background: "hover:bg-yellow-50 dark:hover:bg-yellow-950/50",
    },
    "TASK_OVERDUE": {
        border: "border-l-red-500",
        background: "hover:bg-red-50 dark:hover:bg-red-950/50",
    },
    "TEAM_MEMBER_ADDED": {
        border: "border-l-blue-500",
        background: "hover:bg-blue-50 dark:hover:bg-blue-950/50",
    },
    "PROJECT_CREATED": {
        border: "border-l-green-500",
        background: "hover:bg-green-50 dark:hover:bg-green-950/50",
    }
} as const

interface NotificationItemProps {
    notification: Notification
    onClick?: (notification: Notification) => void
    className?: string
    dateFormatter?: (date: Date) => string
}

export function NotificationItem({ notification, onClick, className, dateFormatter }: NotificationItemProps) {
    const style = NOTIFICATION_STYLES[notification.type as keyof typeof NOTIFICATION_STYLES] || {
        border: "border-l-gray-500",
        background: "hover:bg-gray-50 dark:hover:bg-gray-950/50"
    }

    const formattedDate = dateFormatter
        ? dateFormatter(new Date(notification.created_at))
        : new Date(notification.created_at).toLocaleDateString()

    return (
        <div
            onClick={() => onClick?.(notification)}
            className={cn(
                "flex items-start px-4 py-3 cursor-pointer border-l-4",
                style.border,
                style.background,
                !notification.read && "bg-muted/50",
                className
            )}
        >
            <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-2">
                    <p className={cn(
                        "text-sm",
                        !notification.read && "font-medium"
                    )}>
                        {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground shrink-0">
                        {formattedDate}
                    </p>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                    {notification.message}
                </p>
            </div>
        </div>
    )
} 
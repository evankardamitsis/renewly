"use client";

import { TestNotifications } from "@/components/notifications/test-notifications";

export default function NotificationsTestPage() {
    return (
        <div className="container py-8">
            <h1 className="text-2xl font-bold mb-6">Notifications Test Page</h1>
            <TestNotifications />
        </div>
    );
} 
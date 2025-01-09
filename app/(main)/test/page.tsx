"use client";

import { TestNotifications } from "@/components/notifications/test-notifications";
import { TestTeamNotifications } from "@/components/notifications/test-team-notifications";
import { TestOverdueNotifications } from "@/components/notifications/test-overdue-notifications";
import { TestProjectNotifications } from "@/components/notifications/test-project-notifications";

export default function TestPage() {
    return (
        <div className="container py-8 space-y-4">
            <h1 className="text-2xl font-bold mb-4">Test Notifications</h1>
            <div className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold mb-2">Due Date Notifications</h2>
                    <TestNotifications />
                </div>
                <div>
                    <h2 className="text-lg font-semibold mb-2">Team Member Notifications</h2>
                    <TestTeamNotifications />
                </div>
                <div>
                    <h2 className="text-lg font-semibold mb-2">Overdue Task Notifications</h2>
                    <TestOverdueNotifications />
                </div>
                <div>
                    <h2 className="text-lg font-semibold mb-2">New Project Notifications</h2>
                    <TestProjectNotifications />
                </div>
            </div>
        </div>
    );
} 
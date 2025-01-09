"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TestEmailNotification } from "@/components/notifications/test-email-notification";
import { TestTaskDueNotification } from "@/components/notifications/test-task-due-notification";
import { TestOverdueNotifications } from "@/components/notifications/test-overdue-notifications";
import { TestTeamNotifications } from "@/components/notifications/test-team-notifications";
import { TestProjectNotifications } from "@/components/notifications/test-project-notifications";

export default function TestPage() {
    return (
        <div className="container py-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Test Notifications</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Email Test Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Test Email Notification</CardTitle>
                        <CardDescription>
                            Send a test email notification to verify the email delivery system.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TestEmailNotification />
                    </CardContent>
                </Card>

                {/* Task Due Test Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Test Task Due Notification</CardTitle>
                        <CardDescription>
                            Create a test task that is due soon to trigger a due date notification.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TestTaskDueNotification />
                    </CardContent>
                </Card>

                {/* Task Overdue Test Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Test Overdue Task Notification</CardTitle>
                        <CardDescription>
                            Create a test task that is overdue to trigger an overdue notification.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TestOverdueNotifications />
                    </CardContent>
                </Card>

                {/* Team Member Test Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Test Team Member Notification</CardTitle>
                        <CardDescription>
                            Simulate adding a new team member to trigger a team notification.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TestTeamNotifications />
                    </CardContent>
                </Card>

                {/* Project Test Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Test Project Notification</CardTitle>
                        <CardDescription>
                            Create a test project to trigger a new project notification.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TestProjectNotifications />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 
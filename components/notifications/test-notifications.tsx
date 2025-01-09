import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

export function TestNotifications() {
    const [isCreating, setIsCreating] = useState(false);

    const createTestTask = async () => {
        if (isCreating) return;
        try {
            setIsCreating(true);
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.error("No user found");
                return;
            }

            // Get the first available project
            const { data: project, error: projectError } = await supabase
                .from("projects")
                .select("id")
                .limit(1)
                .single();

            if (projectError) {
                console.error("Error fetching project:", projectError);
                return;
            }

            // Create a test task due in 2 days
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 2);

            // First create the task
            const { data: task, error: taskError } = await supabase
                .from("tasks")
                .insert({
                    title: `Test Task ${new Date().toLocaleTimeString()}`, // Add timestamp to make it unique
                    description: "This is a test task to verify notifications",
                    status: "todo",
                    priority: "medium",
                    due_date: dueDate.toISOString(),
                    assigned_to: user.id,
                    project_id: project.id
                })
                .select()
                .single();

            if (taskError) {
                console.error("Error creating task:", taskError);
                throw taskError;
            }

            toast.success("Test task created");

            // Wait for the task to be properly created
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Trigger the due date check
            const { error } = await supabase.functions.invoke("check-due-dates", {
                body: JSON.stringify({ taskId: task.id }) // Pass the specific task ID
            });

            if (error) throw error;
            toast.success("Notification check triggered");
        } catch (error) {
            console.error("Error:", error);
            toast.error("Failed to create test task");
        } finally {
            setIsCreating(false);
        }
    };

    const triggerDueDateCheck = async () => {
        if (isCreating) return;
        try {
            setIsCreating(true);
            const supabase = createClient();
            const { error } = await supabase.functions.invoke("check-due-dates");

            if (error) throw error;
            toast.success("Due date check triggered successfully");
        } catch (error) {
            console.error("Error triggering due date check:", error);
            toast.error("Failed to trigger due date check");
        } finally {
            setIsCreating(false);
        }
    };

    const createTestNotification = async () => {
        if (isCreating) return;
        try {
            setIsCreating(true);
            const supabase = createClient();
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError) throw userError;
            if (!user) throw new Error("No user found");

            const { error: notificationError } = await supabase
                .from("notifications")
                .insert({
                    user_id: user.id,
                    type: "TEST_NOTIFICATION",
                    title: "Test Notification",
                    message: "This is a test notification to check the UI",
                    action_url: "/notifications",
                    read: false
                });

            if (notificationError) throw notificationError;
            toast.success("Test notification created");
        } catch (error) {
            console.error("Error creating test notification:", error);
            toast.error("Failed to create test notification");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 p-4 border rounded-lg">
            <h2 className="text-lg font-semibold">Test Notifications</h2>
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-4 p-4 border rounded-lg">
                    <div>
                        <h3 className="font-medium">Create Test Task</h3>
                        <p className="text-sm text-muted-foreground">
                            Create a test task due in 2 days and trigger notifications
                        </p>
                    </div>
                    <Button
                        onClick={createTestTask}
                        disabled={isCreating}
                    >
                        {isCreating ? 'Creating...' : 'Create Task & Check'}
                    </Button>
                </div>

                <div className="flex items-center justify-between gap-4 p-4 border rounded-lg">
                    <div>
                        <h3 className="font-medium">Due Date Check</h3>
                        <p className="text-sm text-muted-foreground">
                            Trigger the due date check function to create notifications for tasks due in the next 3 days
                        </p>
                    </div>
                    <Button
                        onClick={triggerDueDateCheck}
                        variant="outline"
                        disabled={isCreating}
                    >
                        {isCreating ? 'Checking...' : 'Trigger Check'}
                    </Button>
                </div>

                <div className="flex items-center justify-between gap-4 p-4 border rounded-lg">
                    <div>
                        <h3 className="font-medium">Test Notification</h3>
                        <p className="text-sm text-muted-foreground">
                            Create a test notification to check the UI
                        </p>
                    </div>
                    <Button
                        onClick={createTestNotification}
                        variant="outline"
                        disabled={isCreating}
                    >
                        {isCreating ? 'Creating...' : 'Create Test'}
                    </Button>
                </div>
            </div>

            <div className="mt-4">
                <h3 className="font-medium mb-2">Notification Types</h3>
                <ul className="space-y-2 text-sm">
                    <li>
                        <span className="font-medium">DUE_DATE_APPROACHING:</span>
                        {" "}Task is due within the next 3 days
                    </li>
                    <li>
                        <span className="font-medium">TASK_ASSIGNED:</span>
                        {" "}You have been assigned to a task
                    </li>
                    <li>
                        <span className="font-medium">TASK_UPDATED:</span>
                        {" "}A task you&apos;re assigned to has been updated
                    </li>
                    <li>
                        <span className="font-medium">TEST_NOTIFICATION:</span>
                        {" "}Test notification for UI checking
                    </li>
                </ul>
            </div>
        </div>
    );
} 
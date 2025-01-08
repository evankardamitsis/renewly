import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function TestNotifications() {
    const createTestTask = async () => {
        try {
            console.log("Creating test task...");
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

            const { data: task, error: taskError } = await supabase
                .from("tasks")
                .insert({
                    title: "Test Task for Notifications",
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
                return;
            }

            console.log("Created test task:", task);

            // Trigger the due date check
            console.log("Triggering due date check...");
            const { data, error } = await supabase.functions.invoke("check-due-dates");
            console.log("Response:", { data, error });

        } catch (error) {
            console.error("Error:", error);
        }
    };

    const triggerDueDateCheck = async () => {
        try {
            console.log("Triggering due date check...");
            const supabase = createClient();
            const { data, error } = await supabase.functions.invoke("check-due-dates", {
                body: JSON.stringify({}),
            });

            console.log("Response:", { data, error });

            if (error) {
                console.error("Error:", error);
                throw error;
            }

            toast.success("Due date check triggered successfully");
        } catch (error) {
            console.error("Error triggering due date check:", error);
            toast.error(error instanceof Error ? error.message : "Failed to trigger due date check");
        }
    };

    const createTestNotification = async () => {
        try {
            console.log("Creating test notification...");
            const supabase = createClient();
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError) {
                console.error("User error:", userError);
                throw userError;
            }

            if (!user) {
                console.error("No user found");
                throw new Error("No user found");
            }

            console.log("Creating notification for user:", user.id);
            const { error: notificationError } = await supabase.from("notifications").insert({
                user_id: user.id,
                type: "TEST_NOTIFICATION",
                title: "Test Notification",
                message: "This is a test notification to check the UI",
                action_url: "/notifications",
                read: false
            });

            if (notificationError) {
                console.error("Notification error:", notificationError);
                throw notificationError;
            }

            toast.success("Test notification created");
        } catch (error) {
            console.error("Error creating test notification:", error);
            toast.error(error instanceof Error ? error.message : "Failed to create test notification");
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
                    <Button onClick={createTestTask}>
                        Create Task & Check
                    </Button>
                </div>

                <div className="flex items-center justify-between gap-4 p-4 border rounded-lg">
                    <div>
                        <h3 className="font-medium">Due Date Check</h3>
                        <p className="text-sm text-muted-foreground">
                            Trigger the due date check function to create notifications for tasks due in the next 3 days
                        </p>
                    </div>
                    <Button onClick={triggerDueDateCheck} variant="outline">
                        Trigger Check
                    </Button>
                </div>

                <div className="flex items-center justify-between gap-4 p-4 border rounded-lg">
                    <div>
                        <h3 className="font-medium">Test Notification</h3>
                        <p className="text-sm text-muted-foreground">
                            Create a test notification to check the UI
                        </p>
                    </div>
                    <Button onClick={createTestNotification} variant="outline">
                        Create Test
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
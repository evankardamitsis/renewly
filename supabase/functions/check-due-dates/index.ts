import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface Task {
    id: string;
    title: string;
    project_id: string;
    due_date: string;
    assigned_to: string;
    project?: {
        name: string;
    };
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        console.log("Starting due date check...");
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        );

        // Get tasks due in the next 2 days
        const now = new Date();
        const twoDaysFromNow = new Date(
            now.getTime() + 2 * 24 * 60 * 60 * 1000,
        );

        console.log("Fetching tasks due in the next 2 days...");
        console.log("Date range:", {
            now: now.toISOString(),
            twoDaysFromNow: twoDaysFromNow.toISOString(),
        });

        const { data: tasks, error: tasksError } = await supabase
            .from("tasks")
            .select(`
                id,
                title,
                due_date,
                project_id,
                assigned_to,
                project:projects (
                    name
                )
            `)
            .gte("due_date", now.toISOString())
            .lte("due_date", twoDaysFromNow.toISOString())
            .not("assigned_to", "is", null)
            .returns<Task[]>();

        if (tasksError) {
            console.error("Error fetching tasks:", tasksError);
            throw tasksError;
        }

        if (!tasks || tasks.length === 0) {
            console.log("No tasks found due in the next 2 days");
            return new Response(
                JSON.stringify({
                    message: "No tasks found due in the next 2 days",
                }),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                    status: 200,
                },
            );
        }

        console.log(
            `Found ${tasks.length} tasks due in the next 2 days:`,
            tasks,
        );

        // Create notifications for each task
        const notifications = [];
        for (const task of tasks) {
            console.log("Processing task:", task);

            try {
                const projectName = task.project?.name || "Unknown Project";

                // Check if notification already exists for this task
                const oneDayAgo = new Date();
                oneDayAgo.setDate(oneDayAgo.getDate() - 1);

                const { data: existingNotifications, error: checkError } =
                    await supabase
                        .from("notifications")
                        .select("id")
                        .eq("task_id", task.id)
                        .eq("type", "DUE_DATE")
                        .eq("read", false)
                        .gte("created_at", oneDayAgo.toISOString());

                if (checkError) {
                    console.error(
                        "Error checking existing notifications:",
                        checkError,
                    );
                    continue;
                }

                // Skip if notification already exists within the last day
                if (existingNotifications && existingNotifications.length > 0) {
                    console.log(
                        `Recent notification exists for task ${task.id}, skipping`,
                    );
                    continue;
                }

                // Create notification if none exists
                const { data: notification, error: notificationError } =
                    await supabase
                        .from("notifications")
                        .insert({
                            user_id: task.assigned_to,
                            type: "DUE_DATE",
                            title: "Task Due Soon",
                            message:
                                `Task "${task.title}" in project "${projectName}" is due ${
                                    new Date(task.due_date).toLocaleDateString()
                                }`,
                            task_id: task.id,
                            project_id: task.project_id,
                            read: false,
                            action_url:
                                `/projects/${task.project_id}/tasks/${task.id}`,
                        })
                        .select()
                        .single();

                if (notificationError) {
                    console.error(
                        "Error creating notification for task:",
                        task.id,
                        notificationError,
                    );
                } else {
                    console.log("Created notification:", notification);
                    notifications.push(notification);

                    // Broadcast the new notification
                    await supabase.channel("notifications").send({
                        type: "broadcast",
                        event: "new_notification",
                        payload: notification,
                    });
                }
            } catch (error) {
                console.error("Error processing task:", task.id, error);
            }
        }

        console.log(`Created ${notifications.length} notifications`);

        return new Response(
            JSON.stringify({
                message:
                    `Due date checks completed successfully. Created ${notifications.length} notifications.`,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            },
        );
    } catch (error) {
        console.error("Error in due date check:", error);
        const errorMessage = error instanceof Error
            ? error.message
            : "An unknown error occurred";
        return new Response(
            JSON.stringify({
                error: errorMessage,
                details: error instanceof Error ? error.stack : undefined,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
            },
        );
    }
});

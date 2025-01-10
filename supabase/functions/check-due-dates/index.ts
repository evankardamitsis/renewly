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
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        );

        // Parse request body for specific task ID and test mode
        const { task_id, test_mode } = await req.json().catch(() => ({}));

        // Get tasks due in the next 2 days
        const now = new Date();
        const twoDaysFromNow = new Date(
            now.getTime() + 2 * 24 * 60 * 60 * 1000,
        );

        // Build the query based on whether we're checking a specific task
        let query = supabase
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
            .not("assigned_to", "is", null);

        // If in test mode, only check the specific task regardless of due date
        if (test_mode && task_id) {
            query = query.eq("id", task_id);
        } else {
            // Normal mode: check tasks due in the next 2 days
            query = query
                .gte("due_date", now.toISOString())
                .lte("due_date", twoDaysFromNow.toISOString());

            // If task_id is provided, only check that specific task
            if (task_id) {
                query = query.eq("id", task_id);
            }
        }

        const { data: tasks, error: tasksError } = await query.returns<Task[]>();

        if (tasksError) {
            throw tasksError;
        }

        if (!tasks || tasks.length === 0) {
            return new Response(
                JSON.stringify({
                    message: task_id
                        ? "Specified task not found or not due soon"
                        : "No tasks found due in the next 2 days",
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

        // Create notifications for each task
        const notifications = [];
        for (const task of tasks) {
            try {
                const projectName = task.project?.name || "Unknown Project";

                // In test mode, skip notification existence check
                let shouldCreateNotification = test_mode;

                if (!test_mode) {
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

                    if (checkError) throw checkError;

                    // Skip if notification already exists within the last day
                    shouldCreateNotification = !existingNotifications?.length;
                }

                if (shouldCreateNotification) {
                    // Create notification
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

                    if (notificationError) throw notificationError;

                    // Only send email in non-test mode
                    if (!test_mode) {
                        try {
                            const emailResponse = await fetch(
                                `${
                                    Deno.env.get("SUPABASE_URL")
                                }/functions/v1/send-notification-email`,
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        "Authorization": `Bearer ${
                                            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
                                        }`,
                                    },
                                    body: JSON.stringify({
                                        notification_id: notification.id,
                                    }),
                                },
                            );

                            if (!emailResponse.ok) {
                                console.error(
                                    "Failed to trigger email notification:",
                                    await emailResponse.text(),
                                );
                            }
                        } catch (emailError) {
                            console.error(
                                "Error triggering email notification:",
                                emailError,
                            );
                        }
                    }

                    notifications.push(notification);
                }
            } catch (error) {
                console.error(`Error processing task ${task.id}:`, error);
            }
        }

        return new Response(
            JSON.stringify({
                message: `Created ${notifications.length} notification(s)`,
                notifications,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            },
        );
    } catch (error) {
        console.error("Error in due date check:", error);
        return new Response(
            JSON.stringify({
                error: error instanceof Error
                    ? error.message
                    : "An unknown error occurred",
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
            },
        );
    }
});

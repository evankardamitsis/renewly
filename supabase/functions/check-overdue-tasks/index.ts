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

        // Get tasks that are overdue and not completed
        const now = new Date();
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
            .lt("due_date", now.toISOString())
            .in("status", ["todo", "in_progress"])
            .not("assigned_to", "is", null)
            .returns<Task[]>();

        if (tasksError) throw tasksError;

        if (!tasks || tasks.length === 0) {
            return new Response(
                JSON.stringify({ message: "No overdue tasks found" }),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                    status: 200,
                },
            );
        }

        // Create notifications for each overdue task
        const notifications = [];
        for (const task of tasks) {
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
                        .eq("type", "TASK_OVERDUE")
                        .eq("read", false)
                        .gte("created_at", oneDayAgo.toISOString());

                if (checkError) throw checkError;

                // Skip if notification already exists within the last day
                if (existingNotifications?.length > 0) continue;

                // Create notification if none exists
                const { data: notification, error: notificationError } =
                    await supabase
                        .from("notifications")
                        .insert({
                            user_id: task.assigned_to,
                            type: "TASK_OVERDUE",
                            title: "Task Overdue",
                            message:
                                `Task "${task.title}" in project "${projectName}" is overdue`,
                            task_id: task.id,
                            project_id: task.project_id,
                            read: false,
                            action_url:
                                `/projects/${task.project_id}/tasks/${task.id}`,
                        })
                        .select()
                        .single();

                if (notificationError) throw notificationError;
                notifications.push(notification);
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
        console.error("Error in overdue task check:", error);
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

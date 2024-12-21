import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { Database } from "../_shared/types.ts";

interface CreateTaskInput {
  project_id: string;
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  status?: "todo" | "in-progress" | "done";
  due_date?: string | null;
}

serve(async (req: Request) => {
  try {
    const supabase = createClient<Database>(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      },
    );

    const input = await req.json() as CreateTaskInput;

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        project_id: input.project_id,
        title: input.title,
        description: input.description || "",
        priority: input.priority || "medium",
        status: input.status || "todo",
        due_date: input.due_date || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});

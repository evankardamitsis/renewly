import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { Database } from "../_shared/types.ts"

interface CreateTeamInput {
  name: string
  image_url?: string
  created_by: string
}

serve(async (req: Request) => {
  try {
    const supabase = createClient<Database>(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false
        }
      }
    )

    const input = await req.json() as CreateTeamInput
    
    const { data, error } = await supabase
      .from("teams")
      .insert({
        name: input.name,
        image_url: input.image_url,
        created_by: input.created_by,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
      status: 200
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return new Response(JSON.stringify({ error: message }), {
      headers: { "Content-Type": "application/json" },
      status: 400
    })
  }
})
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
    notification_id: string;
}

serve(async (req: Request) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        console.log("Starting email notification process...");

        // Check required environment variables
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        const siteUrl = Deno.env.get("SITE_URL") || "http://localhost:3000";

        console.log("Environment variables check:", {
            hasSupabaseUrl: !!supabaseUrl,
            hasSupabaseKey: !!supabaseServiceKey,
            hasResendKey: !!resendApiKey,
            siteUrl,
        });

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error("Missing required Supabase environment variables");
        }

        if (!resendApiKey) {
            throw new Error("Missing RESEND_API_KEY environment variable");
        }

        // Initialize Supabase client
        console.log("Initializing Supabase client...");
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Initialize Resend
        console.log("Initializing Resend client...");
        const resend = new Resend(resendApiKey);

        // Get notification ID from request
        console.log("Parsing request body...");
        const { notification_id } = await req.json() as NotificationRequest;
        console.log("Notification ID:", notification_id);

        if (!notification_id) {
            throw new Error("notification_id is required");
        }

        // Get notification details
        console.log("Fetching notification details...");
        const { data: notification, error: notificationError } = await supabase
            .from("notifications")
            .select(`
                *,
                profile:user_id (
                    email
                )
            `)
            .eq("id", notification_id)
            .single();

        if (notificationError) {
            console.error("Error fetching notification:", notificationError);
            throw notificationError;
        }
        if (!notification) throw new Error("Notification not found");
        if (!notification.profile?.email) {
            throw new Error("User email not found");
        }

        console.log("Found notification:", {
            id: notification.id,
            type: notification.type,
            hasEmail: !!notification.profile.email,
        });

        // Send email
        console.log("Sending email...");
        const { error: emailError } = await resend.emails.send({
            from: "Renewly <notifications@renewlyhq.com>",
            to: [notification.profile.email],
            subject: notification.title,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>${notification.title}</h2>
                    <p>${notification.message}</p>
                    ${
                notification.action_url
                    ? `<p style="margin-top: 20px;">
                            <a href="${siteUrl}${notification.action_url}" 
                               style="background-color: #0284c7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                View Details
                            </a>
                        </p>`
                    : ""
            }
                    <p style="margin-top: 20px; font-size: 14px; color: #666;">
                        You're receiving this email because you have notifications enabled for your Renewly account.
                    </p>
                </div>
            `,
        });

        if (emailError) {
            console.error("Error sending email:", emailError);
            throw emailError;
        }

        console.log("Email sent successfully!");
        return new Response(
            JSON.stringify({ message: "Email sent successfully" }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            },
        );
    } catch (error) {
        console.error("Error in email notification process:", error);
        return new Response(
            JSON.stringify({
                error: error instanceof Error
                    ? error.message
                    : "An unknown error occurred",
                details: error instanceof Error ? error.stack : undefined,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
            },
        );
    }
});

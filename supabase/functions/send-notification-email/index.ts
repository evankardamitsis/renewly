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
        // Initialize Supabase client
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        );

        // Initialize Resend
        const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

        // Get notification ID from request
        const { notification_id } = await req.json() as NotificationRequest;
        if (!notification_id) {
            throw new Error("notification_id is required");
        }

        // Get notification details
        const { data: notification, error: notificationError } = await supabase
            .from("notifications")
            .select(`
                *,
                user:user_id (
                    email
                )
            `)
            .eq("id", notification_id)
            .single();

        if (notificationError) throw notificationError;
        if (!notification) throw new Error("Notification not found");
        if (!notification.user?.email) throw new Error("User email not found");

        // Send email
        const { error: emailError } = await resend.emails.send({
            from: "Renewly <hello@renewlyhq.com>",
            to: [notification.user.email],
            subject: notification.title,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>${notification.title}</h2>
                    <p>${notification.message}</p>
                    ${
                notification.action_url
                    ? `
                        <p style="margin-top: 20px;">
                            <a href="${
                        Deno.env.get("SITE_URL")
                    }${notification.action_url}" 
                               style="background-color: #0284c7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                View Details
                            </a>
                        </p>
                    `
                    : ""
            }
                    <p style="margin-top: 20px; font-size: 14px; color: #666;">
                        You're receiving this email because you have notifications enabled for your Renewly account.
                    </p>
                </div>
            `,
        });

        if (emailError) throw emailError;

        // Update notification to mark email as sent
        const { error: updateError } = await supabase
            .from("notifications")
            .update({ email_sent: true })
            .eq("id", notification_id);

        if (updateError) throw updateError;

        return new Response(
            JSON.stringify({ message: "Email sent successfully" }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            },
        );
    } catch (error) {
        console.error("Error sending notification email:", error);
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

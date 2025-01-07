"use server";

import { createClient } from "@/utils/supabase/server";

export async function updatePassword(password: string) {
    try {
        const supabase = createClient();

        // Get session
        const supabaseClient = await supabase;
        const { data: { session }, error: sessionError } = await supabaseClient
            .auth.getSession();

        if (sessionError) throw sessionError;
        if (!session) throw new Error("No active session");

        // Update password
        const { error } = await supabaseClient.auth.updateUser({ password });
        if (error) throw error;

        // Sign out
        await supabaseClient.auth.signOut();

        return { success: true };
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: "An unexpected error occurred" };
    }
}

export async function resetPasswordForEmail(email: string) {
    try {
        const supabase = createClient();
        const supabaseClient = await supabase;

        const { error } = await supabaseClient.auth.resetPasswordForEmail(
            email,
            {
                redirectTo:
                    `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password/confirm`,
            },
        );

        if (error) throw error;

        return { success: true };
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: "An unexpected error occurred" };
    }
}

import { type EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type") as EmailOtpType | null;
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/";

    const redirectTo = request.nextUrl.clone();
    redirectTo.pathname = next;

    try {
        const supabase = createClient();
        const supabaseClient = await supabase;

        if (token_hash && type) {
            const { error } = await supabaseClient.auth.verifyOtp({
                type,
                token_hash,
            });
            if (!error) {
                redirectTo.pathname = "/reset-password/confirm";
                return NextResponse.redirect(redirectTo);
            }
        }

        // Handle code exchange for password reset
        if (code) {
            const { error } = await supabaseClient.auth.exchangeCodeForSession(
                code,
            );
            if (!error) {
                redirectTo.pathname = "/reset-password/confirm";
                return NextResponse.redirect(redirectTo);
            }
        }

        // If we get here, something went wrong
        redirectTo.pathname = "/auth/auth-code-error";
        return NextResponse.redirect(redirectTo);
    } catch (error) {
        console.error("Auth error:", error);
        redirectTo.pathname = "/auth/auth-code-error";
        return NextResponse.redirect(redirectTo);
    }
}

import { type EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type") as EmailOtpType | null;
    const code = searchParams.get("code");
    const invitation_token = searchParams.get("invitation_token");
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
                // If this is an invitation, redirect to onboarding
                if (type === "invite" && invitation_token) {
                    redirectTo.pathname = "/onboarding";
                    redirectTo.searchParams.set(
                        "invitation_token",
                        invitation_token,
                    );
                    return NextResponse.redirect(redirectTo);
                }
                // Otherwise handle password reset
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
                // If this is an invitation, redirect to onboarding
                if (invitation_token) {
                    redirectTo.pathname = "/onboarding";
                    redirectTo.searchParams.set(
                        "invitation_token",
                        invitation_token,
                    );
                    return NextResponse.redirect(redirectTo);
                }
                // Otherwise handle password reset
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

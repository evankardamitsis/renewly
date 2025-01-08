import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    try {
        const { pathname, searchParams } = request.nextUrl;
        console.log("Middleware: Processing request", {
            pathname,
            searchParams: Object.fromEntries(searchParams),
        });

        // Allow auth callback routes
        if (pathname.startsWith("/auth/callback")) {
            console.log("Middleware: Allowing auth callback route");
            return NextResponse.next();
        }

        // Allow reset password confirmation page with code
        if (
            pathname === "/reset-password/confirm" &&
            (searchParams.has("code") || searchParams.has("token_hash"))
        ) {
            console.log("Middleware: Allowing reset password confirmation");
            return NextResponse.next();
        }

        // If we have an access token in the query params, set up the session
        if (
            searchParams.has("access_token") &&
            searchParams.has("refresh_token")
        ) {
            console.log("Middleware: Found tokens in query params");
            const accessToken = searchParams.get("access_token");
            const refreshToken = searchParams.get("refresh_token");
            const type = searchParams.get("type");

            console.log("Middleware: Parsed tokens", {
                hasAccessToken: !!accessToken,
                hasRefreshToken: !!refreshToken,
                type,
            });

            if (accessToken && refreshToken && type === "invite") {
                try {
                    // Set up the session
                    console.log("Middleware: Setting up session");
                    const supabase = createClient();
                    const supabaseClient = await supabase;
                    const { data: { session }, error } = await supabaseClient
                        .auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        });

                    if (error) {
                        console.error(
                            "Middleware: Error setting session:",
                            error,
                        );
                        throw error;
                    }

                    if (!session) {
                        console.error(
                            "Middleware: No session after setting tokens",
                        );
                        throw new Error("Failed to set session");
                    }

                    console.log("Middleware: Session set successfully", {
                        userId: session.user.id,
                        email: session.user.email,
                    });

                    // Get invitation token from user metadata
                    const invitationToken = session.user.user_metadata
                        ?.invitation_token;
                    console.log(
                        "Middleware: Got invitation token:",
                        invitationToken,
                    );

                    // Redirect to onboarding with the invitation token
                    const redirectUrl = new URL("/onboarding", request.url);
                    if (invitationToken) {
                        redirectUrl.searchParams.set(
                            "invitation_token",
                            invitationToken,
                        );
                    }
                    console.log(
                        "Middleware: Redirecting to:",
                        redirectUrl.toString(),
                    );
                    return NextResponse.redirect(redirectUrl);
                } catch (error) {
                    console.error("Middleware: Error in invite flow:", error);
                    // On error, redirect to login
                    const redirectUrl = new URL("/login", request.url);
                    return NextResponse.redirect(redirectUrl);
                }
            }
        }

        // Allow onboarding page with invitation token
        if (
            pathname === "/onboarding" && searchParams.has("invitation_token")
        ) {
            console.log(
                "Middleware: Allowing onboarding with invitation token",
            );
            return NextResponse.next();
        }

        // Allow public routes
        if (
            pathname.startsWith("/login") ||
            pathname.startsWith("/register") ||
            pathname.startsWith("/reset-password") ||
            pathname.startsWith("/auth")
        ) {
            console.log("Middleware: Allowing public route:", pathname);
            return NextResponse.next();
        }

        // Check auth for other routes
        console.log("Middleware: Checking auth for protected route:", pathname);
        const supabase = createClient();
        const supabaseClient = await supabase;
        const { data: { user } } = await supabaseClient.auth.getUser();

        if (!user) {
            console.log("Middleware: No user found, redirecting to login");
            const redirectUrl = new URL("/login", request.url);
            redirectUrl.searchParams.set("redirectTo", pathname);
            return NextResponse.redirect(redirectUrl);
        }

        console.log("Middleware: User authenticated, proceeding");
        return NextResponse.next();
    } catch (e) {
        console.error("Middleware error:", e);
        // On error, redirect to login
        const redirectUrl = new URL("/login", request.url);
        return NextResponse.redirect(redirectUrl);
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public (public files)
         */
        "/((?!_next/static|_next/image|favicon.ico|public).*)",
    ],
};

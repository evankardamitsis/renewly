import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    try {
        const { pathname, searchParams } = request.nextUrl;

        // Allow auth callback routes
        if (pathname.startsWith("/auth/callback")) {
            return NextResponse.next();
        }

        // Allow reset password confirmation page with code
        if (
            pathname === "/reset-password/confirm" &&
            (searchParams.has("code") || searchParams.has("token_hash"))
        ) {
            return NextResponse.next();
        }

        // Allow public routes
        if (
            pathname.startsWith("/login") ||
            pathname.startsWith("/register") ||
            pathname.startsWith("/reset-password") ||
            pathname.startsWith("/auth")
        ) {
            return NextResponse.next();
        }

        // Check auth for other routes
        const supabase = createClient();
        const supabaseClient = await supabase;
        const { data: { user } } = await supabaseClient.auth.getUser();

        if (!user) {
            const redirectUrl = new URL("/login", request.url);
            redirectUrl.searchParams.set("redirectTo", pathname);
            return NextResponse.redirect(redirectUrl);
        }

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

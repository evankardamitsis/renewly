import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");

    if (code) {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    async get(name: string) {
                        const cookieStore = await cookies();
                        const cookie = cookieStore.get(name);
                        return cookie?.value;
                    },
                    async set(
                        name: string,
                        value: string,
                        options: CookieOptions,
                    ) {
                        try {
                            const cookieStore = await cookies();
                            cookieStore.set({ name, value, ...options });
                        } catch (error) {
                            // Handle cookies in edge functions
                            console.error("Error setting cookie:", error);
                        }
                    },
                    async remove(name: string) {
                        try {
                            const cookieStore = await cookies();
                            cookieStore.delete(name);
                        } catch (error) {
                            // Handle cookies in edge functions
                            console.error("Error removing cookie:", error);
                        }
                    },
                },
            },
        );
        await supabase.auth.exchangeCodeForSession(code);
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
}

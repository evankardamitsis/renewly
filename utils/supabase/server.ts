import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            await cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle cookies in edge functions
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            await cookieStore.delete({ name, ...options });
          } catch (error) {
            // Handle cookies in edge functions
          }
        },
      },
    },
  );
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/edge/")) {
    const functionName = request.nextUrl.pathname.replace("/api/edge/", "");
    const supabaseUrl = process.env.SUPABASE_URL;

    return NextResponse.rewrite(
      new URL(`${supabaseUrl}/functions/v1/${functionName}`, request.url),
    );
  }
}

export const config = {
  matcher: "/api/edge/:function*",
};

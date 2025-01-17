import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: { path: string[] } },
) {
    try {
        // Initialize Supabase client
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                },
            },
        );

        // Get the user session
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Join the path segments
        const storagePath = params.path.join("/");

        // Check if this is a preview or download request
        const isPreview = storagePath.endsWith("/preview");
        const filePath = isPreview
            ? storagePath.replace("/preview", "")
            : storagePath.replace("/download", "");

        // Create a signed URL that expires in 60 seconds
        const { data, error } = await supabase
            .storage
            .from("project-files")
            .createSignedUrl(filePath, 60);

        if (error || !data?.signedUrl) {
            console.error("Error creating signed URL:", error);
            return new NextResponse("Error accessing file", { status: 500 });
        }

        if (isPreview) {
            // For previews, proxy the image through our API
            const response = await fetch(data.signedUrl);
            const blob = await response.blob();
            return new NextResponse(blob, {
                headers: {
                    "Content-Type": response.headers.get("Content-Type") ||
                        "application/octet-stream",
                    "Cache-Control": "public, max-age=300",
                },
            });
        } else {
            // For downloads, return the signed URL
            return NextResponse.json({ url: data.signedUrl });
        }
    } catch (error) {
        console.error("Error handling file request:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

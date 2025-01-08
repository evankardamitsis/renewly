"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationToken = searchParams.get("invitation_token");

  useEffect(() => {
    // Check if we have an access token in the URL hash
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      console.log("Found access token in hash");

      // Convert hash parameters to query parameters
      const params = new URLSearchParams(hash.substring(1));
      const url = new URL(window.location.href);
      url.hash = '';

      // Add each parameter from hash to query
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });

      // Replace the URL with query parameters
      console.log("Redirecting with query params:", url.toString());
      window.location.replace(url.toString());
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      const supabase = createClient();

      // Regular login flow
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data: profile } = await supabase
        .from("profiles")
        .select("has_completed_onboarding")
        .eq("id", data.user.id)
        .single();

      if (!profile?.has_completed_onboarding) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }

      toast.success("Logged in successfully!");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {invitationToken ? "Accept Invitation" : "Log in to your account"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Input
              id="password"
              name="password"
              type="password"
              placeholder={invitationToken ? "Choose a password" : "Password"}
              required
              disabled={loading}
              minLength={8}
            />
            {!invitationToken && (
              <div className="text-sm text-right">
                <Link
                  href="/reset-password"
                  className="text-primary hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? "Please wait..."
              : invitationToken
                ? "Accept Invitation"
                : "Log in"}
          </Button>
        </form>
        {!invitationToken && (
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Register
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

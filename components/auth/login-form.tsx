"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";

interface LoginFormProps {
  inviteData?: {
    email: string;
    teamName: string;
    token: string;
  } | null;
}

export function LoginForm({ inviteData }: LoginFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // If user doesn't exist and this is an invitation, sign them up
        if (
          error.message.includes("Invalid login credentials") &&
          inviteData &&
          email === inviteData.email
        ) {
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback?invitation_token=${inviteData.token}`,
              data: {
                has_password: true,
              },
            },
          });

          if (signUpError) throw signUpError;

          toast.success("Check your email to verify your account");
          return;
        }

        throw error;
      }

      // If this is an invitation and emails match, redirect to onboarding
      if (inviteData && email === inviteData.email) {
        router.push(`/onboarding?invitation_token=${inviteData.token}`);
        return;
      }

      // Regular login flow
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
          {inviteData
            ? `Join ${inviteData.teamName}`
            : "Log in to your account"}
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
              defaultValue={inviteData?.email}
              required
              disabled={loading || !!inviteData}
            />
          </div>
          <div className="space-y-2">
            <Input
              id="password"
              name="password"
              type="password"
              placeholder={inviteData ? "Choose a password" : "Password"}
              required
              disabled={loading}
              minLength={8}
            />
            {!inviteData && (
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
              : inviteData
              ? "Create Account"
              : "Log in"}
          </Button>
        </form>
        {!inviteData && (
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

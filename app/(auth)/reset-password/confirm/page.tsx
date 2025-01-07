"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { EmailOtpType } from "@supabase/supabase-js";
import { updatePassword } from "@/app/actions/auth";

export default function ResetPasswordConfirmPage() {
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const setupSession = async () => {
            try {
                const supabase = createClient();
                console.log("Setting up session...");

                // Check if we have a session already
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    console.log("Session found, ready for password update");
                    setLoading(false);
                    return;
                }

                // If no session, check for code or token_hash
                const code = searchParams.get("code");
                const token_hash = searchParams.get("token_hash");
                const type = searchParams.get("type") as EmailOtpType | null;

                if (code) {
                    console.log("Found code, exchanging for session...");
                    const { error } = await supabase.auth.exchangeCodeForSession(code);
                    if (error) {
                        console.error("Code exchange error:", error);
                        throw error;
                    }
                    console.log("Code exchanged successfully");
                    setLoading(false);
                    return;
                }

                if (token_hash && type) {
                    console.log("Found token_hash, verifying OTP...");
                    const { error } = await supabase.auth.verifyOtp({
                        type,
                        token_hash,
                    });
                    if (error) {
                        console.error("OTP verification error:", error);
                        throw error;
                    }
                    console.log("OTP verified successfully");
                    setLoading(false);
                    return;
                }

                // No session and no recovery parameters
                throw new Error("No session or recovery parameters found");
            } catch (error) {
                console.error("Setup error:", error);
                toast.error("Invalid or expired reset link");
                router.push("/login");
            }
        };

        setupSession();
    }, [router, searchParams]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setUpdating(true);

        try {
            const formData = new FormData(e.currentTarget);
            const password = formData.get("password") as string;
            const confirmPassword = formData.get("confirmPassword") as string;

            if (password !== confirmPassword) {
                toast.error("Passwords do not match");
                setUpdating(false);
                return;
            }

            if (password.length < 6) {
                toast.error("Password must be at least 6 characters");
                setUpdating(false);
                return;
            }

            console.log("Updating password...");
            const result = await updatePassword(password);

            if (result.error) {
                if (result.error.includes("same_password")) {
                    toast.error("New password must be different from your current password");
                    return;
                }
                throw new Error(result.error);
            }

            console.log("Password updated successfully");
            toast.success("Password updated successfully");
            router.push("/login");
        } catch (error) {
            console.error("Password update error:", error);
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("Failed to update password");
            }
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Verifying reset link...</CardTitle>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
            <Card>
                <CardHeader>
                    <CardTitle>Set New Password</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="relative">
                            <Input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="New Password"
                                required
                                disabled={updating}
                                minLength={6}
                                className="pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-9 w-9 px-0"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                                <span className="sr-only">
                                    {showPassword ? "Hide password" : "Show password"}
                                </span>
                            </Button>
                        </div>
                        <div className="relative">
                            <Input
                                name="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm New Password"
                                required
                                disabled={updating}
                                minLength={6}
                                className="pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-9 w-9 px-0"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                tabIndex={-1}
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                                <span className="sr-only">
                                    {showConfirmPassword ? "Hide password" : "Show password"}
                                </span>
                            </Button>
                        </div>
                        <Button type="submit" disabled={updating}>
                            {updating ? "Updating..." : "Update Password"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

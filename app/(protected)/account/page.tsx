"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { updatePassword } from "@/app/actions/auth";

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  const resetStates = () => {
    setUpdating(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleUpdateEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const formData = new FormData(e.currentTarget);
      const newEmail = formData.get("email") as string;

      if (newEmail === user?.email) {
        toast.error("New email must be different from current email");
        setUpdating(false);
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) throw error;

      toast.success("Email update confirmation sent. Please check your email.");
      setIsEmailDialogOpen(false);
      e.currentTarget.reset();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update email");
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const formData = new FormData(e.currentTarget);
      const password = formData.get("password") as string;
      const confirmPassword = formData.get("confirmPassword") as string;

      // Basic validation
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

      // Call the server action
      const result = await updatePassword(password);

      if (result.error) {
        if (result.error.includes("same_password")) {
          toast.error(
            "New password must be different from your current password"
          );
          return;
        }
        throw new Error(result.error);
      }

      // Success
      toast.success("Password updated successfully");
      setIsPasswordDialogOpen(false);
      router.push("/login");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update password");
      }
    } finally {
      setUpdating(false);
    }
  };

  // Reset states when dialogs are closed
  const handlePasswordDialogChange = (open: boolean) => {
    if (updating) return; // Don't allow closing while updating
    setIsPasswordDialogOpen(open);
    if (!open) {
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  };

  const handleEmailDialogChange = (open: boolean) => {
    setIsEmailDialogOpen(open);
    if (!open) {
      resetStates();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container max-w-xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>
            Manage your account settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Info */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">User Information</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>ID: {user.id}</p>
              <p>Current Email: {user.email}</p>
              <p>Email Verified: {user.email_confirmed_at ? "Yes" : "No"}</p>
              <p>
                Last Sign In:{" "}
                {new Date(user.last_sign_in_at || "").toLocaleString()}
              </p>
            </div>
          </div>

          {/* Account Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Account Actions</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={() => setIsEmailDialogOpen(true)}>
                Change Email
              </Button>
              <Button onClick={() => setIsPasswordDialogOpen(true)}>
                Change Password
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Update Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={handleEmailDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Email Address</DialogTitle>
            <DialogDescription>
              Enter your new email address. You&apos;ll need to verify it before
              the change takes effect.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <Input
              type="email"
              name="email"
              placeholder="New email address"
              required
            />
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleEmailDialogChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? "Updating..." : "Update Email"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Password Update Dialog */}
      <Dialog
        open={isPasswordDialogOpen}
        onOpenChange={handlePasswordDialogChange}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your new password. Make sure it&apos;s secure and you
              remember it.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-4">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="New password"
                  required
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
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  required
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
            </div>
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handlePasswordDialogChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

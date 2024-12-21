"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface FormData {
  displayName: string;
  role: string;
  teamName: string;
  teamImage?: File | null;
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    displayName: "",
    role: "",
    teamName: "",
    teamImage: null,
  });
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFormData((prev) => ({ ...prev, teamImage: file || null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      if (!formData.displayName.trim() || !formData.role.trim()) {
        toast.error("Please fill in all required fields");
        return;
      }
      setStep(2);
      return;
    }

    if (!formData.teamName.trim()) {
      toast.error("Please enter a team name");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Authentication error. Please try logging in again.");
        router.push("/login");
        return;
      }

      // Upload team image if provided
      let teamImageUrl: string | null = null;
      if (formData.teamImage) {
        const fileExt = formData.teamImage.name.split(".").pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;

        const { data: imageData, error: imageError } = await supabase.storage
          .from("team-images")
          .upload(fileName, formData.teamImage);

        if (imageError) throw imageError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("team-images").getPublicUrl(fileName);

        teamImageUrl = publicUrl;
      }

      // Create team
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert({
          name: formData.teamName.trim(),
          image_url: teamImageUrl,
          created_by: user.id,
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Create team member (admin)
      const { error: memberError } = await supabase
        .from("team_members")
        .insert({
          team_id: team.id,
          user_id: user.id,
          role: "admin",
        });

      if (memberError) throw memberError;

      // Update user profile
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        display_name: formData.displayName.trim(),
        role: formData.role.trim(),
        has_completed_onboarding: true,
        current_team_id: team.id,
      });

      if (profileError) throw profileError;

      toast.success("Welcome! Your workspace is ready.");
      router.refresh();
      router.push("/dashboard");
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center">
          {step === 1 ? "Tell us about yourself" : "Create your workspace"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 ? (
            <>
              <div className="space-y-4">
                <div>
                  <Input
                    placeholder="Display Name"
                    value={formData.displayName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        displayName: e.target.value,
                      }))
                    }
                    disabled={isLoading}
                    required
                  />
                </div>
                <div>
                  <Input
                    placeholder="Your Role (e.g., Product Manager, Developer)"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, role: e.target.value }))
                    }
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <Input
                    placeholder="Team Name"
                    value={formData.teamName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        teamName: e.target.value,
                      }))
                    }
                    disabled={isLoading}
                    required
                  />
                </div>
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isLoading}
                    className="cursor-pointer"
                  />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Optional: Upload a team logo or image
                  </p>
                </div>
              </div>
            </>
          )}
          <div className="flex justify-between pt-4">
            {step === 2 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                disabled={isLoading}
              >
                Back
              </Button>
            )}
            <Button
              type="submit"
              className={step === 1 ? "w-full" : "ml-auto"}
              disabled={isLoading}
            >
              {isLoading
                ? "Processing..."
                : step === 1
                ? "Continue"
                : "Complete Setup"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

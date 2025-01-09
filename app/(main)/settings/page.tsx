"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface NotificationPreference {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      id: "email",
      label: "Email Notifications",
      description: "Receive email notifications for important updates",
      enabled: true,
    },
    {
      id: "push",
      label: "Push Notifications",
      description: "Get push notifications in your browser",
      enabled: true,
    },
    {
      id: "mentions",
      label: "Mentions",
      description: "Notify when someone mentions you",
      enabled: true,
    },
  ]);

  const handleToggle = (id: string) => {
    setPreferences((prev) =>
      prev.map((pref) =>
        pref.id === id ? { ...pref, enabled: !pref.enabled } : pref
      )
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Configure how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {preferences.map((preference) => (
            <div
              key={preference.id}
              className="flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <Label htmlFor={preference.id}>
                  {preference.label}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {preference.description}
                </p>
              </div>
              <Switch
                id={preference.id}
                checked={preference.enabled}
                onCheckedChange={() => handleToggle(preference.id)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

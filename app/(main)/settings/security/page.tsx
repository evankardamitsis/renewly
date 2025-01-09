"use client";

import { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

interface Session {
    id: string;
    device: string;
    location: string;
    lastActive: string;
    isCurrent: boolean;
}

export default function SecurityPage() {
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [sessions, setSessions] = useState<Session[]>([
        {
            id: "1",
            device: "Chrome on MacBook Pro",
            location: "San Francisco, US",
            lastActive: "Active now",
            isCurrent: true,
        },
        {
            id: "2",
            device: "Safari on iPhone 13",
            location: "San Francisco, US",
            lastActive: "1 hour ago",
            isCurrent: false,
        },
        {
            id: "3",
            device: "Firefox on Windows PC",
            location: "San Jose, US",
            lastActive: "2 days ago",
            isCurrent: false,
        },
    ]);

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Implement password change
        setIsChangingPassword(false);
    };

    const handleRevokeSession = (sessionId: string) => {
        setSessions(sessions.filter((session) => session.id !== sessionId));
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Password</CardTitle>
                    <CardDescription>
                        Change your password and manage your account security
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isChangingPassword ? (
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input
                                    id="current-password"
                                    type="password"
                                    placeholder="Enter your current password"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    placeholder="Enter your new password"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    placeholder="Confirm your new password"
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button type="submit" className="sm:flex-1">Update Password</Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsChangingPassword(false)}
                                    className="sm:flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <Button onClick={() => setIsChangingPassword(true)}>
                            Change Password
                        </Button>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Two-Factor Authentication</CardTitle>
                    <CardDescription>
                        Add an extra layer of security to your account
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                            <Label>Two-factor authentication</Label>
                            <p className="text-sm text-muted-foreground">
                                Secure your account with 2FA
                            </p>
                        </div>
                        <Switch
                            checked={twoFactorEnabled}
                            onCheckedChange={setTwoFactorEnabled}
                        />
                    </div>
                    {twoFactorEnabled && (
                        <div className="pt-4">
                            <Button variant="outline">Set up 2FA</Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Active Sessions</CardTitle>
                    <CardDescription>
                        Manage your active sessions and sign out from other devices
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {sessions.map((session, index) => (
                        <div key={session.id}>
                            {index > 0 && <Separator className="my-4" />}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <p className="font-medium">{session.device}</p>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                        <p>{session.location}</p>
                                        <p>{session.lastActive}</p>
                                    </div>
                                </div>
                                {!session.isCurrent && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRevokeSession(session.id)}
                                    >
                                        Sign out
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </CardContent>
                <CardFooter>
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setSessions([sessions[0]])}
                    >
                        Sign out of all other devices
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
} 
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
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Profile {
    name: string;
    email: string;
    avatar?: string;
}

export default function AccountPage() {
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState<Profile>({
        name: "John Doe",
        email: "john@example.com"
    });

    const handleSave = () => {
        setIsEditing(false);
        // TODO: Save changes to the backend
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>
                        Manage your profile information
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-6">
                        <Avatar className="h-20 w-20">
                            <AvatarFallback>{profile.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-2">
                            <Button variant="outline">Change Avatar</Button>
                            <p className="text-sm text-muted-foreground">
                                JPG, GIF or PNG. Max size of 2MB.
                            </p>
                        </div>
                    </div>

                    <Separator />

                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={profile.name}
                                onChange={(e) =>
                                    setProfile({ ...profile, name: e.target.value })
                                }
                                disabled={!isEditing}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={profile.email}
                                onChange={(e) =>
                                    setProfile({ ...profile, email: e.target.value })
                                }
                                disabled={!isEditing}
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    {isEditing ? (
                        <div className="flex gap-2">
                            <Button onClick={handleSave}>Save Changes</Button>
                            <Button
                                variant="outline"
                                onClick={() => setIsEditing(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    ) : (
                        <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                    )}
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Account Management</CardTitle>
                    <CardDescription>
                        Manage your account settings and preferences
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <h3 className="font-medium">Export Data</h3>
                        <p className="text-sm text-muted-foreground">
                            Download a copy of your data, including your profile, tasks, and settings
                        </p>
                        <Button variant="outline">Export Data</Button>
                    </div>

                    <Separator />

                    <div className="grid gap-2">
                        <h3 className="font-medium text-destructive">Delete Account</h3>
                        <p className="text-sm text-muted-foreground">
                            Permanently delete your account and all associated data
                        </p>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">Delete Account</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your
                                        account and remove your data from our servers.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction className="bg-destructive text-destructive-foreground">
                                        Delete Account
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 
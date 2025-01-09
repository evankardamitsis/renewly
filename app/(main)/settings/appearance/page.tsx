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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSettings } from "@/contexts/settings-context";
import { playNotificationSound } from "@/lib/sounds";

export default function AppearancePage() {
    const [theme, setTheme] = useState("system");
    const [density, setDensity] = useState("comfortable");
    const { soundEnabled, toggleSound } = useSettings();
    const [preferences, setPreferences] = useState({
        animations: true,
        reduceMotion: false,
    });

    const handleSoundToggle = async () => {
        toggleSound();
        // Play a test sound when enabling
        if (!soundEnabled) {
            await playNotificationSound();
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Theme</CardTitle>
                    <CardDescription>
                        Customize the look and feel of the interface
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="theme">Color scheme</Label>
                        <Select value={theme} onValueChange={setTheme}>
                            <SelectTrigger id="theme">
                                <SelectValue placeholder="Select a theme" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="dark">Dark</SelectItem>
                                <SelectItem value="system">System</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <Label>Interface density</Label>
                        <RadioGroup value={density} onValueChange={setDensity}>
                            <div className="grid gap-4 pt-2">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="comfortable" id="comfortable" />
                                    <Label htmlFor="comfortable">Comfortable</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="compact" id="compact" />
                                    <Label htmlFor="compact">Compact</Label>
                                </div>
                            </div>
                        </RadioGroup>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Accessibility</CardTitle>
                    <CardDescription>
                        Customize your accessibility preferences
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="animations">Animations</Label>
                            <p className="text-sm text-muted-foreground">
                                Enable animations and transitions
                            </p>
                        </div>
                        <Switch
                            id="animations"
                            checked={preferences.animations}
                            onCheckedChange={(checked) =>
                                setPreferences({ ...preferences, animations: checked })
                            }
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="sound-effects">Sound Effects</Label>
                            <p className="text-sm text-muted-foreground">
                                Play sound effects for notifications and actions
                            </p>
                        </div>
                        <Switch
                            id="sound-effects"
                            checked={soundEnabled}
                            onCheckedChange={handleSoundToggle}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="reduce-motion">Reduce Motion</Label>
                            <p className="text-sm text-muted-foreground">
                                Minimize animations and motion effects
                            </p>
                        </div>
                        <Switch
                            id="reduce-motion"
                            checked={preferences.reduceMotion}
                            onCheckedChange={(checked) =>
                                setPreferences({ ...preferences, reduceMotion: checked })
                            }
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 
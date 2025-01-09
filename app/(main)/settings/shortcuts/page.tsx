"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ShortcutCategory {
    title: string;
    description: string;
    shortcuts: Shortcut[];
}

interface Shortcut {
    id: string;
    action: string;
    keys: string[];
    isEnabled: boolean;
}

const shortcutCategories: ShortcutCategory[] = [
    {
        title: "Navigation",
        description: "Shortcuts for navigating around the application",
        shortcuts: [
            {
                id: "nav-search",
                action: "Global Search",
                keys: ["⌘", "K"],
                isEnabled: true,
            },
            {
                id: "nav-home",
                action: "Go to Home",
                keys: ["G", "H"],
                isEnabled: true,
            },
            {
                id: "nav-projects",
                action: "Go to Projects",
                keys: ["G", "P"],
                isEnabled: true,
            },
            {
                id: "nav-settings",
                action: "Go to Settings",
                keys: ["G", "S"],
                isEnabled: true,
            },
        ],
    },
    {
        title: "Tasks",
        description: "Shortcuts for managing tasks",
        shortcuts: [
            {
                id: "task-new",
                action: "Create New Task",
                keys: ["⌘", "N"],
                isEnabled: true,
            },
            {
                id: "task-complete",
                action: "Complete Task",
                keys: ["⌘", "Enter"],
                isEnabled: true,
            },
            {
                id: "task-delete",
                action: "Delete Task",
                keys: ["⌘", "Backspace"],
                isEnabled: true,
            },
            {
                id: "task-edit",
                action: "Edit Task",
                keys: ["E"],
                isEnabled: true,
            },
        ],
    },
    {
        title: "Views",
        description: "Shortcuts for changing views and filters",
        shortcuts: [
            {
                id: "view-board",
                action: "Board View",
                keys: ["⌘", "1"],
                isEnabled: true,
            },
            {
                id: "view-list",
                action: "List View",
                keys: ["⌘", "2"],
                isEnabled: true,
            },
            {
                id: "view-calendar",
                action: "Calendar View",
                keys: ["⌘", "3"],
                isEnabled: true,
            },
            {
                id: "view-timeline",
                action: "Timeline View",
                keys: ["⌘", "4"],
                isEnabled: true,
            },
        ],
    },
];

export default function ShortcutsPage() {
    const [categories, setCategories] = useState(shortcutCategories);

    const toggleShortcut = (categoryIndex: number, shortcutId: string) => {
        setCategories(
            categories.map((category, index) => {
                if (index === categoryIndex) {
                    return {
                        ...category,
                        shortcuts: category.shortcuts.map((shortcut) => {
                            if (shortcut.id === shortcutId) {
                                return { ...shortcut, isEnabled: !shortcut.isEnabled };
                            }
                            return shortcut;
                        }),
                    };
                }
                return category;
            })
        );
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Keyboard Shortcuts</CardTitle>
                    <CardDescription>
                        Customize keyboard shortcuts to improve your workflow
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground mb-6">
                        <p className="flex flex-wrap items-center gap-1">
                            Press{" "}
                            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                ⌘
                            </kbd>{" "}
                            +{" "}
                            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                ?
                            </kbd>{" "}
                            anywhere to show keyboard shortcuts.
                        </p>
                    </div>

                    <div className="space-y-8">
                        {categories.map((category, categoryIndex) => (
                            <div key={category.title}>
                                <div className="mb-4">
                                    <h3 className="text-lg font-medium">{category.title}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {category.description}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {category.shortcuts.map((shortcut) => (
                                        <div key={shortcut.id}>
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                <div className="space-y-1">
                                                    <Label>{shortcut.action}</Label>
                                                    <div className="flex flex-wrap gap-1">
                                                        {shortcut.keys.map((key, index) => (
                                                            <kbd
                                                                key={index}
                                                                className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100"
                                                            >
                                                                {key}
                                                            </kbd>
                                                        ))}
                                                    </div>
                                                </div>
                                                <Switch
                                                    checked={shortcut.isEnabled}
                                                    onCheckedChange={() =>
                                                        toggleShortcut(categoryIndex, shortcut.id)
                                                    }
                                                />
                                            </div>
                                            {shortcut.id !== category.shortcuts[category.shortcuts.length - 1].id && (
                                                <Separator className="my-4" />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {categoryIndex !== categories.length - 1 && (
                                    <Separator className="my-8" />
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Reset Shortcuts</CardTitle>
                    <CardDescription>
                        Restore keyboard shortcuts to their default settings
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        variant="outline"
                        onClick={() => setCategories(shortcutCategories)}
                        className="w-full sm:w-auto"
                    >
                        Reset to Defaults
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
} 
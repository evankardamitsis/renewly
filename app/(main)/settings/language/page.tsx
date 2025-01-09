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
import { Separator } from "@/components/ui/separator";

const languages = [
    { value: "en", label: "English" },
    { value: "es", label: "Español" },
    { value: "fr", label: "Français" },
    { value: "de", label: "Deutsch" },
    { value: "it", label: "Italiano" },
    { value: "pt", label: "Português" },
    { value: "ru", label: "Русский" },
    { value: "zh", label: "中文" },
    { value: "ja", label: "日本語" },
    { value: "ko", label: "한국어" },
];

const regions = [
    { value: "us", label: "United States" },
    { value: "gb", label: "United Kingdom" },
    { value: "eu", label: "European Union" },
    { value: "ca", label: "Canada" },
    { value: "au", label: "Australia" },
    { value: "br", label: "Brazil" },
    { value: "in", label: "India" },
    { value: "jp", label: "Japan" },
];

const dateFormats = [
    { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
    { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
    { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

const timeFormats = [
    { value: "12", label: "12-hour (AM/PM)" },
    { value: "24", label: "24-hour" },
];

export default function LanguagePage() {
    const [language, setLanguage] = useState("en");
    const [region, setRegion] = useState("us");
    const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
    const [timeFormat, setTimeFormat] = useState("12");

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Language</CardTitle>
                    <CardDescription>
                        Choose your preferred language for the interface
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="language">Display Language</Label>
                        <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger id="language">
                                <SelectValue placeholder="Select a language" />
                            </SelectTrigger>
                            <SelectContent>
                                {languages.map((lang) => (
                                    <SelectItem key={lang.value} value={lang.value}>
                                        {lang.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                            This will change the language of all text in the application
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Regional Settings</CardTitle>
                    <CardDescription>
                        Customize how dates, times, and numbers are displayed
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="region">Region</Label>
                        <Select value={region} onValueChange={setRegion}>
                            <SelectTrigger id="region">
                                <SelectValue placeholder="Select a region" />
                            </SelectTrigger>
                            <SelectContent>
                                {regions.map((reg) => (
                                    <SelectItem key={reg.value} value={reg.value}>
                                        {reg.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <Label htmlFor="date-format">Date Format</Label>
                        <Select value={dateFormat} onValueChange={setDateFormat}>
                            <SelectTrigger id="date-format">
                                <SelectValue placeholder="Select a date format" />
                            </SelectTrigger>
                            <SelectContent>
                                {dateFormats.map((format) => (
                                    <SelectItem key={format.value} value={format.value}>
                                        {format.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <Label htmlFor="time-format">Time Format</Label>
                        <Select value={timeFormat} onValueChange={setTimeFormat}>
                            <SelectTrigger id="time-format">
                                <SelectValue placeholder="Select a time format" />
                            </SelectTrigger>
                            <SelectContent>
                                {timeFormats.map((format) => (
                                    <SelectItem key={format.value} value={format.value}>
                                        {format.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 
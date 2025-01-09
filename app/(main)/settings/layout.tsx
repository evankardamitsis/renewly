'use client'

import { Sidebar } from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    Bell,
    Palette,
    Globe,
    User,
    Shield,
    Keyboard,
    Menu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { useState } from "react"

const settingsNav = [
    {
        title: "Notifications",
        href: "/settings",
        icon: Bell,
    },
    {
        title: "Appearance",
        href: "/settings/appearance",
        icon: Palette,
    },
    {
        title: "Language",
        href: "/settings/language",
        icon: Globe,
    },
    {
        title: "Account",
        href: "/settings/account",
        icon: User,
    },
    {
        title: "Security",
        href: "/settings/security",
        icon: Shield,
    },
    {
        title: "Keyboard Shortcuts",
        href: "/settings/shortcuts",
        icon: Keyboard,
    },
]

function SettingsNav() {
    const pathname = usePathname()

    return (
        <nav className="flex flex-col gap-2">
            {settingsNav.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                        pathname === item.href
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground"
                    )}
                >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                </Link>
            ))}
        </nav>
    )
}

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [open, setOpen] = useState(false)

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Settings</h1>
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="lg:hidden">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Toggle settings menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[240px] p-4">
                        <SheetTitle>Settings Menu</SheetTitle>
                        <Sidebar>
                            <SettingsNav />
                        </Sidebar>
                    </SheetContent>
                </Sheet>
            </div>
            <div className="flex gap-6 relative">
                <aside className="hidden lg:block w-[240px] shrink-0 sticky top-6">
                    <Sidebar>
                        <SettingsNav />
                    </Sidebar>
                </aside>
                <div className="flex-1 max-w-3xl">
                    {children}
                </div>
            </div>
        </div>
    )
} 
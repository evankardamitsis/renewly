"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    LayoutDashboard,
    Calendar,
    Settings,
    MessageSquare,
    BarChart,
    Folder,
    Grid,
    X
} from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const navItems = [
    {
        title: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        color: "bg-blue-500",
    },
    {
        title: "Projects",
        href: "/projects",
        icon: Folder,
        color: "bg-purple-500",
    },
    {
        title: "Calendar",
        href: "/calendar",
        icon: Calendar,
        color: "bg-green-500",
    },
    {
        title: "Analytics",
        href: "/analytics",
        icon: BarChart,
        color: "bg-yellow-500",
    },
    {
        title: "Messages",
        href: "/messages",
        icon: MessageSquare,
        color: "bg-pink-500",
    },
    {
        title: "Settings",
        href: "/settings",
        icon: Settings,
        color: "bg-gray-500",
    },
]

export function PowerNav() {
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()
    const pathname = usePathname()

    const handleNavigation = (href: string) => {
        setIsOpen(false)
        router.push(href)
    }

    return (
        <TooltipProvider>
            <div className="fixed bottom-8 right-8 z-50">
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{
                                type: "spring",
                                stiffness: 260,
                                damping: 20,
                            }}
                            className="absolute bottom-20 right-0 flex flex-col gap-3"
                            style={{
                                originY: 1,
                                originX: 1,
                            }}
                        >
                            {navItems.map((item, index) => (
                                <Tooltip key={item.href}>
                                    <TooltipTrigger asChild>
                                        <motion.button
                                            className={cn(
                                                "flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-shadow hover:shadow-xl",
                                                item.color,
                                                pathname === item.href && "ring-2 ring-white"
                                            )}
                                            onClick={() => handleNavigation(item.href)}
                                            initial={{ scale: 0, y: 50 }}
                                            animate={{ scale: 1, y: 0 }}
                                            exit={{
                                                scale: 0,
                                                y: 50,
                                                transition: { delay: index * 0.05 },
                                            }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 260,
                                                damping: 20,
                                                delay: index * 0.05,
                                            }}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <item.icon className="h-5 w-5" />
                                        </motion.button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                        <p>{item.title}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <motion.button
                            className={cn(
                                "relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-colors hover:shadow-xl",
                                isOpen && "bg-red-500"
                            )}
                            onClick={() => setIsOpen(!isOpen)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            initial={false}
                            animate={{
                                rotate: isOpen ? 360 : 0,
                                backgroundColor: isOpen ? "rgb(239, 68, 68)" : "rgb(147, 51, 234)",
                            }}
                            transition={{ duration: 0.3 }}
                        >
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={isOpen ? "close" : "open"}
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0, rotate: 180 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {isOpen ? (
                                        <X className="h-6 w-6" />
                                    ) : (
                                        <Grid className="h-6 w-6" />
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </motion.button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{isOpen ? "Close Menu" : "Open Navigation"}</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    )
} 
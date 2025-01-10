"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export function NavigationLoader() {
    const [isLoading, setIsLoading] = useState(false)
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
        setIsLoading(true)
        const timeout = setTimeout(() => setIsLoading(false), 500)
        return () => clearTimeout(timeout)
    }, [pathname, searchParams])

    return (
        <motion.div
            className={cn(
                "fixed inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500",
                "origin-left",
                !isLoading && "opacity-0"
            )}
            initial={{ scaleX: 0 }}
            animate={{
                scaleX: isLoading ? 0.8 : 1,
                opacity: isLoading ? 1 : 0,
                transition: {
                    opacity: { delay: isLoading ? 0 : 0.2 },
                    scaleX: { duration: isLoading ? 1.5 : 0.2 },
                },
            }}
        />
    )
} 
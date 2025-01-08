import Link from "next/link"
import { cn } from "@/lib/utils"

interface LogoProps {
    className?: string
    showText?: boolean
}

export function Logo({ className, showText = true }: LogoProps) {
    return (
        <Link href="/" className={cn("flex items-center space-x-2", className)}>
            <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-foreground"
            >
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M16 32C24.8366 32 32 24.8366 32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32ZM16 26C21.5228 26 26 21.5228 26 16C26 10.4772 21.5228 6 16 6C10.4772 6 6 10.4772 6 16C6 21.5228 10.4772 26 16 26Z"
                    fill="currentColor"
                />
            </svg>
            {showText && (
                <span className="font-bold text-xl text-foreground">Renewly</span>
            )}
        </Link>
    )
} 
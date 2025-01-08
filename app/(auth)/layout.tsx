import { Logo } from "@/components/@shared/logo"
import { ThemeToggle } from "@/components/@shared/theme-toggle"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md p-6 space-y-8">
          <div className="flex justify-center">
            <Logo className="mb-4" />
          </div>
          {children}
        </div>
      </div>
    </div>
  )
} 
import { Header } from "@/components/@shared/header"
import { PowerNav } from "@/components/@shared/power-nav"

export default function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            <Header />
            <div className="flex flex-1">
                <main className="flex-1">{children}</main>
            </div>
            <PowerNav />
        </>
    )
} 
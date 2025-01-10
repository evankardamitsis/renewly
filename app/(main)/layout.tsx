import { Suspense } from "react"
import { Header } from "@/components/@shared/header"
import { PowerNav } from "@/components/@shared/power-nav"
import { NavigationLoader } from "@/components/@shared/navigation-loader"

export default function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            <NavigationLoader />
            <Header />
            <div className="flex flex-1">
                <Suspense fallback={
                    <div className="flex-1 p-6">
                        <div className="h-9 w-48 animate-pulse rounded-md bg-muted" />
                        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className="h-[350px] animate-pulse rounded-xl bg-muted"
                                />
                            ))}
                        </div>
                    </div>
                }>
                    <main className="flex-1">{children}</main>
                </Suspense>
            </div>
            <PowerNav />
        </>
    )
} 
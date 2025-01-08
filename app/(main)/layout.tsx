import { Header } from "@/components/@shared/header"

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
        </>
    )
} 
export default function DashboardLoading() {
    return (
        <div className="container py-6 space-y-8">
            <div className="flex items-start justify-between">
                <div>
                    <div className="h-9 w-48 animate-pulse rounded-md bg-muted" />
                    <div className="mt-2 h-5 w-64 animate-pulse rounded-md bg-muted" />
                </div>
                <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="h-[350px] animate-pulse rounded-xl bg-muted"
                    />
                ))}
            </div>
        </div>
    )
}
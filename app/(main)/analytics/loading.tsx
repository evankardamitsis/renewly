export default function AnalyticsLoading() {
    return (
        <div className="container py-6 space-y-8">
            <div className="flex items-center justify-between">
                <div className="h-9 w-48 animate-pulse rounded-md bg-muted" />
                <div className="flex gap-2">
                    <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
                    <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="rounded-lg border p-6 animate-pulse"
                    >
                        <div className="h-4 w-1/2 rounded bg-muted" />
                        <div className="mt-4 h-8 w-3/4 rounded bg-muted" />
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-lg border p-6">
                    <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
                    <div className="mt-4 h-[300px] animate-pulse rounded bg-muted" />
                </div>
                <div className="rounded-lg border p-6">
                    <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
                    <div className="mt-4 h-[300px] animate-pulse rounded bg-muted" />
                </div>
            </div>
        </div>
    )
} 
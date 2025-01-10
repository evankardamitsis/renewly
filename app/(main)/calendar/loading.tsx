export default function CalendarLoading() {
    return (
        <div className="container py-6 space-y-8">
            <div className="flex items-center justify-between">
                <div className="h-9 w-48 animate-pulse rounded-md bg-muted" />
                <div className="flex gap-2">
                    <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
                    <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
                </div>
            </div>

            <div className="rounded-lg border bg-card">
                {/* Calendar Header */}
                <div className="grid grid-cols-7 gap-px border-b">
                    {[...Array(7)].map((_, i) => (
                        <div key={i} className="h-12 animate-pulse bg-muted" />
                    ))}
                </div>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-px">
                    {[...Array(35)].map((_, i) => (
                        <div
                            key={i}
                            className="aspect-square animate-pulse bg-muted p-2"
                        />
                    ))}
                </div>
            </div>
        </div>
    )
} 
export default function TeamLoading() {
    return (
        <div className="container py-6 space-y-8">
            <div className="flex items-center justify-between">
                <div className="h-9 w-48 animate-pulse rounded-md bg-muted" />
                <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(9)].map((_, i) => (
                    <div
                        key={i}
                        className="rounded-lg border p-6 animate-pulse"
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-muted" />
                            <div className="space-y-2">
                                <div className="h-4 w-32 rounded bg-muted" />
                                <div className="h-3 w-24 rounded bg-muted" />
                            </div>
                        </div>
                        <div className="mt-4 space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 rounded bg-muted" />
                                <div className="h-4 w-32 rounded bg-muted" />
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 rounded bg-muted" />
                                <div className="h-4 w-40 rounded bg-muted" />
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <div className="h-8 w-8 rounded-full bg-muted" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
} 
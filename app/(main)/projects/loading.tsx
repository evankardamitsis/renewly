export default function ProjectsLoading() {
    return (
        <div className="container py-6 space-y-8">
            <div className="flex items-center justify-between">
                <div className="h-9 w-48 animate-pulse rounded-md bg-muted" />
                <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="group relative rounded-lg border p-6 hover:shadow-md animate-pulse"
                    >
                        <div className="h-7 w-3/4 rounded bg-muted" />
                        <div className="mt-2 h-4 w-1/2 rounded bg-muted" />
                        <div className="mt-4 space-y-2">
                            <div className="h-4 w-full rounded bg-muted" />
                            <div className="h-4 w-2/3 rounded bg-muted" />
                        </div>
                        <div className="mt-4 flex justify-between">
                            <div className="h-4 w-20 rounded bg-muted" />
                            <div className="h-4 w-24 rounded bg-muted" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
} 
export default function SettingsLoading() {
    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="h-9 w-48 animate-pulse rounded-md bg-muted" />
            </div>
            <div className="flex gap-6 relative">
                {/* Sidebar */}
                <aside className="hidden lg:block w-[240px] shrink-0 space-y-2">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="h-10 animate-pulse rounded-lg bg-muted"
                        />
                    ))}
                </aside>

                {/* Main Content */}
                <div className="flex-1 max-w-3xl space-y-6">
                    <div className="rounded-lg border p-6">
                        <div className="space-y-4">
                            <div className="h-6 w-1/4 animate-pulse rounded bg-muted" />
                            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                            <div className="space-y-3 pt-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className="h-5 w-1/4 animate-pulse rounded bg-muted" />
                                        <div className="h-10 flex-1 animate-pulse rounded-md bg-muted" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border p-6">
                        <div className="space-y-4">
                            <div className="h-6 w-1/4 animate-pulse rounded bg-muted" />
                            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                            <div className="grid gap-4 pt-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                                            <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                                        </div>
                                        <div className="h-6 w-12 animate-pulse rounded-full bg-muted" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 
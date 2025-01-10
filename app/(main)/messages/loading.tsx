export default function MessagesLoading() {
    return (
        <div className="container flex h-[calc(100vh-3.5rem)] divide-x">
            {/* Sidebar */}
            <div className="w-80 shrink-0 p-4 space-y-4">
                <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
                <div className="space-y-2">
                    {[...Array(10)].map((_, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 rounded-lg p-3 animate-pulse bg-muted"
                        >
                            <div className="h-10 w-10 rounded-full bg-muted-foreground/10" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-3/4 rounded bg-muted-foreground/10" />
                                <div className="h-3 w-1/2 rounded bg-muted-foreground/10" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6">
                <div className="flex h-full flex-col">
                    {/* Chat Header */}
                    <div className="flex items-center gap-3 border-b pb-4">
                        <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                        <div className="space-y-1">
                            <div className="h-4 w-32 rounded bg-muted" />
                            <div className="h-3 w-24 rounded bg-muted" />
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 space-y-4 py-4">
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={i}
                                className={`flex items-start gap-2 ${i % 2 === 0 ? "flex-row" : "flex-row-reverse"
                                    }`}
                            >
                                <div className="h-8 w-8 rounded-full bg-muted" />
                                <div
                                    className={`max-w-[70%] space-y-1 ${i % 2 === 0 ? "items-start" : "items-end"
                                        }`}
                                >
                                    <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                                    <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="border-t pt-4">
                        <div className="flex gap-2">
                            <div className="flex-1 h-10 animate-pulse rounded-md bg-muted" />
                            <div className="h-10 w-10 animate-pulse rounded-md bg-muted" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 
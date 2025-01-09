import * as React from "react";
import { cn } from "@/lib/utils";

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex h-full w-full flex-col bg-background", className)}
        {...props}
      >
        <div className="flex-1 overflow-y-auto py-2">{children}</div>
      </div>
    );
  }
);
Sidebar.displayName = "Sidebar";

export { Sidebar };

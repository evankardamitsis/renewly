"use client";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  containerClassName?: string;
  noContainer?: boolean;
}

export function LoadingSpinner({
  className,
  containerClassName,
  noContainer = false,
  ...props
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={cn(
        "h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent",
        className
      )}
      {...props}
    />
  );

  if (noContainer) return spinner;

  return (
    <div className={cn("flex h-[50vh] w-full items-center justify-center", containerClassName)}>
      {spinner}
    </div>
  );
}

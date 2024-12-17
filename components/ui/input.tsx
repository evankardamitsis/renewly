import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Input Component
 * 
 * A styled input component that follows the design system.
 * Supports all standard HTML input attributes and custom styling.
 * 
 * Features:
 * - Consistent styling with other form elements
 * - Focus and hover states
 * - Support for disabled state
 * - File input styling
 * 
 * @param props - Standard HTML input props plus optional className
 * @returns {JSX.Element} Styled input element
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }

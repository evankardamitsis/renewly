import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes
 * 
 * Combines multiple class names and handles conflicting Tailwind classes
 * using clsx for conditional classes and tailwind-merge for deduplication
 * 
 * @param {...ClassValue[]} inputs - Class names to be merged
 * @returns {string} Merged and deduplicated class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

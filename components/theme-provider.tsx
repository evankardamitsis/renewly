"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";

/**
 * ThemeProvider Component
 * 
 * A wrapper component that provides theme context to the application using next-themes.
 * This enables consistent theme management across the application, including dark/light mode switching.
 * 
 * @param {React.ReactNode} children - Child components that will have access to the theme context
 * @param {ThemeProviderProps} props - Additional props passed to NextThemesProvider
 * @returns {JSX.Element} A themed provider wrapper component
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

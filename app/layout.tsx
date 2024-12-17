import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/@shared/theme-provider";
import { Header } from "@/components/@shared/header";

// Configure Inter font with Latin subset
const inter = Inter({ subsets: ["latin"] });

/**
 * Metadata configuration for the application
 */
export const metadata: Metadata = {
  title: "Renewly - Task Management Dashboard",
  description: "Modern task management solution for teams",
};

/**
 * Root Layout Component
 * 
 * Provides the base structure for all pages including:
 * - Font configuration
 * - Theme provider
 * - Global layout structure
 * - Header component
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Page content to be rendered
 * @returns {JSX.Element} The root layout structure
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <div className="flex flex-1">
              <main className="flex-1">{children}</main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

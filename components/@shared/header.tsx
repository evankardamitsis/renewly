"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { MainNav } from "@/components/@shared/main-nav";
import { Mic, Bell, Folder, ChevronDown, LayoutGrid, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/@shared/theme-toggle";

export function Header() {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    console.log("Toggling sidebar. Current state:", isSidebarOpen);
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 md:px-6">
        <div className="flex items-center gap-6 md:gap-8">
          {/* Renewly Logo */}
          <a href="/" className="flex items-center space-x-2">
            <div className="size-8 rounded bg-primary/20">
              <div className="size-full rounded-sm bg-primary p-2 text-primary-foreground">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <span className="font-bold text-xl">Renewly</span>
          </a>

          {/* Search */}
          <div className="relative flex-1 max-w-xl">
            <div
              className={cn(
                "absolute inset-0 -z-10 rounded-lg bg-accent/50 transition-all",
                isSearchFocused ? "opacity-100 blur-xl" : "opacity-0 blur-none"
              )}
            />
            <div className="relative flex items-center">
              <Input
                type="search"
                placeholder="Search"
                className="pl-8 pr-12 bg-accent/50"
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 hover:bg-transparent"
              >
                <Mic className="size-4" />
                <span className="sr-only">Voice search</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-4">
          {/* Add ThemeToggle before team section */}
          <ThemeToggle />
          
          {/* Team Section */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <Avatar className="border-2 border-background size-6">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>CM</AvatarFallback>
              </Avatar>
              <Avatar className="border-2 border-background size-6">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>SO</AvatarFallback>
              </Avatar>
            </div>
            <Button variant="secondary" size="sm" className="h-7 text-xs gap-1">
              <span>Team mate</span>
              <Plus className="size-3" />
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell className="size-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Folder className="size-5" />
            </Button>
          </div>

          {/* User */}
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon">
              <ChevronDown className="size-4" />
            </Button>
          </div>

          {/* Menu */}
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="ml-2"
                onClick={toggleSidebar}
              >
                <LayoutGrid className="size-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <Sidebar>
                <MainNav />
              </Sidebar>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

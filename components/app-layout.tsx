"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Menu, Gem, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen w-full bg-background">
            {sidebarOpen && (
                <button
                    aria-label="Close menu"
                    className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm duration-200 animate-in fade-in md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div
                className={cn(
                    "fixed inset-y-0 left-0 z-50 transition-[transform,width] duration-300 ease-[var(--ease-swift)] md:translate-x-0 md:p-3",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full",
                    isCollapsed ? "w-[76px]" : "w-64"
                )}
            >
                <Sidebar onClose={() => setSidebarOpen(false)} isCollapsed={isCollapsed} />
            </div>

            <div
                className={cn(
                    "flex min-h-screen w-full flex-1 flex-col transition-[padding] duration-300 ease-[var(--ease-swift)]",
                    isCollapsed ? "md:pl-[76px]" : "md:pl-64"
                )}
            >
                <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/85 px-4 backdrop-blur-md md:px-8">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open menu"
                    >
                        <Menu className="size-5" />
                    </Button>

                    <div className="flex items-center gap-2 md:hidden">
                        <Gem className="size-4.5 text-primary" strokeWidth={1.8} />
                        <span className="font-heading text-sm font-semibold tracking-tight">
                            Boutique
                        </span>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="hidden text-muted-foreground md:flex"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        aria-label={isCollapsed ? "Expand menu" : "Collapse menu"}
                    >
                        <PanelLeft className="size-4.5" />
                    </Button>

                    <div className="ml-auto flex items-center gap-2">
                        <ThemeToggle />
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden">
                    <div className="mx-auto h-full max-w-[1600px] px-4 py-6 md:px-8 md:py-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

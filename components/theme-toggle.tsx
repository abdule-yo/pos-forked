"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="text-muted-foreground hover:text-foreground"
        >
            {/* Both icons are always mounted and cross-fade, so the button never
                flickers between server and client render. */}
            <Sun className="size-4.5 rotate-0 scale-100 transition-transform duration-300 ease-[var(--ease-settle)] dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute size-4.5 rotate-90 scale-0 transition-transform duration-300 ease-[var(--ease-settle)] dark:rotate-0 dark:scale-100" />
        </Button>
    );
}

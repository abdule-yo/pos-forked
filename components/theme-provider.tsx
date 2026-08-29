"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

/**
 * next-themes applies the saved theme with a blocking inline `<script>` so the
 * page never paints in the wrong colours. That script only ever runs while the
 * browser parses the server HTML — when React creates the node itself on the
 * client (the Strict Mode remount in development) it can never execute, and
 * React says so in the console.
 *
 * Next.js documents the fix for inline scripts: mark it executable on the
 * server and as an inert data block on the client. By the time the client
 * renders, the script has already done its work during parsing.
 * See `01-app/02-guides/preventing-flash-before-hydration.md` in the Next docs.
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      scriptProps={{
        type: typeof window === "undefined" ? "text/javascript" : "text/plain",
      }}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

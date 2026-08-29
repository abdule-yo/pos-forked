import { getSessionCookie } from "better-auth/cookies";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * An optimistic gate: it only checks that a session cookie is present, so a
 * signed-out visitor lands on /login instead of a flash of the app shell.
 *
 * It deliberately does not verify the session. Next runs this ahead of
 * rendering — on Vercel, at the edge — where calling back into
 * /api/auth/get-session would cost a second function invocation on every
 * navigation. The real gate is `requireUser` / `requireAdmin` in lib/session.ts,
 * which reads the session and the role from the database on each request.
 */
export function proxy(request: NextRequest) {
    if (!getSessionCookie(request)) {
        const login = new URL("/login", request.url);
        return NextResponse.redirect(login);
    }
    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
};

import { createAuthClient } from "better-auth/react";

/**
 * No baseURL: the client talks to whatever origin the page was served from.
 *
 * It previously fell back to a hardcoded "http://localhost:3000", which is
 * baked into the browser bundle at build time — so any deployment that did not
 * set NEXT_PUBLIC_APP_URL would ship a login form that calls localhost.
 */
export const authClient = createAuthClient();

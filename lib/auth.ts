import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

import { dash } from "@better-auth/infra";

/**
 * Where the app is actually served from. Better Auth signs callbacks against
 * this and validates request origins with it, so a wrong value does not fail
 * loudly — it shows up as a login that redirects nowhere.
 *
 * Set BETTER_AUTH_URL to the real domain in production. The Vercel fallbacks
 * below cover the case where it is missing: preview deployments get a fresh
 * hostname on every push, which no fixed env var can know in advance.
 */
const vercelURL =
    process.env.VERCEL_ENV === "production"
        ? process.env.VERCEL_PROJECT_PRODUCTION_URL
        : process.env.VERCEL_URL;

const baseURL =
    process.env.BETTER_AUTH_URL || (vercelURL ? `https://${vercelURL}` : undefined);

export const auth = betterAuth({
    // Omitted entirely when unset, so local development keeps deriving the
    // origin from the incoming request.
    ...(baseURL ? { baseURL } : {}),
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "user"
            }
        }
    },
    /**
     * `baseURL` is trusted automatically. Anything else — a cloudflared or
     * ngrok tunnel used to try the till on a phone — goes in the
     * BETTER_AUTH_TRUSTED_ORIGINS env var as a comma-separated list, which
     * Better Auth reads on its own. Tunnel hostnames rotate, so hardcoding
     * them here means a redeploy every time one changes.
     */
    plugins: [
        dash()
    ]
});

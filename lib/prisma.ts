import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/**
 * Postgres counts connections, not requests. A long-lived server opens one pool
 * and keeps it; Vercel runs many short-lived instances at once, each with a
 * pool of its own, so the default of 10 per instance can exhaust the database
 * long before the app is under any real load.
 *
 * Three is enough for the handful of queries a page renders in parallel while
 * leaving room for the shop to have several tills open. Raise
 * DATABASE_POOL_MAX if the database is sized for it.
 */
const DEFAULT_POOL_MAX = process.env.VERCEL ? 3 : 10;
const poolMax = Number(process.env.DATABASE_POOL_MAX) || DEFAULT_POOL_MAX;

function createPrismaClient() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        // Failing here names the problem. Without it the first query fails
        // instead, somewhere far from the cause.
        throw new Error("DATABASE_URL is not set.");
    }

    const pool = new Pool({
        connectionString,
        max: poolMax,
        // Hand connections back rather than holding them while an idle instance
        // waits to be reused or frozen.
        idleTimeoutMillis: 10_000,
        connectionTimeoutMillis: 10_000,
    });

    return new PrismaClient({ adapter: new PrismaPg(pool) });
}

// Reused across hot reloads in development, where every edit would otherwise
// leave another pool behind.
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

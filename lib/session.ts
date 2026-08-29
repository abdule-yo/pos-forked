import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Role read from the database rather than the session, so an owner who demotes
 * someone takes effect immediately instead of when that person next signs in.
 */
export async function getCurrentUser() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) return null;

    return prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true, role: true },
    });
}

export async function requireUser() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    return user;
}

/**
 * Pages showing what the shop earns are the owner's. Hiding the link in the
 * sidebar is presentation; this is the actual gate.
 */
export async function requireAdmin() {
    const user = await requireUser();
    if (user.role !== "admin") redirect("/pos");
    return user;
}

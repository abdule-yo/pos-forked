"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { SALE_INCLUDE } from "@/lib/sale-include";

export async function getCustomers() {
    await requireUser();

    const customers = await prisma.customer.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            sales: { select: { totalAmount: true, createdAt: true } },
        },
    });

    // Totals are what the shop actually looks at: who spends, and who has
    // stopped coming in.
    return customers.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        note: c.note,
        createdAt: c.createdAt,
        purchases: c.sales.length,
        totalSpent: c.sales.reduce((sum, s) => sum + s.totalAmount, 0),
        lastVisit:
            c.sales.length > 0
                ? c.sales.reduce((latest, s) => (s.createdAt > latest ? s.createdAt : latest), c.sales[0].createdAt)
                : null,
    }));
}

export async function getCustomerWithHistory(id: string) {
    await requireUser();

    return prisma.customer.findUnique({
        where: { id },
        include: {
            sales: {
                orderBy: { createdAt: "desc" },
                include: SALE_INCLUDE,
            },
        },
    });
}

export async function createCustomer(data: { name: string; phone?: string; note?: string }) {
    await requireUser();

    const name = data.name.trim();
    if (!name) throw new Error("Enter the customer's name.");

    // Two people at the counter can easily be typed the same way; reuse the
    // existing record instead of creating a duplicate.
    const existing = await prisma.customer.findFirst({
        where: { name: { equals: name, mode: "insensitive" } },
    });
    if (existing) return existing;

    const customer = await prisma.customer.create({
        data: {
            name,
            phone: data.phone?.trim() || null,
            note: data.note?.trim() || null,
        },
    });

    revalidatePath("/customers");
    revalidatePath("/pos");
    return customer;
}

export async function updateCustomer(
    id: string,
    data: { name?: string; phone?: string; note?: string }
) {
    await requireUser();

    const customer = await prisma.customer.update({
        where: { id },
        data: {
            ...(data.name !== undefined && { name: data.name.trim() }),
            ...(data.phone !== undefined && { phone: data.phone.trim() || null }),
            ...(data.note !== undefined && { note: data.note.trim() || null }),
        },
    });

    revalidatePath("/customers");
    return customer;
}

export async function deleteCustomer(id: string) {
    await requireUser();

    // Their past sales stay on the books; the sale keeps the name it recorded.
    await prisma.sale.updateMany({ where: { customerId: id }, data: { customerId: null } });
    await prisma.customer.delete({ where: { id } });

    revalidatePath("/customers");
    revalidatePath("/sales");
    return true;
}

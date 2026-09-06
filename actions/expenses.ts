"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";

export async function getExpenses() {
    await requireAdmin();

    return await prisma.expense.findMany({
        orderBy: { createdAt: "desc" },
    });
}

export async function createExpense(data: { description: string; amount: number; category?: string }) {
    await requireAdmin();

    if (!Number.isFinite(data.amount) || data.amount <= 0) {
        throw new Error("Enter an amount greater than zero.");
    }

    const expense = await prisma.expense.create({
        data: {
            description: data.description.trim(),
            amount: data.amount,
            category: data.category?.trim() || null,
        },
    });
    revalidatePath("/expenses");
    revalidatePath("/");
    return expense;
}

export async function deleteExpense(id: string) {
    await requireAdmin();

    // Nothing references an expense, so it simply goes.
    await prisma.expense.delete({ where: { id } });

    revalidatePath("/expenses");
    revalidatePath("/");
    return true;
}

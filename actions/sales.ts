"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { SALE_INCLUDE } from "@/lib/sale-include";

const PAYMENT_METHODS = ["Cash", "Zaad", "eDahab", "Bank"];

export type CartLine = { productId: string; quantity: number };

/**
 * Records one sale containing any number of items.
 *
 * Everything happens in a single transaction, and stock is re-read *inside* it,
 * so two people at the counter cannot both sell the last bag. If any line fails
 * the whole sale is abandoned and no stock moves.
 */
export async function createSale(data: {
    lines: CartLine[];
    paymentMethod: string;
    discount?: number;
    customerId?: string;
    customerName?: string;
    note?: string;
}) {
    const user = await requireUser();

    if (!data.lines?.length) {
        throw new Error("Add at least one item to the sale.");
    }
    if (!PAYMENT_METHODS.includes(data.paymentMethod)) {
        throw new Error("Choose how the customer paid.");
    }
    for (const line of data.lines) {
        // A negative or fractional quantity used to reach `decrement` directly,
        // which quietly *added* stock and recorded a negative-value sale.
        if (!Number.isInteger(line.quantity) || line.quantity < 1) {
            throw new Error("Every item needs a whole quantity of at least 1.");
        }
    }

    const discount = Number(data.discount ?? 0);
    if (!Number.isFinite(discount) || discount < 0) {
        throw new Error("Discount cannot be negative.");
    }

    const sale = await prisma.$transaction(async (tx) => {
        const items = [];
        let subtotal = 0;

        for (const line of data.lines) {
            const product = await tx.product.findUnique({ where: { id: line.productId } });
            if (!product) throw new Error("One of these items no longer exists.");
            if (product.stock < line.quantity) {
                throw new Error(
                    `Not enough ${product.name} — only ${product.stock} left.`
                );
            }

            const lineTotal = product.price * line.quantity;
            subtotal += lineTotal;

            await tx.product.update({
                where: { id: product.id },
                data: { stock: { decrement: line.quantity } },
            });

            items.push({
                productId: product.id,
                // Name, price and cost are snapshotted: editing the product
                // later must never rewrite what this sale earned.
                productName: product.name,
                quantity: line.quantity,
                unitPrice: product.price,
                unitCost: product.costPrice,
                lineTotal,
            });
        }

        if (discount > subtotal) {
            throw new Error("The discount is more than the total.");
        }

        return tx.sale.create({
            data: {
                subtotal,
                discount,
                totalAmount: subtotal - discount,
                paymentMethod: data.paymentMethod,
                customerId: data.customerId || null,
                customerName: data.customerName?.trim() || null,
                userId: user.id,
                items: { create: items },
            },
            include: SALE_INCLUDE,
        });
    });

    revalidatePath("/");
    revalidatePath("/pos");
    revalidatePath("/sales");
    revalidatePath("/inventory");
    revalidatePath("/customers");

    return sale;
}

export async function getRecentSales(take = 10) {
    await requireUser();
    return prisma.sale.findMany({
        orderBy: { createdAt: "desc" },
        take,
        include: SALE_INCLUDE,
    });
}

export async function getAllSales() {
    await requireUser();
    return prisma.sale.findMany({
        orderBy: { createdAt: "desc" },
        include: SALE_INCLUDE,
    });
}

export async function getSale(id: string) {
    await requireUser();
    return prisma.sale.findUnique({ where: { id }, include: SALE_INCLUDE });
}

import type { Prisma } from "@prisma/client";

/**
 * A sale is a receipt: one or more lines, a cashier, and — when the shop knows
 * them — a customer. Every screen that lists sales needs that same shape, so it
 * is defined once here rather than drifting between the actions that fetch it.
 *
 * The product is joined only for its category, which is what colours the row;
 * the name, price and cost a line displays are the ones snapshotted onto the
 * line itself at the time of sale.
 */
export const SALE_INCLUDE = {
    items: { include: { product: { select: { category: true } } } },
    user: { select: { name: true } },
    customer: { select: { id: true, name: true, phone: true } },
} as const satisfies Prisma.SaleInclude;

export type SaleWithItems = Prisma.SaleGetPayload<{ include: typeof SALE_INCLUDE }>;

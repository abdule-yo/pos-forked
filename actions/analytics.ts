"use server";

import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin } from "@/lib/session";
import { SALE_INCLUDE } from "@/lib/sale-include";

/**
 * A compact "how is today going" figure for the top of the Sell screen, so
 * staff can see the day building up without leaving the till.
 */
export async function getTodaySummary() {
    await requireUser();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sales = await prisma.sale.aggregate({
        where: { createdAt: { gte: today } },
        _sum: { totalAmount: true },
        _count: true,
    });

    return {
        total: sales._sum.totalAmount || 0,
        count: sales._count || 0,
    };
}

/**
 * Totals for one calendar month, so the shop can close the month off: what came
 * in, what went out, and what is left.
 */
export async function getMonthSummary(year: number, month: number) {
    await requireAdmin();

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);
    const range = { gte: start, lt: end };

    const [sales, expenses, salesList] = await Promise.all([
        prisma.sale.aggregate({
            where: { createdAt: range },
            _sum: { totalAmount: true },
            _count: true,
        }),
        prisma.expense.aggregate({
            where: { createdAt: range },
            _sum: { amount: true },
        }),
        prisma.sale.findMany({
            where: { createdAt: range },
            orderBy: { createdAt: "desc" },
            include: SALE_INCLUDE,
        }),
    ]);

    const revenue = sales._sum.totalAmount || 0;
    const spent = expenses._sum.amount || 0;
    // Pieces, not receipts: a sale of three shirts and a bag is four items.
    const itemsSold = salesList.reduce(
        (sum, sale) => sum + sale.items.reduce((pieces, item) => pieces + item.quantity, 0),
        0
    );

    // Payment mix, because the shop reconciles Zaad and eDahab separately from
    // the cash drawer at month end.
    const byMethod: Record<string, number> = {};
    for (const sale of salesList) {
        byMethod[sale.paymentMethod] = (byMethod[sale.paymentMethod] || 0) + sale.totalAmount;
    }

    return {
        year,
        month,
        revenue,
        spent,
        leftOver: revenue - spent,
        salesCount: sales._count || 0,
        itemsSold,
        byMethod,
        sales: salesList,
    };
}

/**
 * The months that actually have activity, so the month picker only offers
 * months worth looking at.
 */
export async function getActiveMonths() {
    await requireAdmin();

    const [firstSale, firstExpense] = await Promise.all([
        prisma.sale.findFirst({ orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
        prisma.expense.findFirst({ orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
    ]);

    const earliest = [firstSale?.createdAt, firstExpense?.createdAt]
        .filter(Boolean)
        .sort((a, b) => a!.getTime() - b!.getTime())[0];

    const now = new Date();
    const start = earliest ? new Date(earliest.getFullYear(), earliest.getMonth(), 1) : now;

    const months: { year: number; month: number }[] = [];
    const cursor = new Date(now.getFullYear(), now.getMonth(), 1);
    while (cursor >= start && months.length < 36) {
        months.push({ year: cursor.getFullYear(), month: cursor.getMonth() });
        cursor.setMonth(cursor.getMonth() - 1);
    }
    return months;
}

export async function getDashboardAnalytics() {
    await requireAdmin();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Sales
    const salesToday = await prisma.sale.aggregate({
        where: { createdAt: { gte: today } },
        _sum: { totalAmount: true },
        _count: true,
    });

    const salesThisMonth = await prisma.sale.aggregate({
        where: { createdAt: { gte: firstDayOfMonth } },
        _sum: { totalAmount: true },
        _count: true,
    });

    // Expenses
    const expensesToday = await prisma.expense.aggregate({
        where: { createdAt: { gte: today } },
        _sum: { amount: true },
    });

    const expensesThisMonth = await prisma.expense.aggregate({
        where: { createdAt: { gte: firstDayOfMonth } },
        _sum: { amount: true },
    });

    return {
        today: {
            sales: salesToday._sum.totalAmount || 0,
            salesCount: salesToday._count || 0,
            expenses: expensesToday._sum.amount || 0,
            netProfit: (salesToday._sum.totalAmount || 0) - (expensesToday._sum.amount || 0),
        },
        thisMonth: {
            sales: salesThisMonth._sum.totalAmount || 0,
            salesCount: salesThisMonth._count || 0,
            expenses: expensesThisMonth._sum.amount || 0,
            netProfit: (salesThisMonth._sum.totalAmount || 0) - (expensesThisMonth._sum.amount || 0),
        }
    };
}

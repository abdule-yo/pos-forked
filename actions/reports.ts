"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export async function getReportData() {
    await requireAdmin();

    const sales = await prisma.sale.findMany({
        include: {
            items: { include: { product: { select: { category: true } } } },
            user: { select: { name: true } },
        },
    });

    const productSales: Record<string, { name: string, category: string | null, qty: number, total: number }> = {};
    const categorySales: Record<string, { name: string, qty: number, total: number }> = {};
    const cashierSales: Record<string, { name: string, total: number }> = {};
    const dailyRevenue: Record<string, number> = {};

    sales.forEach(s => {
        // What sold is a question about lines, not receipts: one sale can carry
        // several products, and each contributes only its own line.
        for (const item of s.items) {
            // Keyed by product so a rename never splits one item into two rows,
            // labelled with the name as it was recorded on the sale.
            if (!productSales[item.productId]) {
                productSales[item.productId] = { name: item.productName, category: item.product.category, qty: 0, total: 0 };
            }
            productSales[item.productId].qty += item.quantity;
            productSales[item.productId].total += item.lineTotal;

            // Top Categories
            const catName = item.product.category || "Uncategorized";
            if (!categorySales[catName]) {
                categorySales[catName] = { name: catName, qty: 0, total: 0 };
            }
            categorySales[catName].qty += item.quantity;
            categorySales[catName].total += item.lineTotal;
        }

        // Takings stay per-sale: a discount belongs to the receipt, not to any
        // one line, so these are the figures that reconcile with the drawer.
        const cashierName = s.user?.name || "System";
        if (!cashierSales[cashierName]) {
            cashierSales[cashierName] = { name: cashierName, total: 0 };
        }
        cashierSales[cashierName].total += s.totalAmount;

        // Daily Revenue (last 7-30 days ideally, here just aggregating by date string)
        const dateStr = s.createdAt.toISOString().split('T')[0];
        if (!dailyRevenue[dateStr]) {
            dailyRevenue[dateStr] = 0;
        }
        dailyRevenue[dateStr] += s.totalAmount;
    });

    const topProducts = Object.values(productSales).sort((a, b) => b.qty - a.qty).slice(0, 5);
    const topCategories = Object.values(categorySales).sort((a, b) => b.qty - a.qty).slice(0, 5);
    const cashierData = Object.values(cashierSales).sort((a, b) => b.total - a.total);
    const revenueData = Object.entries(dailyRevenue).map(([date, amount]) => ({ date, amount })).sort((a, b) => a.date.localeCompare(b.date));

    return { topProducts, topCategories, cashierData, revenueData };
}

import { getDashboardAnalytics, getMonthSummary } from "@/actions/analytics";
import { getRecentSales } from "@/actions/sales";
import { getProducts } from "@/actions/products";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Banknote, Receipt, Scale, ShoppingBag, TriangleAlert, PackageX } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { PageHeader } from "@/components/page-header";
import { MonthView } from "./month-view";
import { Button } from "@/components/ui/button";
import { StockChip } from "@/components/ui/chip";
import { categoryColor } from "@/lib/categories";
import { formatMoney, formatNumber } from "@/lib/format";

export default async function DashboardPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    // Cashiers have no use for the shop's earnings, and this is their landing
    // page after signing in — send them straight to the till.
    if (user.role !== "admin") redirect("/pos");

    const now = new Date();
    const [analytics, products, thisMonth] = await Promise.all([
        getDashboardAnalytics(),
        getProducts(),
        getMonthSummary(now.getFullYear(), now.getMonth()),
    ]);

    const lowStock = products
        .filter((p) => p.stock <= 3)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 6);

    return (
        <div className="stack-in space-y-8">
            <PageHeader
                title={`Good day, ${user.name.split(" ")[0]}`}
                description="How the shop is doing today."
                action={
                    <Button size="lg" render={<Link href="/pos" />}>
                        <ShoppingBag />
                        Start selling
                    </Button>
                }
            />

            <section className="space-y-3">
                <h2 className="font-heading text-lg font-semibold tracking-tight">Today</h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Sold today"
                        value={formatMoney(analytics.today.sales)}
                        hint={`${formatNumber(analytics.today.salesCount)} ${
                            analytics.today.salesCount === 1 ? "sale" : "sales"
                        }`}
                        icon={Banknote}
                    />
                    <StatCard
                        label="Spent today"
                        value={formatMoney(analytics.today.expenses)}
                        hint="Rent, supplies, transport"
                        icon={Receipt}
                        tone={analytics.today.expenses > 0 ? "warning" : "default"}
                    />
                    <StatCard
                        label="Left over today"
                        value={formatMoney(analytics.today.netProfit)}
                        hint="Sold minus spent"
                        icon={Scale}
                        tone={analytics.today.netProfit >= 0 ? "success" : "danger"}
                    />
                    <StatCard
                        label="Running low"
                        value={formatNumber(lowStock.length)}
                        hint={
                            lowStock.length === 0
                                ? "Everything well stocked"
                                : lowStock.map((p) => p.name).slice(0, 2).join(", ")
                        }
                        icon={PackageX}
                        tone={lowStock.length > 0 ? "warning" : "default"}
                    />
                </div>
            </section>

            {/* The month close-out: what came in, what went out, and every sale
                behind the figure. */}
            <MonthView initial={thisMonth} />

            <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                <span>
                    &ldquo;Left over&rdquo; is money in minus money out. It does not yet subtract
                    what you paid for the goods, so true profit is lower. Add a cost price to each
                    product and this becomes real profit.
                </span>
            </p>

            {lowStock.length > 0 && (
                <section className="space-y-3">
                    <h2 className="font-heading text-lg font-semibold tracking-tight">
                        Running low
                    </h2>
                    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {lowStock.map((product) => (
                            <li
                                key={product.id}
                                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-card"
                                style={{
                                    boxShadow: `inset 3px 0 0 0 ${categoryColor(product.category)}`,
                                }}
                            >
                                <span className="min-w-0 flex-1 truncate pl-1 text-sm font-medium">
                                    {product.name}
                                </span>
                                <StockChip stock={product.stock} />
                            </li>
                        ))}
                    </ul>
                    <Button variant="outline" render={<Link href="/inventory" />}>
                        Manage products
                    </Button>
                </section>
            )}
        </div>
    );
}

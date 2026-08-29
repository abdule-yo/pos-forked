"use client";

import { useState, useTransition } from "react";
import { getMonthSummary } from "@/actions/analytics";
import { StatCard } from "@/components/stat-card";
import { RecentSalesTable } from "./recent-sales-table";
import { Button } from "@/components/ui/button";
import { Banknote, Receipt, Scale, Package } from "lucide-react";
import { formatMoney, formatNumber } from "@/lib/format";
import { paymentColor, paymentTint, PAYMENT_METHODS } from "@/lib/categories";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

export type MonthSummary = Awaited<ReturnType<typeof getMonthSummary>>;

/**
 * The month close-out. At the end of a month the owner needs one screen that
 * says: this came in, this went out, this is what's left — and every sale that
 * made it up, so the figure can be checked rather than trusted.
 */
export function MonthView({ initial }: { initial: MonthSummary }) {
    const [summary, setSummary] = useState(initial);
    const [pending, startTransition] = useTransition();

    const now = new Date();
    const isCurrentMonth =
        summary.year === now.getFullYear() && summary.month === now.getMonth();

    const step = (delta: number) => {
        const date = new Date(summary.year, summary.month + delta, 1);
        // Never walk past the current month — there is nothing there yet.
        if (date > new Date(now.getFullYear(), now.getMonth(), 1)) return;
        startTransition(async () => {
            setSummary(await getMonthSummary(date.getFullYear(), date.getMonth()));
        });
    };

    const methodTotal = Object.values(summary.byMethod).reduce((a, b) => a + b, 0);

    return (
        <section className="space-y-4">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => step(-1)}
                        disabled={pending}
                        aria-label="Previous month"
                    >
                        <ChevronLeft className="size-4" />
                    </Button>
                    <h2 className="min-w-[11rem] text-center font-heading text-lg font-semibold tracking-tight">
                        {MONTH_NAMES[summary.month]} {summary.year}
                    </h2>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => step(1)}
                        disabled={pending || isCurrentMonth}
                        aria-label="Next month"
                    >
                        <ChevronRight className="size-4" />
                    </Button>
                </div>
                {isCurrentMonth && (
                    <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                        This month, so far
                    </span>
                )}
            </header>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Money in"
                    value={formatMoney(summary.revenue)}
                    hint={`${formatNumber(summary.salesCount)} ${
                        summary.salesCount === 1 ? "sale" : "sales"
                    }`}
                    icon={Banknote}
                />
                <StatCard
                    label="Money out"
                    value={formatMoney(summary.spent)}
                    hint="Rent, supplies, transport"
                    icon={Receipt}
                    tone={summary.spent > 0 ? "warning" : "default"}
                />
                <StatCard
                    label="Left over"
                    value={formatMoney(summary.leftOver)}
                    hint="Money in minus money out"
                    icon={Scale}
                    tone={summary.leftOver >= 0 ? "success" : "danger"}
                />
                <StatCard
                    label="Items sold"
                    value={formatNumber(summary.itemsSold)}
                    hint="Pieces across every sale"
                    icon={Package}
                />
            </div>

            {methodTotal > 0 && (
                <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                    <h3 className="font-heading text-sm font-semibold">How customers paid</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Check each of these against what actually arrived.
                    </p>

                    {/* One bar, split by method — the parts sum to the month's
                        takings, so the shape itself is the reconciliation. */}
                    <div className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded-full">
                        {PAYMENT_METHODS.filter((m) => summary.byMethod[m] > 0).map((method) => (
                            <div
                                key={method}
                                className="h-full first:rounded-l-full last:rounded-r-full"
                                style={{
                                    width: `${(summary.byMethod[method] / methodTotal) * 100}%`,
                                    background: paymentColor(method),
                                }}
                            />
                        ))}
                    </div>

                    <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {PAYMENT_METHODS.map((method) => {
                            const amount = summary.byMethod[method] ?? 0;
                            return (
                                <li
                                    key={method}
                                    className="rounded-xl px-3 py-2.5"
                                    style={{ background: paymentTint(method, 10) }}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span
                                            aria-hidden
                                            className="size-2 rounded-full"
                                            style={{ background: paymentColor(method) }}
                                        />
                                        <span className="text-xs font-medium text-muted-foreground">
                                            {method}
                                        </span>
                                    </div>
                                    <p className="mt-1 font-heading text-lg font-semibold tabular">
                                        {formatMoney(amount)}
                                    </p>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            <div className="space-y-3">
                <h3 className="font-heading text-lg font-semibold tracking-tight">
                    Every sale in {MONTH_NAMES[summary.month]}
                </h3>
                <RecentSalesTable initialSales={summary.sales} />
            </div>
        </section>
    );
}

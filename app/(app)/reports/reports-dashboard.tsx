"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Banknote, ShoppingCart, Tag, Table2, ChartNoAxesColumn } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/stat-card";
import { BarList } from "@/components/bar-list";
import { RevenueChart } from "@/components/revenue-chart";
import { CategoryChip } from "@/components/ui/chip";
import { formatMoney, formatNumber, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type Product = { name: string; category: string | null; qty: number; total: number };
type Category = { name: string; qty: number; total: number };
type Cashier = { name: string; total: number };
type Revenue = { date: string; amount: number };

export type ReportData = {
    topProducts: Product[];
    topCategories: Category[];
    cashierData: Cashier[];
    revenueData: Revenue[];
};

export function ReportsDashboard({ data }: { data: ReportData }) {
    const totalRevenue = data.revenueData.reduce((sum, r) => sum + r.amount, 0);
    const itemsSold = data.topProducts.reduce((sum, p) => sum + p.qty, 0);
    const topCategory = data.topCategories[0]?.name ?? "None yet";

    const handleExportCSV = () => {
        import("papaparse").then((Papa) => {
            const csv = Papa.unparse(data.revenueData);
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `Revenue_${new Date().toISOString().split("T")[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });
    };

    const handleExportPDF = () => {
        Promise.all([import("jspdf"), import("jspdf-autotable")]).then(([jsPDF, autoTable]) => {
            const doc = new jsPDF.default();
            doc.text("Business report", 14, 15);
            autoTable.default(doc, {
                startY: 25,
                head: [["Date", "Revenue"]],
                body: data.revenueData.map((d) => [formatDate(d.date), formatMoney(d.amount)]),
                headStyles: { fillColor: [66, 48, 84] },
            });
            doc.addPage();
            doc.text("Top products", 14, 15);
            autoTable.default(doc, {
                startY: 25,
                head: [["Product", "Sold", "Revenue"]],
                body: data.topProducts.map((p) => [p.name, p.qty, formatMoney(p.total)]),
                headStyles: { fillColor: [66, 48, 84] },
            });
            doc.save(`Report_${new Date().toISOString().split("T")[0]}.pdf`);
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={handleExportCSV}>
                    <Download />
                    Spreadsheet
                </Button>
                <Button variant="outline" onClick={handleExportPDF}>
                    <Download />
                    PDF
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                    label="Total taken"
                    value={formatMoney(totalRevenue)}
                    hint="Across every sale recorded"
                    icon={Banknote}
                />
                <StatCard
                    label="Items sold"
                    value={formatNumber(itemsSold)}
                    icon={ShoppingCart}
                />
                <StatCard label="Best category" value={topCategory} icon={Tag} />
            </div>

            <Panel
                title="Money taken per day"
                description="Each point is one day's sales."
                table={
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Day</TableHead>
                                <TableHead className="text-right">Taken</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.revenueData.map((r) => (
                                <TableRow key={r.date}>
                                    <TableCell>{formatDate(r.date)}</TableCell>
                                    <TableCell className="text-right tabular">
                                        {formatMoney(r.amount)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                }
            >
                <RevenueChart data={data.revenueData} />
            </Panel>

            <div className="grid gap-6 lg:grid-cols-2">
                <Panel
                    title="Best sellers"
                    description="By how many were sold."
                    table={
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="text-right">Sold</TableHead>
                                    <TableHead className="text-right">Taken</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.topProducts.map((p) => (
                                    <TableRow key={p.name}>
                                        <TableCell className="font-medium">{p.name}</TableCell>
                                        <TableCell className="text-right tabular">{p.qty}</TableCell>
                                        <TableCell className="text-right tabular">
                                            {formatMoney(p.total)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    }
                >
                    {data.topProducts.length === 0 ? (
                        <Nothing />
                    ) : (
                        <BarList
                            items={data.topProducts.map((p) => ({
                                name: p.name,
                                value: p.qty,
                                label: `${p.qty} sold · ${formatMoney(p.total)}`,
                                category: p.category,
                            }))}
                        />
                    )}
                </Panel>

                <Panel
                    title="Best categories"
                    description="Where the money comes from."
                    table={
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Sold</TableHead>
                                    <TableHead className="text-right">Taken</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.topCategories.map((c) => (
                                    <TableRow key={c.name}>
                                        <TableCell>
                                            <CategoryChip category={c.name} />
                                        </TableCell>
                                        <TableCell className="text-right tabular">{c.qty}</TableCell>
                                        <TableCell className="text-right tabular">
                                            {formatMoney(c.total)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    }
                >
                    {data.topCategories.length === 0 ? (
                        <Nothing />
                    ) : (
                        <BarList
                            items={data.topCategories.map((c) => ({
                                name: c.name,
                                value: c.qty,
                                label: `${c.qty} sold · ${formatMoney(c.total)}`,
                                category: c.name,
                            }))}
                        />
                    )}
                </Panel>
            </div>

            {data.cashierData.length > 0 && (
                <Panel title="Who sold what" description="Sales by member of staff.">
                    <BarList
                        items={data.cashierData.map((c) => ({
                            name: c.name,
                            value: c.total,
                            label: formatMoney(c.total),
                            category: c.name,
                        }))}
                    />
                </Panel>
            )}
        </div>
    );
}

function Nothing() {
    return <p className="py-8 text-center text-sm text-muted-foreground">No sales recorded yet.</p>;
}

/**
 * A chart and the numbers behind it, in one box. The toggle is not decoration:
 * every chart in this app must be readable as a table, which is what makes the
 * colour coding safe for anyone who can't rely on hue.
 */
function Panel({
    title,
    description,
    children,
    table,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
    table?: React.ReactNode;
}) {
    const [view, setView] = useState<"chart" | "table">("chart");

    return (
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <header className="flex items-start justify-between gap-3 border-b border-border p-5">
                <div className="space-y-0.5">
                    <h2 className="font-heading text-base font-semibold tracking-tight">{title}</h2>
                    {description && (
                        <p className="text-sm text-muted-foreground">{description}</p>
                    )}
                </div>
                {table && (
                    <div className="flex shrink-0 rounded-lg border border-border p-0.5">
                        {(["chart", "table"] as const).map((mode) => (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => setView(mode)}
                                aria-pressed={view === mode}
                                aria-label={mode === "chart" ? "Show chart" : "Show numbers"}
                                className={cn(
                                    "flex size-8 items-center justify-center rounded-md transition-colors",
                                    view === mode
                                        ? "bg-accent text-accent-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {mode === "chart" ? (
                                    <ChartNoAxesColumn className="size-4" />
                                ) : (
                                    <Table2 className="size-4" />
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </header>
            <div className={cn(view === "table" ? "p-0" : "p-5")}>
                {view === "table" && table ? table : children}
            </div>
        </section>
    );
}

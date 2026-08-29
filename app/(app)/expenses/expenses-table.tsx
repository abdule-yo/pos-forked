"use client";

import { useRouter } from "next/navigation";
import type { Expense } from "@prisma/client";
import { ExpenseDialog } from "./expense-dialog";
import { DataTable, ColumnDef } from "@/components/data-table";
import { CategoryChip } from "@/components/ui/chip";
import { categoryColor } from "@/lib/categories";
import { formatMoney, formatRelativeDay, formatTime } from "@/lib/format";
import { Wallet } from "lucide-react";

export function ExpensesTable({ initialExpenses }: { initialExpenses: Expense[] }) {
    const router = useRouter();

    const columns: ColumnDef<Expense>[] = [
        {
            header: "What for",
            accessorKey: "description",
            cell: (e) => (
                <div className="min-w-0">
                    <p className="truncate font-medium">{e.description}</p>
                    <p className="text-xs text-muted-foreground md:hidden">
                        {formatRelativeDay(e.createdAt)}
                    </p>
                </div>
            ),
        },
        {
            header: "Category",
            accessorKey: "category",
            priority: "secondary",
            cell: (e) => <CategoryChip category={e.category} />,
            exportValue: (e) => e.category ?? "Uncategorised",
        },
        {
            header: "When",
            accessorKey: "createdAt",
            priority: "secondary",
            cell: (e) => (
                <div className="whitespace-nowrap">
                    <p className="text-sm">{formatRelativeDay(e.createdAt)}</p>
                    <p className="text-xs text-muted-foreground">{formatTime(e.createdAt)}</p>
                </div>
            ),
            exportValue: (e) => new Date(e.createdAt).toLocaleString(),
        },
        {
            header: "Amount",
            accessorKey: "amount",
            align: "right",
            cell: (e) => (
                <span className="font-heading font-semibold tabular text-destructive">
                    −{formatMoney(e.amount)}
                </span>
            ),
            exportValue: (e) => e.amount.toFixed(2),
        },
    ];

    const categories = Array.from(
        new Set(initialExpenses.map((e) => e.category).filter(Boolean))
    ) as string[];

    return (
        <DataTable
            data={initialExpenses}
            columns={columns}
            rowAccent={(e) => categoryColor(e.category)}
            searchKey="description"
            searchPlaceholder="Search expenses…"
            filterKey="category"
            filterOptions={categories}
            showExport
            exportFilenamePrefix="Expenses"
            emptyIcon={Wallet}
            emptyMessage="No expenses yet"
            emptyDescription="Record rent, electricity and transport so the shop's takings are honest."
            emptyAction={<ExpenseDialog onSuccess={() => router.refresh()} />}
            toolbarActions={<ExpenseDialog onSuccess={() => router.refresh()} />}
        />
    );
}

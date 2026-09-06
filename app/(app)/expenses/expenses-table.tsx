"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Expense } from "@prisma/client";
import { ExpenseDialog } from "./expense-dialog";
import { DataTable, ColumnDef } from "@/components/data-table";
import { CategoryChip } from "@/components/ui/chip";
import { categoryColor } from "@/lib/categories";
import { formatMoney, formatRelativeDay, formatTime } from "@/lib/format";
import { Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteExpense } from "@/actions/expenses";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export function ExpensesTable({ initialExpenses }: { initialExpenses: Expense[] }) {
    const router = useRouter();
    const [toDelete, setToDelete] = useState<Expense | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!toDelete) return;
        setIsDeleting(true);
        try {
            await deleteExpense(toDelete.id);
            toast.success(`Removed ${toDelete.description}`);
            setToDelete(null);
            router.refresh();
        } catch (error) {
            toast.error("Couldn't remove this expense", {
                description:
                    error instanceof Error ? error.message : "Please try again.",
            });
        } finally {
            setIsDeleting(false);
        }
    };

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
        {
            header: "",
            align: "right",
            cell: (e) => (
                <div className="flex items-center justify-end">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setToDelete(e)}
                        aria-label={`Remove ${e.description}`}
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </div>
            ),
        },
    ];

    const categories = Array.from(
        new Set(initialExpenses.map((e) => e.category).filter(Boolean))
    ) as string[];

    return (
        <>
            <Dialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove this expense?</DialogTitle>
                        <DialogDescription>
                            {toDelete?.description} will be taken off the books, and the
                            shop&apos;s profit will go up by {formatMoney(toDelete?.amount ?? 0)}.
                            This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setToDelete(null)}
                            disabled={isDeleting}
                        >
                            Keep it
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? "Removing…" : "Remove"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
        </>
    );
}

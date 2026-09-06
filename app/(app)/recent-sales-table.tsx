"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, ColumnDef } from "@/components/data-table";
import { PaymentChip } from "@/components/ui/chip";
import { categoryColor } from "@/lib/categories";
import { formatMoney, formatRelativeDay, formatTime } from "@/lib/format";
import { ReceiptText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteSale } from "@/actions/sales";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { SaleWithItems } from "@/lib/sale-include";

type SaleRow = SaleWithItems;

// A sale is a receipt, and a row has space for one line of it. Lead with the
// first item — the one the customer came in for — and count the rest.
function describeItems(sale: SaleRow) {
    const [first, ...rest] = sale.items;
    if (!first) return "Empty sale";
    return rest.length > 0 ? `${first.productName} +${rest.length} more` : first.productName;
}

function totalQuantity(sale: SaleRow) {
    return sale.items.reduce((pieces, item) => pieces + item.quantity, 0);
}

/**
 * `compact` drops the supporting columns. The dashboard shows this table in a
 * narrow column beside the low-stock list, where the full set of columns pushes
 * the total off the edge.
 *
 * `showDelete` is off by default: undoing a sale belongs on the Sales page, not
 * on the dashboard glance where a stray tap would be expensive.
 */
export function RecentSalesTable({
    initialSales,
    compact = false,
    showDelete = false,
}: {
    initialSales: SaleRow[];
    compact?: boolean;
    showDelete?: boolean;
}) {
    const router = useRouter();
    const [toDelete, setToDelete] = useState<SaleRow | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!toDelete) return;
        setIsDeleting(true);
        try {
            await deleteSale(toDelete.id);
            toast.success(`Sale #${toDelete.invoiceNo} removed`);
            setToDelete(null);
            router.refresh();
        } catch (error) {
            toast.error("Couldn't remove this sale", {
                description:
                    error instanceof Error ? error.message : "Please try again.",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const allColumns: ColumnDef<SaleRow>[] = [
        {
            header: "Item",
            accessorKey: "items",
            cell: (s) => (
                <div className="min-w-0">
                    <p className="truncate font-medium">{describeItems(s)}</p>
                    <p className={cn("text-xs text-muted-foreground", !compact && "md:hidden")}>
                        {formatRelativeDay(s.createdAt)} · {totalQuantity(s)} ×
                    </p>
                </div>
            ),
            exportValue: (s) => s.items.map((item) => item.productName).join(", "),
        },
        {
            header: "Qty",
            accessorKey: "items",
            align: "center",
            priority: "secondary",
            cell: (s) => <span className="tabular text-muted-foreground">{totalQuantity(s)}</span>,
            exportValue: (s) => String(totalQuantity(s)),
        },
        {
            header: "Customer",
            accessorKey: "customerName",
            priority: "secondary",
            cell: (s) =>
                s.customerName ? (
                    <span>{s.customerName}</span>
                ) : (
                    <span className="text-muted-foreground">Walk-in</span>
                ),
            exportValue: (s) => s.customerName ?? "Walk-in",
        },
        {
            header: "Paid with",
            accessorKey: "paymentMethod",
            cell: (s) => <PaymentChip method={s.paymentMethod} />,
            exportValue: (s) => s.paymentMethod,
        },
        {
            header: "When",
            accessorKey: "createdAt",
            priority: "secondary",
            cell: (s) => (
                <div className="whitespace-nowrap">
                    <p className="text-sm">{formatRelativeDay(s.createdAt)}</p>
                    <p className="text-xs text-muted-foreground">{formatTime(s.createdAt)}</p>
                </div>
            ),
            exportValue: (s) => new Date(s.createdAt).toLocaleString(),
        },
        {
            header: "Sold by",
            accessorKey: "user",
            priority: "secondary",
            cell: (s) => (
                <span className="text-muted-foreground">{s.user?.name ?? "System"}</span>
            ),
            exportValue: (s) => s.user?.name ?? "System",
        },
        {
            header: "Total",
            accessorKey: "totalAmount",
            align: "right",
            cell: (s) => (
                <span className="font-heading font-semibold tabular">
                    {formatMoney(s.totalAmount)}
                </span>
            ),
            exportValue: (s) => formatMoney(s.totalAmount),
        },
        {
            header: "",
            align: "right",
            cell: (s) => (
                <div className="flex items-center justify-end">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setToDelete(s)}
                        aria-label={`Remove sale #${s.invoiceNo}`}
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </div>
            ),
        },
    ];

    // Item, payment and total are what someone scanning the list needs.
    const KEEP_WHEN_COMPACT = new Set(["Item", "Paid with", "Total"]);
    const columns = compact
        ? allColumns.filter((c) => KEEP_WHEN_COMPACT.has(c.header))
        : allColumns.filter((c) => showDelete || c.header !== "");

    return (
        <>
            <Dialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove sale #{toDelete?.invoiceNo}?</DialogTitle>
                        <DialogDescription>
                            {formatMoney(toDelete?.totalAmount ?? 0)} comes off the day&apos;s
                            takings, and the {toDelete ? totalQuantity(toDelete) : 0} item
                            {toDelete && totalQuantity(toDelete) === 1 ? "" : "s"} it sold go back
                            into stock. This cannot be undone.
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
                data={initialSales}
                columns={columns}
                rowAccent={(s) => categoryColor(s.items[0]?.product.category)}
                searchKey={(s) =>
                    `${s.items.map((item) => item.productName).join(" ")} ${s.customerName ?? ""}`
                }
                searchPlaceholder="Search by item or customer…"
                filterKey={(s) => s.paymentMethod}
                filterOptions={["Cash", "Zaad", "eDahab", "Bank"]}
                showExport
                exportFilenamePrefix="Sales"
                emptyIcon={ReceiptText}
                emptyMessage="No sales yet"
                emptyDescription="Sales appear here the moment you record one on the Sell screen."
            />
        </>
    );
}

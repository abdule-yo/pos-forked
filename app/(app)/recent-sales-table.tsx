"use client";

import { DataTable, ColumnDef } from "@/components/data-table";
import { PaymentChip } from "@/components/ui/chip";
import { categoryColor } from "@/lib/categories";
import { formatMoney, formatRelativeDay, formatTime } from "@/lib/format";
import { ReceiptText } from "lucide-react";
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
 */
export function RecentSalesTable({
    initialSales,
    compact = false,
}: {
    initialSales: SaleRow[];
    compact?: boolean;
}) {
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
    ];

    // Item, payment and total are what someone scanning the list needs.
    const KEEP_WHEN_COMPACT = new Set(["Item", "Paid with", "Total"]);
    const columns = compact
        ? allColumns.filter((c) => KEEP_WHEN_COMPACT.has(c.header))
        : allColumns;

    return (
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
    );
}

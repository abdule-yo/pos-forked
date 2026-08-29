"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, ColumnDef } from "@/components/data-table";
import { CustomerDialog, type CustomerFields } from "./customer-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Pen, Trash2, Users, Phone } from "lucide-react";
import { deleteCustomer } from "@/actions/customers";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { formatMoney, formatRelativeDay } from "@/lib/format";

type Row = CustomerFields & {
    purchases: number;
    totalSpent: number;
    lastVisit: Date | string | null;
};

export function CustomersTable({ initialCustomers }: { initialCustomers: Row[] }) {
    const router = useRouter();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selected, setSelected] = useState<CustomerFields | null>(null);
    const [toDelete, setToDelete] = useState<Row | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const refresh = () => router.refresh();

    const openAdd = () => {
        setSelected(null);
        setDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!toDelete) return;
        setIsDeleting(true);
        try {
            await deleteCustomer(toDelete.id);
            toast.success(`Removed ${toDelete.name}`);
            setToDelete(null);
            refresh();
        } catch {
            toast.error("Could not remove this customer. Try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    const columns: ColumnDef<Row>[] = [
        {
            header: "Name",
            accessorKey: "name",
            cell: (c) => (
                <div className="min-w-0">
                    <p className="truncate font-medium">{c.name}</p>
                    {c.phone && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground md:hidden">
                            <Phone className="size-3" />
                            {c.phone}
                        </p>
                    )}
                </div>
            ),
        },
        {
            header: "Phone",
            accessorKey: "phone",
            priority: "secondary",
            cell: (c) =>
                c.phone ? (
                    <a href={`tel:${c.phone}`} className="tabular hover:underline">
                        {c.phone}
                    </a>
                ) : (
                    <span className="text-muted-foreground">—</span>
                ),
            exportValue: (c) => c.phone ?? "",
        },
        {
            header: "Purchases",
            accessorKey: "purchases",
            align: "center",
            priority: "secondary",
            cell: (c) => <span className="tabular">{c.purchases}</span>,
        },
        {
            header: "Last visit",
            accessorKey: "lastVisit",
            priority: "secondary",
            cell: (c) =>
                c.lastVisit ? (
                    <span className="whitespace-nowrap">{formatRelativeDay(c.lastVisit)}</span>
                ) : (
                    <span className="text-muted-foreground">Never</span>
                ),
            exportValue: (c) => (c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : ""),
        },
        {
            header: "Total spent",
            accessorKey: "totalSpent",
            align: "right",
            cell: (c) => (
                <span className="font-heading font-semibold tabular">
                    {formatMoney(c.totalSpent)}
                </span>
            ),
            exportValue: (c) => c.totalSpent.toFixed(2),
        },
        {
            header: "",
            align: "right",
            cell: (c) => (
                <div className="flex items-center justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => {
                            setSelected(c);
                            setDialogOpen(true);
                        }}
                        aria-label={`Edit ${c.name}`}
                    >
                        <Pen className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setToDelete(c)}
                        aria-label={`Remove ${c.name}`}
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <CustomerDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                customer={selected}
                onSuccess={refresh}
            />

            <Dialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove {toDelete?.name}?</DialogTitle>
                        <DialogDescription>
                            Their past sales stay on record — they just won&rsquo;t be linked to a
                            customer any more.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setToDelete(null)} disabled={isDeleting}>
                            Keep them
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? "Removing…" : "Remove"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <DataTable
                data={initialCustomers}
                columns={columns}
                searchKey={(c) => `${c.name} ${c.phone ?? ""}`}
                searchPlaceholder="Search by name or phone…"
                showExport
                exportFilenamePrefix="Customers"
                emptyIcon={Users}
                emptyMessage="No customers yet"
                emptyDescription="Add a customer here, or type a name while ringing up a sale."
                emptyAction={
                    <Button onClick={openAdd}>
                        <Plus />
                        Add your first customer
                    </Button>
                }
                toolbarActions={
                    <Button onClick={openAdd}>
                        <Plus />
                        Add customer
                    </Button>
                }
            />
        </>
    );
}

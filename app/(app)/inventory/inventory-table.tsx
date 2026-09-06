"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@prisma/client";
import { ProductDialog } from "./product-dialog";
import { ImportDialog } from "./import-dialog";
import { DataTable, ColumnDef } from "@/components/data-table";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Pen, Trash2, Package } from "lucide-react";
import { deleteProduct } from "@/actions/products";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { CategoryChip, StockChip } from "@/components/ui/chip";
import { categoryColor } from "@/lib/categories";
import { formatMoney } from "@/lib/format";

/**
 * `canDelete` mirrors the server: removing a product is an owner's action, so a
 * cashier is not shown a button that would only bounce them to the Sell screen.
 */
export function InventoryTable({
    initialProducts,
    canDelete = false,
}: {
    initialProducts: Product[];
    canDelete?: boolean;
}) {
    const router = useRouter();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [toDelete, setToDelete] = useState<Product | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const openAdd = () => {
        setSelectedProduct(null);
        setDialogOpen(true);
    };

    const openEdit = (product: Product) => {
        setSelectedProduct(product);
        setDialogOpen(true);
    };

    // Refreshing the route re-renders with fresh server data and keeps scroll
    // position — a full page reload threw both away.
    const refresh = () => router.refresh();

    const handleDelete = async () => {
        if (!toDelete) return;
        setIsDeleting(true);
        try {
            await deleteProduct(toDelete.id);
            toast.success(`Removed ${toDelete.name}`);
            setToDelete(null);
            refresh();
        } catch (error) {
            toast.error("Couldn't remove this item", {
                description:
                    error instanceof Error ? error.message : "Please try again.",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const columns: ColumnDef<Product>[] = [
        {
            header: "Item",
            accessorKey: "name",
            cell: (p) => (
                <div className="min-w-0">
                    <p className="truncate font-medium">{p.name}</p>
                    <div className="mt-1 md:hidden">
                        <CategoryChip category={p.category} />
                    </div>
                </div>
            ),
        },
        {
            header: "Category",
            accessorKey: "category",
            priority: "secondary",
            cell: (p) => <CategoryChip category={p.category} />,
            exportValue: (p) => p.category ?? "Uncategorised",
        },
        {
            header: "Price",
            accessorKey: "price",
            align: "right",
            cell: (p) => (
                <span className="font-heading font-semibold tabular">{formatMoney(p.price)}</span>
            ),
            exportValue: (p) => p.price.toFixed(2),
        },
        {
            header: "In stock",
            accessorKey: "stock",
            align: "right",
            cell: (p) => <StockChip stock={p.stock} />,
            exportValue: (p) => String(p.stock),
        },
        {
            header: "",
            align: "right",
            cell: (p) => (
                <div className="flex items-center justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => openEdit(p)}
                        aria-label={`Edit ${p.name}`}
                    >
                        <Pen className="size-4" />
                    </Button>
                    {canDelete && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => setToDelete(p)}
                            aria-label={`Remove ${p.name}`}
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    const categories = Array.from(
        new Set(initialProducts.map((p) => p.category).filter(Boolean))
    ) as string[];

    return (
        <>
            <ProductDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                product={selectedProduct}
                onSuccess={refresh}
            />

            <Dialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove {toDelete?.name}?</DialogTitle>
                        <DialogDescription>
                            It disappears from the Sell screen and this list, and is taken
                            off any past sale it appears on. This cannot be undone.
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
                data={initialProducts}
                columns={columns}
                rowAccent={(p) => categoryColor(p.category)}
                searchKey="name"
                searchPlaceholder="Search products…"
                filterKey="category"
                filterOptions={categories}
                showExport
                exportFilenamePrefix="Products"
                emptyIcon={Package}
                emptyMessage="No products yet"
                emptyDescription="Add what the shop sells so it can be rung up at the counter."
                emptyAction={
                    <Button onClick={openAdd}>
                        <Plus />
                        Add your first product
                    </Button>
                }
                toolbarActions={
                    <>
                        <ImportDialog />
                        <Button onClick={openAdd}>
                            <Plus />
                            Add product
                        </Button>
                    </>
                }
            />
        </>
    );
}

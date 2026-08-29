"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { createProduct, updateProduct } from "@/actions/products";
import type { Product } from "@prisma/client";
import { toast } from "sonner";
import { CategoryPicker } from "@/components/category-picker";

/** The categories this shop deals in, offered as one tap rather than free text. */
const SUGGESTED = [
    "Bags",
    "Jewellery",
    "Watches",
    "Perfumes",
    "Cosmetics",
    "Hair",
    "Shoes",
    "Accessories",
];

export function ProductDialog({
    open,
    onOpenChange,
    product,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product?: Product | null;
    onSuccess?: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");
    const isEdit = !!product;

    useEffect(() => {
        if (!open) return;
        setName(product?.name ?? "");
        setCategory(product?.category ?? "");
        setPrice(product?.price != null ? String(product.price) : "");
        setStock(product?.stock != null ? String(product.stock) : "");
    }, [open, product]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const priceValue = parseFloat(price);
        const stockValue = parseInt(stock, 10);

        if (!Number.isFinite(priceValue) || priceValue < 0) {
            toast.error("Enter a price of zero or more.");
            return;
        }
        if (!Number.isInteger(stockValue) || stockValue < 0) {
            toast.error("Enter how many you have — a whole number, zero or more.");
            return;
        }

        setLoading(true);
        try {
            const data = {
                name: name.trim(),
                category: category.trim() || undefined,
                price: priceValue,
                stock: stockValue,
            };

            if (isEdit) {
                await updateProduct(product.id, data);
                toast.success(`Updated ${data.name}`);
            } else {
                await createProduct(data);
                toast.success(`Added ${data.name}`);
            }

            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            // Previously this only reached console.error, so a failed save looked
            // identical to a successful one.
            toast.error(
                error instanceof Error ? error.message : "Could not save. Try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle>{isEdit ? `Edit ${product.name}` : "Add a product"}</DialogTitle>
                        <DialogDescription>
                            {isEdit
                                ? "Change the price or how many are in stock."
                                : "Give it a name, a price, and how many you have."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Leather shoulder bag"
                                className="h-11"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <CategoryPicker
                                id="category"
                                value={category}
                                onChange={setCategory}
                                suggestions={SUGGESTED}
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="price">Price</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    inputMode="decimal"
                                    step="0.01"
                                    min="0"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="0.00"
                                    className="h-11"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="stock">How many in stock</Label>
                                <Input
                                    id="stock"
                                    type="number"
                                    inputMode="numeric"
                                    min="0"
                                    step="1"
                                    value={stock}
                                    onChange={(e) => setStock(e.target.value)}
                                    placeholder="0"
                                    className="h-11"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving…" : isEdit ? "Save changes" : "Add product"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

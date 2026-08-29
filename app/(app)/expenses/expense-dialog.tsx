"use client";

import { useState } from "react";
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
    DialogTrigger,
} from "@/components/ui/dialog";
import { createExpense } from "@/actions/expenses";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { CategoryPicker } from "@/components/category-picker";

const SUGGESTED = ["Rent", "Utilities", "Transport", "Supplies", "Food", "Maintenance"];

export function ExpenseDialog({ onSuccess }: { onSuccess?: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [amount, setAmount] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const amountValue = parseFloat(amount);
        if (!Number.isFinite(amountValue) || amountValue <= 0) {
            toast.error("Enter an amount greater than zero.");
            return;
        }

        setLoading(true);
        try {
            await createExpense({
                description: description.trim(),
                category: category.trim() || undefined,
                amount: amountValue,
            });
            toast.success(`Recorded ${formatMoney(amountValue)}`, {
                description: description.trim(),
            });
            setOpen(false);
            setDescription("");
            setCategory("");
            setAmount("");
            onSuccess?.();
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Could not save. Try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                render={
                    <Button>
                        <Plus />
                        Add expense
                    </Button>
                }
            />
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle>Add an expense</DialogTitle>
                        <DialogDescription>
                            Money the shop spent — rent, electricity, transport.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="description">What was it for?</Label>
                            <Input
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Shop rent for August"
                                className="h-11"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">How much?</Label>
                            <Input
                                id="amount"
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                min="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="h-11 text-lg"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="expense-category">Category</Label>
                            <CategoryPicker
                                id="expense-category"
                                value={category}
                                onChange={setCategory}
                                suggestions={SUGGESTED}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving…" : "Add expense"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

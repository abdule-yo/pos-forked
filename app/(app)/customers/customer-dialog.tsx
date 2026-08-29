"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { createCustomer, updateCustomer } from "@/actions/customers";
import { toast } from "sonner";

export type CustomerFields = {
    id: string;
    name: string;
    phone: string | null;
    note: string | null;
};

export function CustomerDialog({
    open,
    onOpenChange,
    customer,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer?: CustomerFields | null;
    onSuccess?: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [note, setNote] = useState("");
    const isEdit = !!customer;

    useEffect(() => {
        if (!open) return;
        setName(customer?.name ?? "");
        setPhone(customer?.phone ?? "");
        setNote(customer?.note ?? "");
    }, [open, customer]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Enter the customer's name.");
            return;
        }

        setLoading(true);
        try {
            if (isEdit) {
                await updateCustomer(customer.id, { name, phone, note });
                toast.success(`Updated ${name.trim()}`);
            } else {
                await createCustomer({ name, phone, note });
                toast.success(`Added ${name.trim()}`);
            }
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not save. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle>{isEdit ? `Edit ${customer.name}` : "Add a customer"}</DialogTitle>
                        <DialogDescription>
                            A name is enough. The phone number helps you reach them about a new
                            arrival.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="customer-name">Name</Label>
                            <Input
                                id="customer-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Amina Hassan"
                                className="h-11"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="customer-phone">
                                Phone <span className="font-normal text-muted-foreground">— optional</span>
                            </Label>
                            <Input
                                id="customer-phone"
                                type="tel"
                                inputMode="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="063 000 0000"
                                className="h-11"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="customer-note">
                                Note <span className="font-normal text-muted-foreground">— optional</span>
                            </Label>
                            <Textarea
                                id="customer-note"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Likes gold bracelets. Usually pays by Zaad."
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving…" : isEdit ? "Save changes" : "Add customer"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

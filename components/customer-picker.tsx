"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Search, UserPlus, X } from "lucide-react";
import { createCustomer } from "@/actions/customers";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type PickableCustomer = { id: string; name: string; phone: string | null };

/**
 * Attaching a customer must never slow the queue down. Typing filters the list;
 * if nobody matches, the same text becomes the new customer's name in one tap.
 * Skipping is always allowed — most sales are walk-ins.
 */
export function CustomerPicker({
    customers,
    value,
    onChange,
}: {
    customers: PickableCustomer[];
    value: PickableCustomer | null;
    onChange: (customer: PickableCustomer | null) => void;
}) {
    const [query, setQuery] = useState("");
    const [creating, setCreating] = useState(false);

    const matches = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return customers.slice(0, 4);
        return customers
            .filter((c) => `${c.name} ${c.phone ?? ""}`.toLowerCase().includes(q))
            .slice(0, 4);
    }, [customers, query]);

    const exactMatch = matches.some((c) => c.name.toLowerCase() === query.trim().toLowerCase());

    const handleCreate = async () => {
        const name = query.trim();
        if (!name) return;
        setCreating(true);
        try {
            const customer = await createCustomer({ name });
            onChange({ id: customer.id, name: customer.name, phone: customer.phone });
            setQuery("");
            toast.success(`${customer.name} added`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not add that customer.");
        } finally {
            setCreating(false);
        }
    };

    if (value) {
        return (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3">
                <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                        {value.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{value.name}</p>
                        {value.phone && (
                            <p className="truncate text-xs text-muted-foreground tabular">
                                {value.phone}
                            </p>
                        )}
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onChange(null)}
                    aria-label="Remove customer"
                    className="text-muted-foreground"
                >
                    <X className="size-4" />
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search or add a customer"
                    className="h-11 pl-9"
                />
            </div>

            {matches.length > 0 && (
                <ul className="space-y-1">
                    {matches.map((customer) => (
                        <li key={customer.id}>
                            <button
                                type="button"
                                onClick={() => {
                                    onChange(customer);
                                    setQuery("");
                                }}
                                className={cn(
                                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                                    "hover:bg-muted"
                                )}
                            >
                                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                                    {customer.name.charAt(0).toUpperCase()}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-sm">{customer.name}</span>
                                {customer.phone && (
                                    <span className="shrink-0 text-xs text-muted-foreground tabular">
                                        {customer.phone}
                                    </span>
                                )}
                                <Check className="size-4 shrink-0 text-transparent" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {query.trim() && !exactMatch && (
                <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleCreate}
                    disabled={creating}
                >
                    <UserPlus />
                    {creating ? "Adding…" : `Add “${query.trim()}” as a new customer`}
                </Button>
            )}
        </div>
    );
}

"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSale } from "@/actions/sales";
import { toast } from "sonner";
import { Search, Minus, Plus, X, PackageSearch, Check, ShoppingBag } from "lucide-react";
import { categoryColor, PAYMENT_METHODS, paymentColor, paymentTint } from "@/lib/categories";
import { formatMoney } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";
import { CustomerPicker, type PickableCustomer } from "@/components/customer-picker";
import { ProductCard } from "./product-card";
import { cn } from "@/lib/utils";

export function PosCheckout({
    products,
    customers,
}: {
    products: Product[];
    customers: PickableCustomer[];
}) {
    const router = useRouter();
    const [selectedId, setSelectedId] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [customer, setCustomer] = useState<PickableCustomer | null>(null);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("all");
    const searchRef = useRef<HTMLInputElement>(null);

    const categories = useMemo(
        () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort() as string[],
        [products]
    );

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return products.filter(
            (p) =>
                p.name.toLowerCase().includes(q) &&
                (category === "all" || p.category === category)
        );
    }, [products, query, category]);

    const selected = products.find((p) => p.id === selectedId) ?? null;
    const total = selected ? selected.price * quantity : 0;

    const select = (product: Product) => {
        if (product.stock <= 0) return;
        setSelectedId(product.id);
        setQuantity(1);
    };

    const clearSelection = () => {
        setSelectedId("");
        setQuantity(1);
    };

    const changeQuantity = (delta: number) => {
        if (!selected) return;
        setQuantity((q) => Math.min(Math.max(1, q + delta), selected.stock));
    };

    const finishSale = async () => {
        if (!selected) return;
        setLoading(true);
        try {
            await createSale({
                lines: [{ productId: selected.id, quantity }],
                paymentMethod,
                customerName: customer?.name,
                customerId: customer?.id,
            });
            toast.success(`Sold ${quantity} × ${selected.name}`, {
                description: `${formatMoney(total)} by ${paymentMethod}${
                    customer ? ` — ${customer.name}` : ""
                }`,
            });
            clearSelection();
            setCustomer(null);
            searchRef.current?.focus();
            router.refresh();
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Could not record the sale. Try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const checkout = (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-raised">
            {selected ? (
                <>
                    <div
                        className="flex items-start justify-between gap-3 border-b border-border p-4 pl-5"
                        style={{
                            boxShadow: `inset 3px 0 0 0 ${categoryColor(selected.category)}`,
                        }}
                    >
                        <div className="min-w-0">
                            <p className="font-heading text-base font-semibold leading-snug">
                                {selected.name}
                            </p>
                            <p className="mt-0.5 text-sm text-muted-foreground tabular">
                                {formatMoney(selected.price)} each · {selected.stock} in stock
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={clearSelection}
                            aria-label="Clear"
                            className="shrink-0 text-muted-foreground"
                        >
                            <X className="size-4" />
                        </Button>
                    </div>

                    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
                        <section className="space-y-2">
                            <Label className="text-sm font-medium">How many?</Label>
                            <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-1.5">
                                <Button
                                    variant="ghost"
                                    size="icon-lg"
                                    onClick={() => changeQuantity(-1)}
                                    disabled={quantity <= 1}
                                    aria-label="One fewer"
                                >
                                    <Minus />
                                </Button>
                                <span className="flex-1 text-center font-heading text-2xl font-semibold tabular">
                                    {quantity}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon-lg"
                                    onClick={() => changeQuantity(1)}
                                    disabled={quantity >= selected.stock}
                                    aria-label="One more"
                                >
                                    <Plus />
                                </Button>
                            </div>
                        </section>

                        <section className="space-y-2">
                            <Label className="text-sm font-medium">How did they pay?</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {PAYMENT_METHODS.map((method) => {
                                    const active = paymentMethod === method;
                                    return (
                                        <button
                                            key={method}
                                            type="button"
                                            onClick={() => setPaymentMethod(method)}
                                            aria-pressed={active}
                                            className={cn(
                                                "flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-all duration-150",
                                                active
                                                    ? "border-transparent"
                                                    : "border-border text-muted-foreground hover:border-foreground/25 hover:text-foreground"
                                            )}
                                            style={
                                                active
                                                    ? {
                                                          color: paymentColor(method),
                                                          background: paymentTint(method, 16),
                                                          boxShadow: `inset 0 0 0 1.5px ${paymentColor(method)}`,
                                                      }
                                                    : undefined
                                            }
                                        >
                                            {active && <Check className="size-4" strokeWidth={2.5} />}
                                            {method}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        <section className="space-y-2">
                            <Label className="text-sm font-medium">
                                Customer{" "}
                                <span className="font-normal text-muted-foreground">
                                    — skip for walk-ins
                                </span>
                            </Label>
                            <CustomerPicker
                                customers={customers}
                                value={customer}
                                onChange={setCustomer}
                            />
                        </section>
                    </div>

                    <div className="space-y-3 border-t border-border bg-muted/40 p-4">
                        <div className="flex items-baseline justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Total</span>
                            <span className="font-heading text-3xl font-semibold tracking-tight tabular">
                                {formatMoney(total)}
                            </span>
                        </div>
                        <Button size="xl" className="w-full" onClick={finishSale} disabled={loading}>
                            {loading ? "Saving…" : "Finish sale"}
                        </Button>
                    </div>
                </>
            ) : (
                <EmptyState
                    icon={ShoppingBag}
                    title="Nothing picked yet"
                    description="Tap an item and it lands here, ready to sell."
                    className="flex-1"
                />
            )}
        </div>
    );

    return (
        <div className="flex min-h-0 w-full flex-1 flex-col gap-5 lg:flex-row">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <div className="space-y-3 pb-4">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            ref={searchRef}
                            type="search"
                            placeholder="Search for an item…"
                            className="h-12 rounded-xl pl-11 text-base"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>

                    {categories.length > 0 && (
                        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                            <FilterPill
                                label="Everything"
                                active={category === "all"}
                                onClick={() => setCategory("all")}
                            />
                            {categories.map((cat) => (
                                <FilterPill
                                    key={cat}
                                    label={cat}
                                    color={categoryColor(cat)}
                                    active={category === cat}
                                    onClick={() => setCategory(cat)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto lg:pr-2">
                    {visible.length === 0 ? (
                        <EmptyState
                            icon={PackageSearch}
                            title="Nothing matches that"
                            description="Try a shorter word, or choose Everything."
                        />
                    ) : (
                        <div className="grid grid-cols-2 gap-3 pb-6 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                            {visible.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    selected={selectedId === product.id}
                                    onSelect={select}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="hidden w-[370px] shrink-0 flex-col lg:flex xl:w-[400px]">{checkout}</div>

            {/* Phone and tablet: the checkout rises from the bottom. */}
            {selected && (
                <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
                    <button
                        aria-label="Cancel"
                        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm duration-200 animate-in fade-in"
                        onClick={clearSelection}
                    />
                    <div className="relative z-10 flex max-h-[90vh] flex-col px-2 pb-2 duration-300 ease-[var(--ease-settle)] animate-in slide-in-from-bottom-full">
                        {checkout}
                    </div>
                </div>
            )}
        </div>
    );
}

function FilterPill({
    label,
    active,
    onClick,
    color,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
    color?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                "flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-all duration-150",
                active
                    ? color
                        ? "border-transparent text-background"
                        : "border-transparent bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
            )}
            style={active && color ? { background: color, color: "var(--card)" } : undefined}
        >
            {color && !active && (
                <span aria-hidden className="size-2 rounded-full" style={{ background: color }} />
            )}
            {label}
        </button>
    );
}

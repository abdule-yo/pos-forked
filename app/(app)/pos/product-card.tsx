"use client";

import { categoryColor, categoryTint, categoryLabel } from "@/lib/categories";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@prisma/client";

/**
 * Until products carry photographs, the card leads with a block of the
 * category's colour and the item's initials. It gives the grid something to
 * recognise at a glance — which is exactly the job a photo will do later, and
 * far better than a wall of identical white rectangles.
 */
export function ProductCard({
    product,
    selected,
    onSelect,
}: {
    product: Product;
    selected: boolean;
    onSelect: (product: Product) => void;
}) {
    const soldOut = product.stock <= 0;
    const low = !soldOut && product.stock <= 3;

    const initials = product.name
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
        .toUpperCase();

    return (
        <button
            type="button"
            onClick={() => onSelect(product)}
            disabled={soldOut}
            aria-pressed={selected}
            className={cn(
                "group relative flex flex-col overflow-hidden rounded-2xl border bg-card text-left",
                "transition-all duration-200 ease-[var(--ease-settle)]",
                soldOut
                    ? "cursor-not-allowed opacity-55"
                    : "hover:-translate-y-1 hover:shadow-raised active:translate-y-0 active:scale-[0.99]",
                selected
                    ? "border-primary shadow-raised ring-2 ring-primary/30"
                    : "border-border shadow-card"
            )}
        >
            <div
                className="relative flex h-20 items-center justify-center sm:h-24"
                style={{ background: categoryTint(product.category, 18) }}
            >
                <span
                    className="font-heading text-2xl font-semibold tracking-tight opacity-70"
                    style={{ color: categoryColor(product.category) }}
                >
                    {initials}
                </span>

                <span
                    className="absolute left-0 top-0 h-full w-[3px]"
                    style={{ background: categoryColor(product.category) }}
                />

                <span
                    className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{
                        color: categoryColor(product.category),
                        background: "color-mix(in oklch, var(--card) 82%, transparent)",
                    }}
                >
                    {categoryLabel(product.category)}
                </span>

                {soldOut && (
                    <span className="absolute inset-x-0 bottom-0 bg-foreground/85 py-1 text-center text-[11px] font-semibold text-background">
                        Sold out
                    </span>
                )}
            </div>

            <div className="flex flex-1 flex-col gap-2 p-3">
                <p className="line-clamp-2 text-sm font-medium leading-snug">{product.name}</p>
                <div className="mt-auto flex items-end justify-between gap-2">
                    <span className="font-heading text-lg font-semibold tabular">
                        {formatMoney(product.price)}
                    </span>
                    <span
                        className={cn(
                            "text-xs font-medium tabular",
                            low ? "text-warning" : "text-muted-foreground"
                        )}
                    >
                        {soldOut ? "0 left" : low ? `Only ${product.stock}` : `${product.stock} left`}
                    </span>
                </div>
            </div>
        </button>
    );
}

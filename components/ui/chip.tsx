import { cn } from "@/lib/utils";
import { categoryColor, categoryTint, categoryLabel, paymentColor, paymentTint } from "@/lib/categories";

/**
 * A small tinted label. Used for categories and payment methods, which are the
 * two things staff scan for rather than read.
 */
function Chip({
    className,
    color,
    tint,
    dot = true,
    children,
    ...props
}: React.ComponentProps<"span"> & { color: string; tint: string; dot?: boolean }) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
                className
            )}
            style={{ color, background: tint }}
            {...props}
        >
            {dot && (
                <span
                    aria-hidden
                    className="size-1.5 rounded-full"
                    style={{ background: "currentColor" }}
                />
            )}
            {children}
        </span>
    );
}

export function CategoryChip({
    category,
    className,
    dot = true,
}: {
    category?: string | null;
    className?: string;
    dot?: boolean;
}) {
    return (
        <Chip
            color={categoryColor(category)}
            tint={categoryTint(category, 14)}
            dot={dot}
            className={className}
        >
            {categoryLabel(category)}
        </Chip>
    );
}

export function PaymentChip({
    method,
    className,
}: {
    method?: string | null;
    className?: string;
}) {
    return (
        <Chip
            color={paymentColor(method)}
            tint={paymentTint(method, 14)}
            className={className}
        >
            {method || "Unknown"}
        </Chip>
    );
}

/** Stock level, said the way a person would say it. */
export function StockChip({
    stock,
    threshold = 3,
    className,
}: {
    stock: number;
    threshold?: number;
    className?: string;
}) {
    const state =
        stock <= 0 ? "out" : stock <= threshold ? "low" : "ok";

    const styles = {
        out: "bg-destructive/12 text-destructive",
        low: "bg-warning/16 text-[color-mix(in_oklch,var(--warning),var(--foreground)_30%)]",
        ok: "bg-muted text-muted-foreground",
    }[state];

    const label = {
        out: "Sold out",
        low: `Only ${stock} left`,
        ok: `${stock} in stock`,
    }[state];

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap tabular",
                styles,
                className
            )}
        >
            {label}
        </span>
    );
}

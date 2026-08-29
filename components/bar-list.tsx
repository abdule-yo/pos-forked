import { categoryMark } from "@/lib/categories";
import { cn } from "@/lib/utils";

export type BarItem = {
    name: string;
    /** Drives the bar length. */
    value: number;
    /** Shown at the end of the row, already formatted. */
    label: string;
    /** Colours the bar by the entity it belongs to — never by its rank. */
    category?: string | null;
};

/**
 * Ranked magnitude, read left to right. Horizontal because the labels are
 * product and category names, which do not fit under a vertical axis.
 *
 * Every bar is labelled with its own name and value, so the colour is
 * reinforcement rather than the only thing carrying identity. That is what
 * makes this readable for colour-blind staff, and it is why no legend is
 * needed.
 */
export function BarList({ items, className }: { items: BarItem[]; className?: string }) {
    const max = Math.max(...items.map((i) => i.value), 1);

    return (
        <ol className={cn("space-y-3.5", className)}>
            {items.map((item) => (
                <li key={item.name} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                        <span className="min-w-0 truncate text-sm font-medium">{item.name}</span>
                        <span className="shrink-0 text-sm text-muted-foreground tabular">
                            {item.label}
                        </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full rounded-full transition-[width] duration-500 ease-[var(--ease-settle)]"
                            style={{
                                width: `${Math.max((item.value / max) * 100, 2)}%`,
                                background: categoryMark(item.category ?? item.name),
                            }}
                        />
                    </div>
                </li>
            ))}
        </ol>
    );
}

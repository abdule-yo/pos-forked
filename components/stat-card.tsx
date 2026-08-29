import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Tone = "default" | "success" | "danger" | "warning";

const TONE_TEXT: Record<Tone, string> = {
    default: "text-foreground",
    success: "text-success",
    danger: "text-destructive",
    warning: "text-warning",
};

const TONE_ICON: Record<Tone, string> = {
    default: "bg-muted text-muted-foreground",
    success: "bg-success/12 text-success",
    danger: "bg-destructive/12 text-destructive",
    warning: "bg-warning/16 text-warning",
};

/**
 * One number, said plainly, with the label underneath rather than above — the
 * figure is what the eye should land on first.
 */
export function StatCard({
    label,
    value,
    hint,
    icon: Icon,
    tone = "default",
    className,
}: {
    label: string;
    value: string;
    hint?: string;
    icon: LucideIcon;
    tone?: Tone;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-card",
                className
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <span
                    className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-xl",
                        TONE_ICON[tone]
                    )}
                >
                    <Icon className="size-4.5" strokeWidth={1.75} />
                </span>
            </div>
            <div className="space-y-1">
                <p
                    className={cn(
                        "font-heading text-3xl font-semibold tracking-tight tabular",
                        TONE_TEXT[tone]
                    )}
                >
                    {value}
                </p>
                {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            </div>
        </div>
    );
}

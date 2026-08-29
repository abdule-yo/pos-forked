import { cn } from "@/lib/utils";

/**
 * Every page opens the same way: what this page is, one line saying what you
 * can do here, and the action you most likely came for. Consistency is what
 * lets someone who has never been trained find their footing.
 */
export function PageHeader({
    title,
    description,
    action,
    className,
}: {
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}) {
    return (
        <header
            className={cn(
                "flex flex-col gap-4 pb-6 sm:flex-row sm:items-center sm:justify-between",
                className
            )}
        >
            <div className="space-y-1">
                <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
                    {title}
                </h1>
                {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                )}
            </div>
            {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </header>
    );
}

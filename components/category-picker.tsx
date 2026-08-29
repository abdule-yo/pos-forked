"use client";

import { Input } from "@/components/ui/input";
import { categoryColor, categoryTint } from "@/lib/categories";
import { cn } from "@/lib/utils";

/**
 * Picking a category is really picking a colour, since that colour is how the
 * item will be recognised on every other screen. Offering the shop's usual
 * categories as one tap keeps them consistent; typing is still allowed.
 */
export function CategoryPicker({
    id,
    value,
    onChange,
    suggestions,
}: {
    id: string;
    value: string;
    onChange: (value: string) => void;
    suggestions: string[];
}) {
    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
                {suggestions.map((option) => {
                    const active = value.toLowerCase() === option.toLowerCase();
                    return (
                        <button
                            key={option}
                            type="button"
                            onClick={() => onChange(active ? "" : option)}
                            aria-pressed={active}
                            className={cn(
                                "flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-all duration-150",
                                active
                                    ? "border-transparent"
                                    : "border-border text-muted-foreground hover:text-foreground"
                            )}
                            style={
                                active
                                    ? {
                                          color: categoryColor(option),
                                          background: categoryTint(option, 16),
                                          boxShadow: `inset 0 0 0 1.5px ${categoryColor(option)}`,
                                      }
                                    : undefined
                            }
                        >
                            <span
                                aria-hidden
                                className="size-2 rounded-full"
                                style={{ background: categoryColor(option) }}
                            />
                            {option}
                        </button>
                    );
                })}
            </div>
            <Input
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Or type your own"
                className="h-11"
            />
        </div>
    );
}

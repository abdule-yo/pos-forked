"use client";

import { useState } from "react";
import { formatMoney, formatDate } from "@/lib/format";

type Point = { date: string; amount: number };

/**
 * Revenue over time — a line, because the question is "which way is it going",
 * not "how do these compare". One series, so no legend: the heading names it.
 *
 * Drawn as inline SVG rather than pulled from a chart library; at this size the
 * library is more code than the chart.
 */
export function RevenueChart({ data }: { data: Point[] }) {
    const [hover, setHover] = useState<number | null>(null);

    if (data.length === 0) {
        return (
            <p className="py-10 text-center text-sm text-muted-foreground">
                No sales recorded yet.
            </p>
        );
    }

    if (data.length === 1) {
        return (
            <div className="py-8 text-center">
                <p className="font-heading text-3xl font-semibold tabular">
                    {formatMoney(data[0].amount)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                    {formatDate(data[0].date)} — the only day with sales so far
                </p>
            </div>
        );
    }

    const W = 720;
    const H = 200;
    const PAD = { top: 16, right: 8, bottom: 28, left: 8 };
    const max = Math.max(...data.map((d) => d.amount));
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;

    const x = (i: number) => PAD.left + (i / Math.max(data.length - 1, 1)) * innerW;
    const y = (v: number) => PAD.top + innerH - (v / (max || 1)) * innerH;

    const line = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.amount)}`).join(" ");
    const area = `${line} L ${x(data.length - 1)} ${PAD.top + innerH} L ${x(0)} ${PAD.top + innerH} Z`;

    const active = hover != null ? data[hover] : null;

    return (
        <div className="relative">
            <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full"
                role="img"
                aria-label={`Revenue per day, from ${formatDate(data[0].date)} to ${formatDate(
                    data[data.length - 1].date
                )}`}
                onMouseLeave={() => setHover(null)}
            >
                <defs>
                    <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* A single reference line at the peak. More gridlines would add
                    ink without adding an answer. */}
                <line
                    x1={PAD.left}
                    x2={W - PAD.right}
                    y1={PAD.top}
                    y2={PAD.top}
                    stroke="var(--border)"
                    strokeDasharray="3 4"
                />
                <text x={PAD.left} y={PAD.top - 5} className="fill-muted-foreground text-[11px]">
                    {formatMoney(max)}
                </text>

                <path d={area} fill="url(#revenue-fill)" />
                <path
                    d={line}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {active && (
                    <line
                        x1={x(hover!)}
                        x2={x(hover!)}
                        y1={PAD.top}
                        y2={PAD.top + innerH}
                        stroke="var(--primary)"
                        strokeOpacity={0.35}
                    />
                )}

                {data.map((d, i) => (
                    <circle
                        key={d.date}
                        cx={x(i)}
                        cy={y(d.amount)}
                        r={hover === i ? 5 : 0}
                        fill="var(--primary)"
                        stroke="var(--card)"
                        strokeWidth={2}
                    />
                ))}

                {/* Hit targets are far wider than the marks, so hovering works
                    without precision aiming. */}
                {data.map((d, i) => (
                    <rect
                        key={`hit-${d.date}`}
                        x={x(i) - innerW / data.length / 2}
                        y={PAD.top}
                        width={innerW / data.length}
                        height={innerH}
                        fill="transparent"
                        onMouseEnter={() => setHover(i)}
                    />
                ))}

                <text x={PAD.left} y={H - 8} className="fill-muted-foreground text-[11px]">
                    {formatDate(data[0].date)}
                </text>
                <text
                    x={W - PAD.right}
                    y={H - 8}
                    textAnchor="end"
                    className="fill-muted-foreground text-[11px]"
                >
                    {formatDate(data[data.length - 1].date)}
                </text>
            </svg>

            {active && (
                <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-lg border border-border bg-popover px-3 py-2 text-center shadow-float">
                    <p className="font-heading text-sm font-semibold tabular">
                        {formatMoney(active.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(active.date)}</p>
                </div>
            )}
        </div>
    );
}

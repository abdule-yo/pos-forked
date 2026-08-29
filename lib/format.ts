/**
 * One place that decides how money, dates and quantities look.
 *
 * Before this, roughly forty `$${n.toFixed(2)}` expressions were scattered
 * across the components. Changing currency meant finding all forty.
 */

export const CURRENCY = "USD";
export const CURRENCY_SYMBOL = "$";

const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: CURRENCY,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const compactMoney = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: CURRENCY,
    notation: "compact",
    maximumFractionDigits: 1,
});

export function formatMoney(amount: number | null | undefined): string {
    return money.format(Number(amount ?? 0));
}

/** For dashboard tiles where $12,480.00 would crowd the card. */
export function formatMoneyCompact(amount: number | null | undefined): string {
    const value = Number(amount ?? 0);
    return Math.abs(value) >= 10_000 ? compactMoney.format(value) : money.format(value);
}

export function formatNumber(value: number | null | undefined): string {
    return new Intl.NumberFormat("en-US").format(Number(value ?? 0));
}

export function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export function formatTime(date: Date | string): string {
    return new Date(date).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
    });
}

export function formatDateTime(date: Date | string): string {
    return `${formatDate(date)} at ${formatTime(date)}`;
}

/**
 * "Today", "Yesterday", then the date. Staff scanning a sales list care about
 * recency far more than they care about a precise timestamp.
 */
export function formatRelativeDay(date: Date | string): string {
    const value = new Date(date);
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const days = Math.round((startOfDay(new Date()) - startOfDay(value)) / 86_400_000);

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return formatDate(value);
}

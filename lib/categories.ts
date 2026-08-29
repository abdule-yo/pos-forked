/**
 * Category colour system.
 *
 * Every product belongs to a category, and every category owns a colour. That
 * colour follows the product everywhere it appears: the spine on its card in
 * the till, its chip in a table, its line in the cart, its slice in a chart.
 *
 * The point is that staff stop reading labels. Amber is jewellery. Coral is
 * bags. After a day on the counter you recognise stock by colour alone, which
 * is the whole reason the shop is faster with this than with a notebook.
 */

export const CATEGORY_TOKENS = [
    "coral",
    "gold",
    "steel",
    "magenta",
    "rose",
    "indigo",
    "teal",
    "leaf",
] as const;

export type CategoryToken = (typeof CATEGORY_TOKENS)[number] | "slate";

/**
 * Categories this shop actually sells, mapped to a colour that means something:
 * gold for jewellery, steel for watches, magenta for perfume bottles.
 * Keys are matched case-insensitively, and by substring, so "Ladies Bags" and
 * "bag" both land on coral.
 */
const KNOWN: Array<[RegExp, CategoryToken]> = [
    [/\b(bag|bags|handbag|purse|clutch|backpack|boorso)\b/i, "coral"],
    [/\b(jewel|jewellery|jewelry|necklace|ring|bracelet|earring|dahab)\b/i, "gold"],
    [/\b(watch|watches|saacad)\b/i, "steel"],
    [/\b(perfume|perfumes|fragrance|scent|cadar|oud)\b/i, "magenta"],
    [/\b(cosmetic|cosmetics|makeup|make-up|beauty|skincare|kareem)\b/i, "rose"],
    [/\b(hair|wig|extension|scarf|hijab|shash)\b/i, "indigo"],
    [/\b(shoe|shoes|sandal|heel|kabo)\b/i, "teal"],
    [/\b(accessor|accessories|belt|sunglass|glasses)\b/i, "leaf"],
];

/**
 * Anything the shop invents later still gets a stable colour, picked by hashing
 * the name. The same category always resolves to the same colour, on every
 * screen and every device, without anyone configuring it.
 */
function hashToken(value: string): CategoryToken {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        hash = (hash << 5) - hash + value.charCodeAt(i);
        hash |= 0;
    }
    return CATEGORY_TOKENS[Math.abs(hash) % CATEGORY_TOKENS.length];
}

export function categoryToken(category?: string | null): CategoryToken {
    const name = category?.trim();
    if (!name) return "slate";

    for (const [pattern, token] of KNOWN) {
        if (pattern.test(name)) return token;
    }
    return hashToken(name.toLowerCase());
}

/** The colour itself, for inline styles and chart fills. */
export function categoryColor(category?: string | null): string {
    return `var(--cat-${categoryToken(category)})`;
}

/**
 * The chart-fill version of the same hue. Chips carry text and must read as
 * ink; bars are filled shapes and need a different step of the same colour.
 * These values are validated for colour-blind separation — see globals.css.
 */
export function categoryMark(category?: string | null): string {
    return `var(--mark-${categoryToken(category)})`;
}

/** A faint wash of the colour, for chip and row backgrounds. */
export function categoryTint(category?: string | null, amount = 12): string {
    return `color-mix(in oklch, ${categoryColor(category)} ${amount}%, transparent)`;
}

export function categoryLabel(category?: string | null): string {
    return category?.trim() || "Uncategorised";
}

/** Stable colours for the four ways this shop takes money. */
export const PAYMENT_METHODS = ["Cash", "Zaad", "eDahab", "Bank"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

const PAYMENT_TOKENS: Record<string, string> = {
    cash: "leaf",
    zaad: "steel",
    edahab: "gold",
    bank: "indigo",
};

export function paymentColor(method?: string | null): string {
    const token = PAYMENT_TOKENS[String(method ?? "").toLowerCase()] ?? "slate";
    return `var(--cat-${token})`;
}

export function paymentTint(method?: string | null, amount = 14): string {
    return `color-mix(in oklch, ${paymentColor(method)} ${amount}%, transparent)`;
}

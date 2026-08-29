# Boutique POS — Design Spec

**Date:** 2026-08-26
**Status:** Draft for review
**Supersedes parts of:** `docs/PROJECT_SPECS.md`

## Context

The client runs a women's accessories store — bags, jewellery, watches, and
related accessories. The existing system tracks products and records sales, but
three things it does not do are the things the client actually asked for:

1. Register a customer and see what that customer bought.
2. Record one purchase containing several items.
3. Report profit that accounts for what the goods cost.

This spec covers the data model, server, feature and visual work needed to
close that gap, plus the correctness and security defects found in the current
implementation.

## Goals

- A customer can be registered at checkout in seconds, and their full purchase
  history is retrievable afterwards.
- One purchase = one receipt, however many items it contains.
- Stock deducts accurately and every change is auditable.
- Profit figures reflect cost of goods, not just revenue.
- All four payment methods the client uses are supported: Cash, Zaad, eDahab,
  Bank.
- The interface reads as a boutique tool, works in both light and dark, and
  feels responsive on the phone the staff actually use.

## Non-goals

- Customer-facing e-commerce.
- Multi-store or multi-warehouse inventory.
- Barcode scanners and receipt-printer hardware integration.
- Loyalty points, customer credit/debt balances, supplier management.
- Product variants (a bag in three colours is three products).

---

## 1. Data model

All money columns become `Decimal(12, 2)`. The current `Float` columns
accumulate rounding error across transactions.

### 1.1 New: `Customer`

| Field | Type | Notes |
|---|---|---|
| id | String | cuid |
| name | String | required |
| phone | String? | optional, indexed |
| note | String? | free text |
| createdAt / updatedAt | DateTime | |

Indexed on `name` and `phone` so checkout lookup stays instant.

`Sale.customerName` (free text) is replaced by `Sale.customerId`. Existing
non-empty `customerName` values are migrated into `Customer` records,
de-duplicated case-insensitively by name.

### 1.2 Changed: `Product`

Added:

| Field | Type | Purpose |
|---|---|---|
| costPrice | Decimal(12,2), default 0 | what the client paid — drives profit |
| sku | String?, unique | optional, for the client's own labelling |
| imageUrl | String? | product photo |
| lowStockThreshold | Int, default 3 | per-product reorder point |
| isArchived | Boolean, default false | replaces hard delete |

`deleteProduct` currently throws a foreign-key error once a product has sales.
Archiving replaces it: archived products vanish from POS and inventory by
default, remain visible behind an "Archived" filter, and keep their sales
history intact.

### 1.3 Changed: `Sale` — now an order

| Field | Type | Notes |
|---|---|---|
| id | String | cuid |
| invoiceNo | Int, unique, auto-increment | human-readable receipt number |
| customerId | String? | null for walk-ins |
| userId | String? | cashier |
| paymentMethod | enum PaymentMethod | CASH \| ZAAD \| EDAHAB \| BANK |
| subtotal | Decimal(12,2) | sum of line totals |
| discount | Decimal(12,2), default 0 | whole-sale discount |
| total | Decimal(12,2) | subtotal − discount |
| status | enum SaleStatus | COMPLETED \| RETURNED \| PARTIALLY_RETURNED |
| note | String? | |
| createdAt | DateTime | indexed |

`productId` and `quantity` move off `Sale` onto `SaleItem`.

### 1.4 New: `SaleItem`

| Field | Type | Notes |
|---|---|---|
| id | String | |
| saleId | String | indexed, cascade delete |
| productId | String | indexed, restrict delete |
| productName | String | **snapshot** at time of sale |
| quantity | Int | > 0 |
| unitPrice | Decimal(12,2) | **snapshot** |
| unitCost | Decimal(12,2) | **snapshot** |
| lineTotal | Decimal(12,2) | unitPrice × quantity |
| returnedQty | Int, default 0 | |

Price and cost are snapshotted deliberately. If the client later raises a bag's
price from $30 to $35, last month's reported profit must not change.

### 1.5 New: `StockMovement`

Every change to `Product.stock` writes a row here. Nothing mutates stock
directly.

| Field | Type | Notes |
|---|---|---|
| id | String | |
| productId | String | indexed |
| type | enum StockMovementType | SALE \| RESTOCK \| ADJUSTMENT \| RETURN \| INITIAL |
| delta | Int | negative for outgoing |
| balanceAfter | Int | stock level after this movement |
| reason | String? | required for ADJUSTMENT |
| saleId | String? | set for SALE and RETURN |
| userId | String? | who did it |
| createdAt | DateTime | indexed |

This answers the question a paper-free shop always eventually asks: *the system
says 4, I counted 3 — what happened?*

### 1.6 Changed: `Expense`

Added `userId` (who logged it) and `date` (a `DateTime` distinct from
`createdAt`, so yesterday's expense can be logged today). `category` becomes a
constrained set with an "Other" escape hatch.

### 1.7 Enums

```
PaymentMethod      CASH | ZAAD | EDAHAB | BANK
SaleStatus         COMPLETED | RETURNED | PARTIALLY_RETURNED
StockMovementType  SALE | RESTOCK | ADJUSTMENT | RETURN | INITIAL
```

`User.role` stays a `String`. Better Auth's `additionalFields` configuration in
`lib/auth.ts:15` declares it as `type: "string"`, and a Prisma enum there risks
breaking the adapter. It is constrained by a Zod schema instead.

### 1.8 Migration

A single migration script, idempotent, run once:

1. Create the new tables and columns.
2. For each existing `Sale`: create a `SaleItem` carrying its `productId`,
   `quantity`, and `totalAmount`; set `unitPrice = totalAmount / quantity`,
   `unitCost = 0`; set the sale's `subtotal` and `total` from `totalAmount`;
   assign a sequential `invoiceNo` ordered by `createdAt`.
3. Convert each distinct non-empty `customerName` into a `Customer` and link it.
4. Map `paymentMethod` strings onto the enum (`"Zaad"` → `ZAAD`, etc.);
   anything unrecognised maps to `CASH` and is logged.
5. Write one `INITIAL` StockMovement per product for the current stock level.
6. Drop `Sale.productId`, `Sale.quantity`, `Sale.customerName`.

Because `costPrice` seeds to 0, profit initially equals revenue. The dashboard
shows a persistent, dismissable warning listing how many products still lack a
cost price, linking to a bulk-fill screen. This is intentional: silently
reporting 100% margin would be worse than telling the client the data is
incomplete.

---

## 2. Server layer

### 2.1 Authorization

`lib/guards.ts` exports `requireUser()` and `requireAdmin()`. Every server
action calls one of them as its first statement. Today only `actions/users.ts`
checks anything; `createSale`, `createProduct`, `deleteProduct` and
`createExpense` are callable by anyone who can reach the endpoint.

Admin-only: user management, reports, product cost editing, stock adjustments,
returns, expense deletion.
Any authenticated user: POS checkout, reading products, creating customers,
logging expenses.

`/reports` and `/users` get server-side admin checks. Hiding a sidebar link is
not access control.

### 2.2 Validation

`lib/validations.ts` holds one Zod schema per action. Enforced invariants:

- `quantity` is an integer ≥ 1. Today a negative quantity reaches
  `stock: { decrement: quantity }` and **increases** stock while recording a
  negative-value sale.
- `price`, `costPrice`, `discount`, `amount` are ≥ 0.
- `discount` may not exceed subtotal.
- `paymentMethod` must be a valid enum member.
- Strings are trimmed and length-capped.

### 2.3 Transactions

`createSale` runs one transaction that, for every line: re-reads the product,
verifies `stock >= quantity` **inside** the transaction, decrements, and writes
the `SaleItem` and `StockMovement`. Two cashiers cannot both sell the last bag.
Any failing line aborts the whole sale.

### 2.4 Result shape

Actions return `{ ok: true, data }` or `{ ok: false, error }` rather than
throwing raw errors across the server boundary. The UI renders `error` directly
instead of the current `error.message || "Failed"` guesswork.

### 2.5 Performance

- Indexes: `Sale.createdAt`, `Sale.customerId`, `SaleItem.saleId`,
  `SaleItem.productId`, `StockMovement.productId`, `StockMovement.createdAt`.
- Sales history paginates server-side. `getAllSales()` currently returns every
  sale ever recorded.
- Reports accept a date range and aggregate with `groupBy` in SQL.
  `actions/reports.ts` currently loads every sale into Node memory and reduces
  in JavaScript.

### 2.6 Money and formatting

`lib/money.ts` centralises Decimal handling and one `formatMoney()`. Currency
code lives in a single constant (USD default). This replaces roughly forty
hardcoded `$${x.toFixed(2)}` expressions spread across the app.

---

## 3. Features

### 3.1 POS — cart checkout

Replaces the current select-one-product form.

- Product grid with photo, name, price, stock badge; search and category filter.
- Click adds to cart; clicking again increments. Cart supports inline quantity
  editing, per-line removal, and a whole-sale discount.
- Out-of-stock products are visibly disabled, not merely rejected on submit.
- Customer: a combobox that searches existing customers by name or phone, with
  "＋ Create new" inline (name, optional phone) without leaving the screen.
  Skippable for walk-ins.
- Payment: four buttons — Cash, Zaad, eDahab, Bank — each with its own colour,
  used consistently everywhere in the app.
- Checkout opens a receipt: invoice number, line items, total, payment method,
  customer, cashier, timestamp. Printable, and dismissable straight into a
  fresh empty cart.
- Keyboard: `/` focuses search, `Enter` adds the first result, `Esc` clears.

### 3.2 Customers

- List page: name, phone, purchases, total spent, last visit; searchable.
- Detail page: profile, lifetime totals, most-bought category, full purchase
  history with expandable line items.
- Create and edit from the customers page as well as from checkout.

### 3.3 Inventory

- Product image upload, cost price, price, margin % (computed), stock,
  per-product low-stock threshold.
- Restock action: add quantity, optionally update cost price, writes a
  `RESTOCK` movement.
- Adjust stock: set a new count with a mandatory reason (damaged, lost,
  miscounted, gifted), writes an `ADJUSTMENT` movement.
- Archive replaces delete.
- Per-product movement history.
- CSV import extended to carry `costPrice`, `sku`, `lowStockThreshold`, with a
  preview-and-confirm step before writing.

### 3.4 Returns

From a sale in the history: select lines and quantities to return. This
restores stock via `RETURN` movements, sets the sale's status, and subtracts
the returned revenue and cost from all reports. Refund method is recorded.

### 3.5 Dashboard

Today and this-month cards for revenue, **gross profit** (revenue − COGS),
expenses, and net profit (gross profit − expenses), plus items sold. Below:
a payment-method breakdown, recent sales, low-stock list, and the missing-cost
warning.

The current "Net Profit" is `sales − expenses` with no cost of goods
(`actions/analytics.ts:36`). For a client whose stated goal is knowing whether
the business makes money, this is the most consequential defect in the system.

### 3.6 Reports

Date-range picker (today, 7d, 30d, this month, custom). Sections: revenue and
profit over time, profit by product, profit by category, best customers,
cashier performance, payment mix, and slow-moving stock. CSV and PDF export.

---

## 4. Design system

### 4.1 Direction

Refined boutique. Warm neutral grounds with a brushed-gold accent — a tool that
belongs in an accessories shop rather than a generic blue-grey admin panel.

Light mode is built on warm ivory and sand with white cards and deep espresso
text. Dark mode is a designed palette — deep espresso-black ground, warm
charcoal cards — not an inversion of the light one. Both are held to WCAG AA
for text and interactive elements.

### 4.2 Tokens

Extends the existing `app/globals.css` token structure:

- Full neutral ramp, warm-tinted rather than pure grey.
- Accent (gold/brass) with hover, active and subtle-background variants.
- Semantic: success, warning, danger, info — each with foreground and subtle
  background pairs, defined in both themes.
- Payment-method colours: Cash, Zaad, eDahab, Bank, applied identically to
  chips, charts and buttons app-wide.
- Elevation as a small set of named shadows rather than ad-hoc `shadow-sm`.

`components/app-layout.tsx:13` hardcodes `bg-slate-50` in light mode, bypassing
the theme tokens entirely. Fixed as part of this work.

### 4.3 Typography

- Headings: an elegant serif, sized down and tightened — character without
  shouting.
- UI and body: a clean grotesque, high legibility at 13–14px.
- **All numbers use tabular figures.** Money in a column must align, and a
  total must not jitter as it changes.
- A defined type scale replaces the current ad-hoc `text-[11px]` /
  `text-[13px]` / `text-[15px]` values scattered through the components.

### 4.4 Motion

- Dialogs: 220ms scale-and-lift on a natural easing curve, replacing the
  abrupt 100ms fade-zoom in `components/ui/dialog.tsx:53`.
- Mobile: a real bottom sheet with a grab handle and drag-to-dismiss, replacing
  the hand-rolled overlay in `pos-checkout.tsx`.
- Cart lines animate in and out; totals count up rather than snapping.
- Page content enters with a short stagger.
- Every animation is disabled under `prefers-reduced-motion`.

### 4.5 Components and states

- One consistent lucide icon size and stroke scale; a defined icon per entity.
- Designed empty states — an icon, a sentence, and the action that resolves it
  — for every list.
- Loading skeletons matching final layout, replacing bare spinners.
- Toasts restyled to the palette, with distinct success/error treatments.
- Tables get sticky headers, a comfortable/compact density toggle, and a
  genuinely usable mobile layout (card rows below `sm`).

---

## 5. Testing

- **Unit:** money arithmetic and rounding; profit calculation; validation
  schemas reject negative quantity, over-large discount, bad payment method.
- **Integration:** multi-item sale decrements every product and writes matching
  `StockMovement` rows; insufficient stock aborts the entire sale leaving stock
  untouched; a return restores exactly the returned quantity; unauthenticated
  and non-admin calls to guarded actions are rejected.
- **E2E (Playwright):** add three products to the cart, attach a new customer,
  pay by Bank, see the receipt, and confirm stock dropped correctly. The
  existing `tests/pos.spec.ts` is written against a cart UI that does not exist
  yet and is full of conditional no-op assertions — it gets rewritten.
- **Migration:** run against a copy of seeded data; verify no sale loses its
  value and totals reconcile before and after.

---

## 6. Delivery order

1. **Foundation** — schema, enums, migration script, `lib/money.ts`,
   `lib/guards.ts`, `lib/validations.ts`.
2. **Server actions** — rewritten against the new model, guarded, validated,
   transactional; reports moved into SQL aggregation.
3. **Design system** — tokens, typography, motion primitives, shared
   components. Landed before the screens so each screen is built once.
4. **POS cart + receipt.**
5. **Customers.**
6. **Inventory** — cost, images, restock, adjust, archive, movement history.
7. **Dashboard and reports** — true profit, date ranges.
8. **Returns.**
9. **Tests and cleanup** — remove `test-signup.ts`, untrack
   `playwright-report/` and `test-results/`.

Each stage leaves the app working. Stages 1 and 2 are the ones that must not be
rushed: everything downstream depends on the model being right.

## 7. Open risks

- **`costPrice` starts at 0.** Profit reporting is only as good as the data the
  client enters. Mitigated by the dashboard warning and a bulk-fill screen, but
  it needs saying to the client directly.
- **Migration is one-way.** Take a database backup before running it.
- **Product images need storage.** Local `public/uploads` is simplest and works
  for a single-server deployment; object storage is the alternative if the app
  is deployed somewhere with an ephemeral filesystem. Decision needed before
  stage 6.
- **Better Auth password updates** are still unimplemented in
  `actions/users.ts:106` — an admin editing a user cannot reset their password.
  Fixed in stage 2.

import { getProducts } from "@/actions/products";
import { getCustomers } from "@/actions/customers";
import { getTodaySummary } from "@/actions/analytics";
import { requireUser } from "@/lib/session";
import { PosCheckout } from "./pos-checkout";
import { formatMoney } from "@/lib/format";
import { Banknote } from "lucide-react";

export default async function PosPage() {
    await requireUser();

    const [products, customers, today] = await Promise.all([
        getProducts(),
        getCustomers(),
        getTodaySummary(),
    ]);

    return (
        <div className="stack-in flex min-h-0 flex-col lg:h-[calc(100vh-8rem)]">
            <header className="flex flex-wrap items-center justify-between gap-3 pb-5">
                <div>
                    <h1 className="font-heading text-2xl font-semibold tracking-tight">Sell</h1>
                    <p className="text-sm text-muted-foreground">
                        Tap an item, set the amount, take the payment.
                    </p>
                </div>

                {/* Today's running total, where staff can see it without leaving
                    the till. */}
                <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 shadow-card">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-success/12 text-success">
                        <Banknote className="size-4.5" strokeWidth={1.75} />
                    </span>
                    <div>
                        <p className="font-heading text-lg font-semibold leading-none tabular">
                            {formatMoney(today.total)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {today.count} {today.count === 1 ? "sale" : "sales"} today
                        </p>
                    </div>
                </div>
            </header>

            <PosCheckout
                products={products}
                customers={customers.map((c) => ({ id: c.id, name: c.name, phone: c.phone }))}
            />
        </div>
    );
}

import { getAllSales } from "@/actions/sales";
import { requireUser } from "@/lib/session";
import { RecentSalesTable } from "../recent-sales-table";
import { PageHeader } from "@/components/page-header";

export default async function SalesPage() {
    const user = await requireUser();
    const sales = await getAllSales();

    return (
        <div className="stack-in">
            <PageHeader
                title="Sales"
                description="Every sale recorded, newest first."
            />
            {/* Undoing a sale rewrites the takings, so it stays with the owner. */}
            <RecentSalesTable initialSales={sales} showDelete={user.role === "admin"} />
        </div>
    );
}

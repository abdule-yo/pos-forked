import { getAllSales } from "@/actions/sales";
import { requireUser } from "@/lib/session";
import { RecentSalesTable } from "../recent-sales-table";
import { PageHeader } from "@/components/page-header";

export default async function SalesPage() {
    await requireUser();
    const sales = await getAllSales();

    return (
        <div className="stack-in">
            <PageHeader
                title="Sales"
                description="Every sale recorded, newest first."
            />
            <RecentSalesTable initialSales={sales} />
        </div>
    );
}

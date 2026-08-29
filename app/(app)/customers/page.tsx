import { getCustomers } from "@/actions/customers";
import { requireUser } from "@/lib/session";
import { CustomersTable } from "./customers-table";
import { PageHeader } from "@/components/page-header";

export default async function CustomersPage() {
    await requireUser();
    const customers = await getCustomers();

    return (
        <div className="stack-in">
            <PageHeader
                title="Customers"
                description="Who buys from the shop, and what they've spent."
            />
            <CustomersTable initialCustomers={customers} />
        </div>
    );
}

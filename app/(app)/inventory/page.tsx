import { getProducts } from "@/actions/products";
import { requireUser } from "@/lib/session";
import { InventoryTable } from "./inventory-table";
import { PageHeader } from "@/components/page-header";

export default async function InventoryPage() {
    await requireUser();
    const products = await getProducts();

    return (
        <div className="stack-in">
            <PageHeader
                title="Products"
                description="Everything the shop sells, and how many are left."
            />
            <InventoryTable initialProducts={products} />
        </div>
    );
}

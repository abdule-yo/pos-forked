import { getExpenses } from "@/actions/expenses";
import { requireAdmin } from "@/lib/session";
import { ExpensesTable } from "./expenses-table";
import { PageHeader } from "@/components/page-header";

export default async function ExpensesPage() {
    await requireAdmin();
    const expenses = await getExpenses();

    return (
        <div className="stack-in">
            <PageHeader
                title="Expenses"
                description="Rent, electricity, transport — what the shop spends."
            />
            <ExpensesTable initialExpenses={expenses} />
        </div>
    );
}

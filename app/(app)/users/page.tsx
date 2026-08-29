import { getAllUsers } from "@/actions/users";
import { requireAdmin } from "@/lib/session";
import { UsersTable } from "./users-table";
import { PageHeader } from "@/components/page-header";

export default async function UsersPage() {
    const currentUser = await requireAdmin();
    const users = await getAllUsers();

    return (
        <div className="stack-in">
            <PageHeader
                title="Staff"
                description="Who can sign in, and what they are allowed to see."
            />
            <UsersTable initialUsers={users} currentUserId={currentUser.id} />
        </div>
    );
}

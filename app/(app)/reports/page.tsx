import { getReportData } from "@/actions/reports";
import { requireAdmin } from "@/lib/session";
import { ReportsDashboard } from "./reports-dashboard";
import { PageHeader } from "@/components/page-header";

export default async function ReportsPage() {
    await requireAdmin();
    const reportData = await getReportData();

    return (
        <div className="stack-in">
            <PageHeader
                title="Reports"
                description="What sells, who sells it, and how customers pay."
            />
            <ReportsDashboard data={reportData} />
        </div>
    );
}

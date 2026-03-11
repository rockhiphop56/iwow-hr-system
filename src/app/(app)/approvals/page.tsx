import { requireSession } from "@/lib/auth";
import { getMyRequests, getPendingApprovals } from "@/services/approval.service";
import { ApprovalList } from "@/components/approvals/ApprovalList";

export default async function ApprovalsPage() {
  let myRequests: Awaited<ReturnType<typeof getMyRequests>> = [];
  let pendingApprovals: Awaited<ReturnType<typeof getPendingApprovals>> = [];

  try {
    const session = await requireSession();
    [myRequests, pendingApprovals] = await Promise.all([
      getMyRequests(session.userId),
      getPendingApprovals(session.tenantId),
    ]);
  } catch (err) {
    console.error("Approvals data fetch failed:", err);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">簽核作業</h1>
        <p className="mt-1 text-sm text-gray-400">管理您的簽核申請與待審批項目</p>
      </div>

      <ApprovalList myRequests={myRequests} pendingApprovals={pendingApprovals} />
    </div>
  );
}

import { getApprovalTypes } from "@/services/approval.service";
import { ApprovalTypeSettings } from "@/components/settings/ApprovalTypeSettings";

export default async function ApprovalTypesPage() {
  let types: Awaited<ReturnType<typeof getApprovalTypes>> = [];

  try {
    types = await getApprovalTypes();
  } catch (err) {
    console.error("ApprovalTypes fetch failed:", err);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">簽核類型設定</h1>
        <p className="mt-1 text-sm text-gray-400">管理簽核類型與審批流程</p>
      </div>
      <ApprovalTypeSettings types={types} />
    </div>
  );
}

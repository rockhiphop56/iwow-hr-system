import { buildOrgTree } from "@/services/departments.service";
import { OrgChartEditor } from "@/components/org-chart/OrgChartEditor";
import { getUserPermissions } from "@/lib/permissions";

export default async function OrgChartPage() {
  let orgTree: Awaited<ReturnType<typeof buildOrgTree>> = [];
  let canEdit = false;

  try {
    const [tree, perms] = await Promise.all([buildOrgTree(), getUserPermissions()]);
    orgTree = tree;
    canEdit = perms.permissions.includes("org.edit");
  } catch (err) {
    console.error("OrgChart data fetch failed:", err);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">行政組織圖</h1>
          <p className="mt-1 text-sm text-gray-400">公司行政組織架構，全員可見</p>
        </div>
      </div>

      {orgTree.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <p>尚無組織資料</p>
          <p className="mt-1 text-sm">請先至「參數設定」建立部門與人員</p>
        </div>
      ) : (
        <OrgChartEditor tree={orgTree} canEdit={canEdit} />
      )}
    </div>
  );
}

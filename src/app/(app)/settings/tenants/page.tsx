import { getAllTenants } from "@/services/tenants.service";
import { TenantSettings } from "@/components/settings/TenantSettings";

export default async function TenantsPage() {
  let tenants: Awaited<ReturnType<typeof getAllTenants>> = [];

  try {
    tenants = await getAllTenants();
  } catch (err) {
    console.error("Tenants fetch failed:", err);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">公司 / 分店管理</h1>
        <p className="mt-1 text-sm text-gray-400">管理集團控股公司與子公司/分店資訊</p>
      </div>
      <TenantSettings tenants={tenants} />
    </div>
  );
}

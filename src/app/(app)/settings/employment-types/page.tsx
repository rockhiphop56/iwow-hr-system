import { getEmploymentTypes } from "@/services/employment-types.service";
import { EmploymentTypeSettings } from "@/components/settings/EmploymentTypeSettings";

export default async function EmploymentTypesPage() {
  let types: Awaited<ReturnType<typeof getEmploymentTypes>> = [];

  try {
    types = await getEmploymentTypes();
  } catch (err) {
    console.error("EmploymentTypes fetch failed:", err);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">僱用類型管理</h1>
        <p className="mt-1 text-sm text-gray-400">管理勞僱與承攬等僱用類型</p>
      </div>
      <EmploymentTypeSettings types={types} />
    </div>
  );
}

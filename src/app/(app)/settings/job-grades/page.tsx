import { getJobGrades } from "@/services/job-grades.service";
import { JobGradeSettings } from "@/components/settings/JobGradeSettings";

export default async function JobGradesPage() {
  let grades: Awaited<ReturnType<typeof getJobGrades>> = [];

  try {
    grades = await getJobGrades();
  } catch (err) {
    console.error("JobGrades fetch failed:", err);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">職等管理</h1>
        <p className="mt-1 text-sm text-gray-400">定義組織職等級別</p>
      </div>
      <JobGradeSettings grades={grades} />
    </div>
  );
}

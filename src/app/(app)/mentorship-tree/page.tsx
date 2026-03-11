import { buildMentorTree } from "@/services/mentorship-tree.service";
import { MentorTreeView } from "@/components/mentorship/MentorTreeView";

export default async function MentorshipTreePage() {
  let tree: Awaited<ReturnType<typeof buildMentorTree>> = [];

  try {
    tree = await buildMentorTree();
  } catch (err) {
    console.error("MentorTree data fetch failed:", err);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">師徒組織圖</h1>
        <p className="mt-1 text-sm text-gray-400">
          師徒關係樹狀圖（最多顯示至徒孫 L2），全員可見
        </p>
      </div>

      {tree.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <p>尚無師徒關係</p>
          <p className="mt-1 text-sm">新增員工時可指定導師</p>
        </div>
      ) : (
        <MentorTreeView tree={tree} />
      )}
    </div>
  );
}

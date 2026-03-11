"use client";

import type { MentorTreeNode } from "@/types/database.types";

interface Props {
  tree: MentorTreeNode[];
}

export function MentorTreeView({ tree }: Props) {
  return (
    <div className="space-y-4">
      {tree.map((mentor) => (
        <MentorNode key={mentor.user_uuid} node={mentor} depth={0} />
      ))}
    </div>
  );
}

function MentorNode({ node, depth }: { node: MentorTreeNode; depth: number }) {
  const levelLabels = ["師父", "徒弟", "徒孫"];
  const levelColors = [
    "border-amber-500/30 bg-amber-500/10 text-amber-300",
    "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  ];
  const avatarColors = ["bg-amber-500", "bg-indigo-500", "bg-emerald-500"];

  const label = levelLabels[depth] ?? `L${depth}`;
  const colorClass = levelColors[depth] ?? levelColors[2];
  const avatarColor = avatarColors[depth] ?? avatarColors[2];

  return (
    <div style={{ paddingLeft: `${depth * 2}rem` }}>
      {/* 連接線 */}
      {depth > 0 && (
        <div className="relative ml-4 mb-1">
          <div className="absolute -left-4 -top-2 h-6 w-4 border-l border-b border-white/10 rounded-bl-lg" />
        </div>
      )}

      <div className={`inline-flex items-center gap-3 rounded-lg border px-4 py-2.5 ${colorClass}`}>
        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${avatarColor} text-sm font-bold text-white`}>
          {node.name[0]}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{node.name}</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">{label}</span>
          </div>
          <div className="flex items-center gap-2 text-xs opacity-70">
            {node.dept_name && <span>{node.dept_name}</span>}
            {node.role_name && <span>· {node.role_name}</span>}
          </div>
        </div>
        {node.apprentices.length > 0 && (
          <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs">
            {node.apprentices.length} 位{depth === 0 ? "徒弟" : "徒孫"}
          </span>
        )}
      </div>

      {/* 子節點 */}
      {node.apprentices.length > 0 && (
        <div className="mt-1 space-y-1">
          {node.apprentices.map((child) => (
            <MentorNode key={child.user_uuid} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

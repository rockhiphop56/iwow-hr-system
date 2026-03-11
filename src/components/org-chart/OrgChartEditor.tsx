"use client";

import type { OrgChartDeptNode } from "@/types/database.types";
import { OrgDeptCard } from "./OrgDeptCard";

interface Props {
  tree: OrgChartDeptNode[];
  canEdit: boolean;
}

export function OrgChartEditor({ tree, canEdit }: Props) {
  return (
    <div className="space-y-2">
      {tree.map((node) => (
        <OrgTreeNode key={node.dept_id} node={node} depth={0} canEdit={canEdit} />
      ))}
    </div>
  );
}

function OrgTreeNode({
  node,
  depth,
  canEdit,
}: {
  node: OrgChartDeptNode;
  depth: number;
  canEdit: boolean;
}) {
  return (
    <div>
      {/* 主管列（金色區塊） */}
      {node.heads.length > 0 && (
        <div
          className="flex flex-wrap gap-2 mb-1"
          style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
        >
          {node.heads.map((head) => (
            <div
              key={head.user_uuid}
              className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-sm"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-black">
                {head.name[0]}
              </div>
              <span className="font-medium text-amber-300">{head.name}</span>
              {head.role_name && (
                <span className="text-xs text-amber-400/70">({head.role_name})</span>
              )}
              <span className="text-[10px] text-amber-500/50">⭐ 主管</span>
            </div>
          ))}
        </div>
      )}

      {/* 部門卡片 */}
      <OrgDeptCard node={node} depth={depth} canEdit={canEdit} />

      {/* 子部門 */}
      {node.children.map((child) => (
        <OrgTreeNode key={child.dept_id} node={child} depth={depth + 1} canEdit={canEdit} />
      ))}
    </div>
  );
}

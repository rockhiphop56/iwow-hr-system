"use client";

import type { OrgChartDeptNode } from "@/types/database.types";

interface Props {
  node: OrgChartDeptNode;
  depth: number;
  canEdit: boolean;
}

export function OrgDeptCard({ node, depth, canEdit }: Props) {
  return (
    <div
      className="group relative rounded-lg border border-primary-500/20 bg-primary-500/5 transition-colors hover:border-primary-500/40"
      style={{ marginLeft: `${depth * 1.5}rem` }}
    >
      {/* 左邊連接線 */}
      {depth > 0 && (
        <div className="absolute -left-3 top-1/2 h-px w-3 bg-white/10" />
      )}

      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600/20 text-primary-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0-.75 3.75m0 0-.75 3.75M17.25 7.5l.75 3.75m0 0 .75 3.75" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-primary-300">{node.dept_name}</h3>
            {node.dept_code && (
              <span className="text-xs text-gray-500">{node.dept_code}</span>
            )}
          </div>
          <span className="rounded-full bg-primary-500/10 px-2 py-0.5 text-xs text-primary-400">
            {node.members.length} 人
          </span>
        </div>
      </div>

      {/* 成員列表 */}
      {node.members.length > 0 && (
        <div className="border-t border-white/5 px-4 py-2">
          <div className="flex flex-wrap gap-2">
            {node.members.map((member) => (
              <div
                key={member.user_uuid}
                className="flex items-center gap-2 rounded-md bg-emerald-500/5 px-2.5 py-1 text-xs"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                  {member.name[0]}
                </div>
                <span className="text-emerald-300">{member.name}</span>
                {member.role_name && (
                  <span className="text-gray-500">- {member.role_name}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

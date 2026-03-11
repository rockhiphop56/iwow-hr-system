"use client";

import { useState } from "react";
import type { ApprovalRequestWithDetails } from "@/types/database.types";
import { performApprovalActionAction } from "@/app/actions/approval.actions";

interface Props {
  myRequests: ApprovalRequestWithDetails[];
  pendingApprovals: ApprovalRequestWithDetails[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "待處理", color: "text-yellow-400 bg-yellow-400/10" },
  in_progress: { label: "審批中", color: "text-blue-400 bg-blue-400/10" },
  approved: { label: "已核准", color: "text-emerald-400 bg-emerald-400/10" },
  rejected: { label: "已駁回", color: "text-red-400 bg-red-400/10" },
  cancelled: { label: "已取消", color: "text-gray-400 bg-gray-400/10" },
};

export function ApprovalList({ myRequests, pendingApprovals }: Props) {
  const [tab, setTab] = useState<"mine" | "pending">("pending");

  const items = tab === "mine" ? myRequests : pendingApprovals;

  return (
    <div>
      {/* Tab 切換 */}
      <div className="mb-4 flex gap-1 rounded-lg bg-white/5 p-1">
        <button
          onClick={() => setTab("pending")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "pending" ? "bg-primary-600 text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          待我審批
          {pendingApprovals.length > 0 && (
            <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
              {pendingApprovals.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("mine")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "mine" ? "bg-primary-600 text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          我的申請
        </button>
      </div>

      {/* 列表 */}
      {items.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <p>{tab === "pending" ? "目前沒有待審批的項目" : "您尚未提交任何簽核申請"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <ApprovalCard key={item.request_id} item={item} showActions={tab === "pending"} />
          ))}
        </div>
      )}
    </div>
  );
}

function ApprovalCard({
  item,
  showActions,
}: {
  item: ApprovalRequestWithDetails;
  showActions: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const status = STATUS_LABELS[item.status] ?? STATUS_LABELS.pending;

  async function handleAction(action: "approve" | "reject") {
    setLoading(true);
    try {
      await performApprovalActionAction(item.request_id, action);
    } catch {
      // error handled
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{item.type?.type_name ?? "簽核申請"}</h3>
            <span className={`rounded-full px-2 py-0.5 text-xs ${status.color}`}>
              {status.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-400">
            申請人：{item.requester?.name ?? "未知"} ·{" "}
            {new Date(item.created_at).toLocaleDateString("zh-TW")}
          </p>
          {item.summary && (
            <p className="mt-1 text-sm text-gray-300">{item.summary}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            目前步驟：第 {item.current_step} 步
          </p>
        </div>

        {showActions && (item.status === "pending" || item.status === "in_progress") && (
          <div className="flex gap-2">
            <button
              onClick={() => handleAction("approve")}
              disabled={loading}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              核准
            </button>
            <button
              onClick={() => handleAction("reject")}
              disabled={loading}
              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
            >
              駁回
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

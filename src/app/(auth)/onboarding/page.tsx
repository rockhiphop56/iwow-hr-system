"use client";

import { useState } from "react";
import { completeProfileAction } from "@/app/actions/onboarding.actions";

export default function OnboardingPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await completeProfileAction({ name, phone });

    if (result.success) {
      window.location.href = "/dashboard";
    } else {
      setError(result.error ?? "建立失敗，請稍後再試");
      setLoading(false);
    }
  }

  return (
    <div className="card w-full max-w-md text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-xl font-bold">
        i
      </div>
      <h1 className="mb-2 text-xl font-bold">歡迎加入愛窩集團</h1>
      <p className="mb-8 text-sm text-gray-400">
        請先完善您的個人資料
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">
            姓名 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="請輸入您的姓名"
            required
            className="input-field"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">
            手機號碼
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="例：0912-345-678"
            className="input-field"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="btn-primary w-full"
        >
          {loading ? "建立中..." : "完成設定，進入系統"}
        </button>
      </form>
    </div>
  );
}

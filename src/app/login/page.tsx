"use client";

import { createClient } from "@/services/supabase/client";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (!error) setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="card w-full max-w-md text-center">
        <div className="mx-auto mb-6 h-12 w-12 rounded-xl bg-primary-600 flex items-center justify-center text-xl font-bold">
          A
        </div>
        <h1 className="mb-2 text-xl font-bold">愛窩集團 HR 系統</h1>
        <p className="mb-8 text-sm text-gray-400">使用 Email 登入</p>

        {sent ? (
          <p className="text-emerald-400">驗證信已發送至 {email}，請查收。</p>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="input-field"
            />
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "發送中..." : "發送驗證信"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

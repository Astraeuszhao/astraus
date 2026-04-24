import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
      credentials: "include",
    });
    setLoading(false);
    if (res.ok) {
      await router.replace("/admin");
      return;
    }
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    setErr(data.message || "登录失败");
  }

  return (
    <>
      <Head>
        <title>ASTRAEUS · 后台登录</title>
      </Head>
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 px-4">
        <h1 className="text-2xl font-semibold text-white tracking-tight">ASTRAEUS</h1>
        <p className="text-zinc-500 text-sm mt-1 mb-10">管理后台</p>
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
          <input
            type="password"
            autoComplete="current-password"
            placeholder="后台密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-500"
          />
          {err ? <p className="text-red-400 text-sm">{err}</p> : null}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-xl bg-white text-zinc-900 py-3 text-sm font-semibold hover:bg-zinc-200 disabled:opacity-50 transition"
          >
            {loading ? "验证中…" : "进入后台"}
          </button>
        </form>
      </div>
    </>
  );
}

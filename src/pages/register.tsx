import { useState } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import Toast from "@/components/Toast";
import ErrorMessage from "@/components/ErrorMessage";
import Button from "@/components/Button";
import Head from "next/head";
import Link from "next/link";

export default function Register() {
  const { status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);

  if (status === "loading") return null;
  if (status === "authenticated") {
    if (typeof window !== "undefined") router.replace("/");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("邮箱格式不正确");
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setError("用户名为 3～20 位，仅字母、数字或下划线");
      return;
    }
    if (password.length < 6) {
      setError("密码至少 6 位");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password }),
    });
    setLoading(false);
    if (res.ok) {
      setToast({ message: "注册成功！正在跳转登录页…", type: "success" });
      setTimeout(() => router.push("/login"), 1500);
    } else {
      const data = await res.json();
      setToast({ message: data.message || "注册失败", type: "error" });
    }
  }

  return (
    <>
      <Head>
        <title>注册 | PixelNest</title>
      </Head>
      <Navbar />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="min-h-[85vh] flex items-center justify-center mx-4 sm:mx-auto">
        <form
          onSubmit={handleSubmit}
          className="max-w-md w-full p-8 bg-[var(--card)] text-[var(--card-foreground)] rounded-xl shadow-lg flex flex-col gap-5"
        >
          <h2 className="text-3xl font-bold mb-2 text-center">创建账号</h2>
          <ErrorMessage message={error} />
          <input
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
          />
          <input
            type="text"
            placeholder="用户名"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
          />
          <input
            type="password"
            placeholder="密码（至少 6 位）"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
          />
          <input
            type="password"
            placeholder="确认密码"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
          />
          <Button
            type="submit"
            loading={loading}
            success={!!toast && toast.type === "success"}
            successMessage="注册成功！"
            fullWidth
          >
            注册
          </Button>
          <div className="mt-4 text-center text-sm">
            已有账号？{" "}
            <Link href="/login" className="text-blue-600 hover:underline">
              点击登录
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}

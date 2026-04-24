import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Navbar from "@/components/Navbar";
import Toast from "@/components/Toast";
import Button from "@/components/Button";
import Head from "next/head";
import Link from "next/link";

export default function Login() {
  const { status } = useSession();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (router.query.toast) {
      setToast({ message: String(router.query.toast), type: "success" });
      router.replace("/login", undefined, { shallow: true });
    }
  }, [router.query.toast, router]);

  if (status === "loading") return null;
  if (status === "authenticated") {
    if (typeof window !== "undefined") router.replace("/");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier || !password) {
      setToast({ message: "请输入邮箱/用户名和密码。", type: "error" });
      return;
    }
    setLoading(true);
    const res = await signIn("credentials", {
      redirect: false,
      identifier,
      password,
    });
    setLoading(false);
    if (res?.error === "RATE_LIMIT") {
      setToast({ message: "登录尝试过于频繁，请稍后再试。", type: "error" });
    } else if (res?.ok) {
      window.sessionStorage.setItem("justLoggedIn", "1");
      const raw = router.query.callbackUrl;
      const nextPath =
        typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
      router.push(nextPath);
    } else {
      setToast({ message: "邮箱/用户名或密码错误", type: "error" });
    }
  }

  return (
    <>
      <Head>
        <title>登录 | ASTRAEUS</title>
      </Head>
      <Navbar />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="min-h-[85vh] flex items-center justify-center mx-4 sm:mx-auto">
        <form
          onSubmit={handleSubmit}
          className="max-w-md w-full p-8 bg-[var(--card)] text-[var(--card-foreground)] rounded-xl shadow-lg flex flex-col gap-5"
        >
          <h2 className="text-3xl font-bold mb-2 text-center">登录</h2>
          <input
            type="text"
            placeholder="邮箱或用户名"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            required
            className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
          />
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
          />
          <Button type="submit" loading={loading} fullWidth>
            登录
          </Button>
          <div className="mt-4 text-center text-sm">
            还没有账号？{" "}
            <Link href="/register" className="text-blue-600 hover:underline">
              点击注册
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Button from "@/components/Button";

export default function LoginModal({
  onClose,
  setToast,
  onLoginSuccess,
}: {
  onClose: () => void;
  setToast?: (toast: { message: string; type: "success" | "error" }) => void;
  onLoginSuccess?: () => void;
}) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", {
      redirect: false,
      identifier,
      password,
    });
    setLoading(false);
    if (res?.error === "RATE_LIMIT") {
      setToast?.({ message: "登录尝试过于频繁，请稍后再试。", type: "error" });
    } else if (res?.ok) {
      onClose();
      setToast?.({ message: "登录成功！", type: "success" });
      onLoginSuccess?.();
    } else {
      setToast?.({ message: "邮箱/用户名或密码错误", type: "error" });
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative bg-[var(--card)] text-[var(--card-foreground)] rounded-lg shadow-lg p-8 min-w-[320px]">
        {/* X Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-2xl font-bold leading-none w-8 h-8 flex items-center justify-center rounded-full text-foreground/50 hover:text-primary/80 hover:bg-foreground/20 focus:outline-none cursor-pointer transition-colors"
          aria-label="关闭"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4">需要登录</h2>
        <p className="mb-6">请先登录后再进行此操作。</p>
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="邮箱或用户名"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            required
            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
          <Button
            type="submit"
            loading={loading}
            fullWidth
            className="mt-2"
          >
            登录
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          还没有账号？{" "}
          <Link
            href="/register"
            className="text-blue-600 hover:underline"
            onClick={onClose}
          >
            点击注册
          </Link>
        </div>
      </div>
    </div>
  );
}
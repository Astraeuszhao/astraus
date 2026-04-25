import Head from "next/head";
import { signOutToLogin } from "@/utils/signOutToLogin";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import AppearanceSettings from "@/components/AppearanceSettings";
import Toast from "@/components/Toast";
import Navbar, { NavbarHandle } from "@/components/Navbar";
import { publicAssetUrl } from "@/utils/publicUrl";

type Profile = {
  email: string;
  username?: string;
  publicUid?: string | null;
  nickname?: string | null;
  avatar?: string | null;
  bio?: string | null;
};

export default function SettingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [newPwd2, setNewPwd2] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  const [deletePwd, setDeletePwd] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navbarRef = useRef<NavbarHandle>(null);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreviewUrl(null);
      return;
    }
    const u = URL.createObjectURL(avatarFile);
    setAvatarPreviewUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [avatarFile]);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    setProfileError(null);
    (async () => {
      try {
        const r = await fetch("/api/profile");
        const data = (await r.json().catch(() => ({}))) as Profile & { message?: string };
        if (cancelled) return;
        if (!r.ok) {
          setProfile(null);
          setProfileError(data.message || `加载失败（${r.status}）`);
          return;
        }
        if (!data?.email) {
          setProfile(null);
          setProfileError("资料数据无效，请重新登录");
          return;
        }
        setProfile(data);
        setNickname(data.nickname?.trim() || data.username || "");
        setBio(data.bio || "");
      } catch {
        if (!cancelled) {
          setProfile(null);
          setProfileError("网络错误，无法加载资料");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  const nicknameOk = nickname.trim().length >= 1 && nickname.trim().length <= 40;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nicknameOk) {
      setToast({ message: "请填写昵称（1～40 字）", type: "error" });
      return;
    }
    setSaving(true);
    const formData = new FormData();
    formData.append("nickname", nickname.trim());
    formData.append("bio", bio);
    if (avatarFile) formData.append("avatar", avatarFile);
    const res = await fetch("/api/profile", { method: "POST", body: formData });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
      setAvatarFile(null);
      setToast({ message: "已保存", type: "success" });
      navbarRef.current?.refetchAvatar();
    } else {
      const err = (await res.json().catch(() => ({}))) as { message?: string };
      setToast({ message: err.message || "保存失败", type: "error" });
    }
  }

  function onAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) {
      setToast({ message: "头像须为 JPG、PNG、GIF 或 WEBP", type: "error" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setToast({ message: "头像不能超过 2MB", type: "error" });
      return;
    }
    setAvatarFile(file);
  }

  if (status === "loading" || status === "unauthenticated") return null;
  if (profileError) {
    return (
      <>
        <Navbar ref={navbarRef} />
        <div className="max-w-md mx-auto mt-16 px-4 text-center space-y-4">
          <p className="text-[var(--destructive)]">{profileError}</p>
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--muted)]"
            onClick={() => router.reload()}
          >
            重试
          </button>
          <button
            type="button"
            className="block mx-auto text-sm text-[var(--primary)] underline-offset-2 hover:underline"
            onClick={() => void signOutToLogin("已清除登录状态，请重新登录或注册")}
          >
            返回登录
          </button>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Navbar ref={navbarRef} />
        <div className="max-w-md mx-auto mt-16 text-center text-[var(--muted-foreground)]">加载中…</div>
      </>
    );
  }

  const previewSrc = avatarPreviewUrl
    ? avatarPreviewUrl
    : profile.avatar
      ? `${publicAssetUrl(profile.avatar)}?t=${Date.now()}`
      : "/avatar.png";

  return (
    <>
      <Head>
        <title>个人设置 | Astraus</title>
      </Head>
      <Navbar ref={navbarRef} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="min-h-[calc(100vh-5rem)] bg-[var(--background)]">
        <main className="max-w-md mx-auto px-5 pb-16 pt-8">
          <h1 className="text-lg font-semibold text-center mb-8 text-[var(--foreground)]">个人设置</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center">
              <button
                type="button"
                className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => fileInputRef.current?.click()}
                aria-label="上传头像"
              >
                <div className="w-28 h-28 rounded-full overflow-hidden bg-neutral-900 dark:bg-neutral-800 ring-1 ring-black/10">
                  <Image
                    src={previewSrc}
                    alt="头像"
                    width={112}
                    height={112}
                    className="w-full h-full object-cover"
                    unoptimized={!!avatarPreviewUrl}
                  />
                </div>
                <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#2563eb] text-white text-lg font-light shadow-md border-2 border-white dark:border-[var(--card)]">
                  +
                </span>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatarPick} />
              <p className="mt-3 text-xs text-[var(--muted-foreground)]">{profile.email}</p>
            </div>

            <div>
              <label className="text-sm text-[var(--foreground)]">
                昵称<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3 text-[var(--card-foreground)] outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="你的昵称"
                maxLength={40}
                autoComplete="nickname"
              />
            </div>

            <div>
              <label className="text-sm text-[var(--foreground)]">用户编号</label>
              <input
                value={profile.publicUid || "生成中…"}
                readOnly
                className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--muted)] px-3 py-3 text-[var(--foreground)] outline-none tabular-nums"
              />
            </div>

            <div>
              <label className="text-sm text-[var(--foreground)]">个人简介</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3 text-[var(--card-foreground)] outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="可选，介绍一下你自己"
                maxLength={300}
              />
            </div>

            <button
              type="submit"
              disabled={saving || !nicknameOk}
              className="w-full rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-50 text-white font-semibold py-3.5 transition"
            >
              {saving ? "保存中…" : "完成"}
            </button>
          </form>

          <AppearanceSettings />

          <section className="mt-10 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">更改密码</h2>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="当前密码"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <input
              type="password"
              autoComplete="new-password"
              placeholder="新密码（6～128 位）"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <input
              type="password"
              autoComplete="new-password"
              placeholder="确认新密码"
              value={newPwd2}
              onChange={(e) => setNewPwd2(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <button
              type="button"
              disabled={pwdBusy}
              onClick={async () => {
                if (newPwd !== newPwd2) {
                  setToast({ message: "两次输入的新密码不一致", type: "error" });
                  return;
                }
                setPwdBusy(true);
                const res = await fetch("/api/account/change-password", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
                });
                const data = (await res.json().catch(() => ({}))) as { message?: string };
                setPwdBusy(false);
                if (res.ok) {
                  setCurrentPwd("");
                  setNewPwd("");
                  setNewPwd2("");
                  setToast({ message: data.message || "密码已更新", type: "success" });
                } else {
                  setToast({ message: data.message || "修改失败", type: "error" });
                }
              }}
              className="w-full rounded-xl bg-[var(--muted)] py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--border)] transition disabled:opacity-50"
            >
              {pwdBusy ? "提交中…" : "保存新密码"}
            </button>
          </section>

          <section className="mt-6 rounded-xl border border-red-200 dark:border-red-900/40 bg-[var(--card)] p-5 space-y-3">
            <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">注销账户</h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              将永久删除你的账户及所有作品、点赞等数据，且不可恢复。
            </p>
            <button
              type="button"
              onClick={() => {
                setDeletePwd("");
                setDeleteOpen(true);
              }}
              className="w-full rounded-xl border border-red-300 dark:border-red-800 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition"
            >
              注销账户…
            </button>
          </section>

          {deleteOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
              <div className="w-full max-w-sm rounded-2xl bg-[var(--card)] p-6 shadow-xl border border-[var(--border)]">
                <p className="text-sm font-medium text-[var(--foreground)] mb-2">确认注销</p>
                <p className="text-xs text-[var(--muted-foreground)] mb-4">
                  请输入登录密码以确认删除账户。
                </p>
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="密码"
                  value={deletePwd}
                  onChange={(e) => setDeletePwd(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-sm mb-4 outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={deleteBusy}
                    onClick={async () => {
                      setDeleteBusy(true);
                      const res = await fetch("/api/account/delete", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ password: deletePwd }),
                      });
                      const data = (await res.json().catch(() => ({}))) as { message?: string };
                      setDeleteBusy(false);
                      if (res.ok) {
                        setDeleteOpen(false);
                        await signOutToLogin(data.message || "账户已注销");
                      } else {
                        setToast({ message: data.message || "注销失败", type: "error" });
                      }
                    }}
                    className="flex-1 rounded-xl bg-red-600 text-white py-2.5 text-sm font-medium disabled:opacity-50"
                  >
                    {deleteBusy ? "处理中…" : "确认注销"}
                  </button>
                  <button
                    type="button"
                    disabled={deleteBusy}
                    onClick={() => setDeleteOpen(false)}
                    className="flex-1 rounded-xl border border-[var(--border)] py-2.5 text-sm"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}

          <section className="mt-10 space-y-3">
            <Link
              href="/about"
              className="flex items-center justify-center w-full rounded-xl border border-[var(--border)] bg-[var(--card)] py-3 text-sm font-medium text-[var(--card-foreground)] hover:bg-[var(--muted)] transition"
            >
              关于我们
            </Link>
            <button
              type="button"
              disabled={loggingOut}
              onClick={async () => {
                setLoggingOut(true);
                await signOutToLogin();
              }}
              className="w-full rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 bg-[var(--card)] py-3 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30 transition disabled:opacity-50"
            >
              {loggingOut ? "退出中…" : "退出登录"}
            </button>
          </section>
        </main>
      </div>
    </>
  );
}

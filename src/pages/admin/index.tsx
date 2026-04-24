import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { GALLERY_TAG_LABELS } from "@/constants/galleryFilters";
import { publicAssetUrl } from "@/utils/publicUrl";

type AdminUser = {
  id: string;
  email: string;
  username: string;
  nickname: string | null;
  publicUid: string | null;
  avatar: string | null;
  followerCount: number;
  muted: boolean;
  _count: { images: number };
};

type AdminImage = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  url: string;
  likeCount: number;
  userId: string;
  user: { id: string; username: string; nickname: string | null; email: string };
};

type Tab = "overview" | "posts" | "accounts";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [images, setImages] = useState<AdminImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [editImage, setEditImage] = useState<AdminImage | null>(null);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);

  const showBanner = useCallback((text: string, type: "ok" | "err" = "ok") => {
    setBanner({ text, type });
    setTimeout(() => setBanner(null), 4000);
  }, []);

  const refreshUsers = useCallback(async () => {
    const r = await fetch("/api/admin/users", { credentials: "include" });
    if (r.status === 401) {
      await router.replace("/admin/login");
      return;
    }
    const data = (await r.json()) as { users?: AdminUser[] };
    setUsers(data.users || []);
  }, [router]);

  const refreshImages = useCallback(async () => {
    const r = await fetch("/api/admin/images", { credentials: "include" });
    if (r.status === 401) {
      await router.replace("/admin/login");
      return;
    }
    const data = (await r.json()) as { images?: AdminImage[] };
    setImages(data.images || []);
  }, [router]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([refreshUsers(), refreshImages()]);
    setLoading(false);
  }, [refreshUsers, refreshImages]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const imagesByUser = useMemo(() => {
    const m = new Map<string, AdminImage[]>();
    for (const img of images) {
      const list = m.get(img.userId) || [];
      list.push(img);
      m.set(img.userId, list);
    }
    return m;
  }, [images]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === users.length) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(users.map((u) => u.id)));
  }

  async function batchAction(action: "mute" | "unmute" | "delete") {
    if (selected.size === 0) {
      showBanner("请先勾选用户", "err");
      return;
    }
    if (action === "delete" && !window.confirm(`确定删除选中的 ${selected.size} 个账户？`)) return;
    const r = await fetch("/api/admin/users/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ids: [...selected], action }),
    });
    const data = (await r.json().catch(() => ({}))) as { message?: string };
    if (!r.ok) {
      showBanner(data.message || "操作失败", "err");
      return;
    }
    showBanner(data.message || "完成");
    setSelected(new Set());
    await loadAll();
  }

  async function adminLogout() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    await router.replace("/admin/login");
  }

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-400 flex items-center justify-center text-sm">
        加载中…
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>ASTRAEUS · 后台</title>
      </Head>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-16">
        <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-white">ASTRAEUS</h1>
            <p className="text-xs text-zinc-500">管理控制台</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadAll()}
              className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              刷新
            </button>
            <button
              type="button"
              onClick={() => void adminLogout()}
              className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
            >
              退出后台
            </button>
          </div>
        </header>

        {banner ? (
          <div
            className={`mx-4 mt-3 text-sm px-3 py-2 rounded-lg ${
              banner.type === "ok" ? "bg-emerald-950 text-emerald-200" : "bg-red-950 text-red-200"
            }`}
          >
            {banner.text}
          </div>
        ) : null}

        <nav className="flex gap-1 px-4 mt-4 border-b border-zinc-800">
          {(
            [
              ["overview", "统一管理"],
              ["posts", "帖子管理"],
              ["accounts", "账户管理"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
                tab === k
                  ? "border-white text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <main className="px-4 mt-6 max-w-[120rem] mx-auto overflow-x-auto">
          {tab === "overview" && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void batchAction("mute")}
                  className="text-xs px-3 py-1.5 rounded-lg bg-amber-900/50 text-amber-200 border border-amber-800"
                >
                  批量禁言
                </button>
                <button
                  type="button"
                  onClick={() => void batchAction("unmute")}
                  className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 border border-zinc-700"
                >
                  批量解禁
                </button>
                <button
                  type="button"
                  onClick={() => void batchAction("delete")}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-950 text-red-200 border border-red-900"
                >
                  批量删除账户
                </button>
              </div>
              <table className="w-full text-sm border border-zinc-800 rounded-lg overflow-hidden">
                <thead className="bg-zinc-900 text-zinc-400">
                  <tr>
                    <th className="p-2 w-10">
                      <input
                        type="checkbox"
                        checked={users.length > 0 && selected.size === users.length}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="text-left p-2">用户</th>
                    <th className="text-left p-2">邮箱</th>
                    <th className="text-right p-2">粉丝</th>
                    <th className="text-right p-2">作品</th>
                    <th className="text-center p-2">禁言</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-zinc-800 hover:bg-zinc-900/50">
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={selected.has(u.id)}
                          onChange={() => toggleSelect(u.id)}
                        />
                      </td>
                      <td className="p-2 text-white">
                        {u.nickname || u.username}
                        <span className="text-zinc-500 ml-1">@{u.username}</span>
                      </td>
                      <td className="p-2 text-zinc-400">{u.email}</td>
                      <td className="p-2 text-right tabular-nums">{u.followerCount}</td>
                      <td className="p-2 text-right tabular-nums">{u._count.images}</td>
                      <td className="p-2 text-center">{u.muted ? "是" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "posts" && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-500">点击用户行展开作品列表，可编辑标题、介绍、标签、点赞数或删除。</p>
              <table className="w-full text-sm border border-zinc-800 rounded-lg overflow-hidden">
                <thead className="bg-zinc-900 text-zinc-400">
                  <tr>
                    <th className="text-left p-2">用户</th>
                    <th className="text-right p-2">作品数</th>
                    <th className="text-left p-2">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const list = imagesByUser.get(u.id) || [];
                    const open = expandedUserId === u.id;
                    return (
                      <Fragment key={u.id}>
                        <tr className="border-t border-zinc-800 align-top">
                          <td className="p-2">
                            <button
                              type="button"
                              onClick={() => setExpandedUserId(open ? null : u.id)}
                              className="text-left text-white hover:underline"
                            >
                              {open ? "▼ " : "▶ "}
                              {u.nickname || u.username}{" "}
                              <span className="text-zinc-500">@{u.username}</span>
                            </button>
                          </td>
                          <td className="p-2 text-right tabular-nums">{list.length}</td>
                          <td className="p-2 text-zinc-500 text-xs">展开查看</td>
                        </tr>
                        {open ? (
                          <tr className="bg-zinc-900/30">
                            <td colSpan={3} className="p-0">
                              <div className="p-3 space-y-2">
                                {list.length === 0 ? (
                                  <p className="text-zinc-500 text-xs">暂无作品</p>
                                ) : (
                                  list.map((img) => (
                                    <div
                                      key={img.id}
                                      className="flex flex-wrap gap-3 items-center border border-zinc-800 rounded-lg p-2"
                                    >
                                      <div className="relative w-20 h-14 shrink-0 rounded overflow-hidden bg-zinc-800">
                                        <Image
                                          src={publicAssetUrl(img.url) || "/avatar.png"}
                                          alt=""
                                          fill
                                          className="object-cover"
                                          unoptimized
                                        />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-white text-xs font-medium truncate">{img.title}</p>
                                        <p className="text-zinc-500 text-xs truncate">
                                          ♥ {img.likeCount} · {img.tags.join("、") || "无标签"}
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setEditImage(img)}
                                        className="text-xs px-2 py-1 rounded border border-zinc-600 text-zinc-300"
                                      >
                                        编辑
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {tab === "accounts" && (
            <table className="w-full text-sm border border-zinc-800 rounded-lg overflow-hidden">
              <thead className="bg-zinc-900 text-zinc-400">
                <tr>
                  <th className="text-left p-2">头像</th>
                  <th className="text-left p-2">用户</th>
                  <th className="text-right p-2">粉丝</th>
                  <th className="text-center p-2">禁言</th>
                  <th className="text-left p-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-zinc-800">
                    <td className="p-2">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-800">
                        <Image
                          src={publicAssetUrl(u.avatar) || "/avatar.png"}
                          alt=""
                          width={40}
                          height={40}
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    </td>
                    <td className="p-2 text-white">
                      {u.nickname || u.username}
                      <span className="text-zinc-500 block text-xs">{u.email}</span>
                    </td>
                    <td className="p-2 text-right tabular-nums">{u.followerCount}</td>
                    <td className="p-2 text-center">{u.muted ? "是" : "—"}</td>
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => setEditUser(u)}
                        className="text-xs px-2 py-1 rounded border border-zinc-600 text-zinc-300"
                      >
                        管理账户
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </main>
      </div>

      {editImage ? (
        <ImageEditModal
          image={editImage}
          onClose={() => setEditImage(null)}
          onSaved={async () => {
            setEditImage(null);
            await loadAll();
            showBanner("已保存帖子");
          }}
          onDeleted={async () => {
            setEditImage(null);
            await loadAll();
            showBanner("已删除帖子");
          }}
          showBanner={showBanner}
        />
      ) : null}

      {editUser ? (
        <UserEditModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={async () => {
            setEditUser(null);
            await loadAll();
            showBanner("已保存账户");
          }}
          onDeleted={async () => {
            setEditUser(null);
            await loadAll();
            showBanner("已删除账户");
          }}
          showBanner={showBanner}
        />
      ) : null}
    </>
  );
}

function ImageEditModal({
  image,
  onClose,
  onSaved,
  onDeleted,
  showBanner,
}: {
  image: AdminImage;
  onClose: () => void;
  onSaved: () => Promise<void>;
  onDeleted: () => Promise<void>;
  showBanner: (t: string, type?: "ok" | "err") => void;
}) {
  const [title, setTitle] = useState(image.title);
  const [description, setDescription] = useState(image.description);
  const [likeCount, setLikeCount] = useState(String(image.likeCount));
  const [tags, setTags] = useState<string[]>(image.tags || []);
  const [busy, setBusy] = useState(false);

  function toggleTag(t: string) {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t].slice(0, 8)));
  }

  async function save() {
    setBusy(true);
    const n = parseInt(likeCount, 10);
    const r = await fetch(`/api/admin/images/${encodeURIComponent(image.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim(),
        tags,
        likeCount: Number.isFinite(n) ? n : image.likeCount,
      }),
    });
    const data = (await r.json().catch(() => ({}))) as { message?: string };
    setBusy(false);
    if (!r.ok) {
      showBanner(data.message || "保存失败", "err");
      return;
    }
    await onSaved();
  }

  async function del() {
    if (!window.confirm("确定删除该帖子？")) return;
    setBusy(true);
    const r = await fetch(`/api/admin/images/${encodeURIComponent(image.id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    setBusy(false);
    if (!r.ok) {
      const data = (await r.json().catch(() => ({}))) as { message?: string };
      showBanner(data.message || "删除失败", "err");
      return;
    }
    await onDeleted();
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-700 p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-white font-semibold mb-4">编辑帖子</h3>
        <div className="space-y-3 text-sm">
          <label className="block text-zinc-400 text-xs">标题</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-white"
          />
          <label className="block text-zinc-400 text-xs">介绍</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-white"
          />
          <label className="block text-zinc-400 text-xs">点赞数</label>
          <input
            type="number"
            min={0}
            value={likeCount}
            onChange={(e) => setLikeCount(e.target.value)}
            className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-white"
          />
          <div>
            <p className="text-zinc-400 text-xs mb-2">标签（画廊白名单）</p>
            <div className="flex flex-wrap gap-2">
              {GALLERY_TAG_LABELS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={`text-xs px-2 py-1 rounded-full border ${
                    tags.includes(t)
                      ? "bg-white text-zinc-900 border-white"
                      : "border-zinc-600 text-zinc-400"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-6">
          <button
            type="button"
            disabled={busy}
            onClick={() => void save()}
            className="flex-1 min-w-[6rem] rounded-lg bg-white text-zinc-900 py-2 text-sm font-medium disabled:opacity-50"
          >
            保存
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void del()}
            className="rounded-lg border border-red-800 text-red-300 px-4 py-2 text-sm disabled:opacity-50"
          >
            删除帖子
          </button>
          <button type="button" onClick={onClose} className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300">
            取消
          </button>
        </div>
      </div>
    </div>
  );
}

function UserEditModal({
  user,
  onClose,
  onSaved,
  onDeleted,
  showBanner,
}: {
  user: AdminUser;
  onClose: () => void;
  onSaved: () => Promise<void>;
  onDeleted: () => Promise<void>;
  showBanner: (t: string, type?: "ok" | "err") => void;
}) {
  const [nickname, setNickname] = useState(user.nickname?.trim() || user.username);
  const [followerCount, setFollowerCount] = useState(String(user.followerCount));
  const [muted, setMuted] = useState(user.muted);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const fc = parseInt(followerCount, 10);
    const r = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        nickname: nickname.trim(),
        followerCount: Number.isFinite(fc) ? fc : user.followerCount,
        muted,
      }),
    });
    const data = (await r.json().catch(() => ({}))) as { message?: string };
    setBusy(false);
    if (!r.ok) {
      showBanner(data.message || "保存失败", "err");
      return;
    }
    await onSaved();
  }

  async function clearAvatar() {
    setBusy(true);
    const r = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ clearAvatar: true }),
    });
    setBusy(false);
    if (!r.ok) {
      const data = (await r.json().catch(() => ({}))) as { message?: string };
      showBanner(data.message || "失败", "err");
      return;
    }
    await onSaved();
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("avatar", file);
    const r = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}/avatar`, {
      method: "POST",
      body: fd,
      credentials: "include",
    });
    setBusy(false);
    e.target.value = "";
    if (!r.ok) {
      const data = (await r.json().catch(() => ({}))) as { message?: string };
      showBanner(data.message || "上传失败", "err");
      return;
    }
    await onSaved();
  }

  async function delUser() {
    if (!window.confirm("确定注销该用户及其全部作品？")) return;
    setBusy(true);
    const r = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    setBusy(false);
    if (!r.ok) {
      const data = (await r.json().catch(() => ({}))) as { message?: string };
      showBanner(data.message || "删除失败", "err");
      return;
    }
    await onDeleted();
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-700 p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-white font-semibold mb-4">账户管理 · {user.username}</h3>
        <div className="space-y-3 text-sm">
          <label className="block text-zinc-400 text-xs">显示名（昵称）</label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-white"
          />
          <label className="block text-zinc-400 text-xs">粉丝数</label>
          <input
            type="number"
            min={0}
            value={followerCount}
            onChange={(e) => setFollowerCount(e.target.value)}
            className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-white"
          />
          <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
            <input type="checkbox" checked={muted} onChange={(e) => setMuted(e.target.checked)} />
            禁言（无法上传、点赞）
          </label>
          <div className="pt-2 border-t border-zinc-800 space-y-2">
            <p className="text-zinc-500 text-xs">头像</p>
            <div className="flex flex-wrap gap-2">
              <label className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-600 cursor-pointer">
                上传新头像
                <input type="file" accept="image/*" className="hidden" onChange={(e) => void uploadAvatar(e)} />
              </label>
              <button
                type="button"
                disabled={busy}
                onClick={() => void clearAvatar()}
                className="text-xs px-3 py-1.5 rounded-lg border border-zinc-600 text-zinc-300"
              >
                恢复默认头像
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 mt-6">
          <button
            type="button"
            disabled={busy}
            onClick={() => void save()}
            className="w-full rounded-lg bg-white text-zinc-900 py-2 text-sm font-medium disabled:opacity-50"
          >
            保存修改
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void delUser()}
            className="w-full rounded-lg border border-red-800 text-red-300 py-2 text-sm disabled:opacity-50"
          >
            注销该账户
          </button>
          <button type="button" onClick={onClose} className="w-full rounded-lg border border-zinc-600 py-2 text-sm text-zinc-300">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

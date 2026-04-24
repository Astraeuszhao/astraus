import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import Navbar from "@/components/Navbar";
import GallerySearchField from "@/components/GallerySearchField";
import { GALLERY_CATEGORY_FILTERS } from "@/constants/galleryFilters";
import Modal from "@/components/Modal";
import ConfirmModal from "@/components/ConfirmModal";
import { useSession } from "next-auth/react";
import GalleryCard, { GalleryCardHandle } from "@/components/GalleryCard";
import TagChipsPicker from "@/components/TagChipsPicker";
import Toast from "@/components/Toast";
import GalleryCardSkeleton from "@/components/GalleryCardSkeleton";
import LikeButton from "@/components/LikeButton";
import Link from "next/link";
import Button from "@/components/Button";
import Head from "next/head";
import { useLike } from "@/context/LikeContext";
import { publicAssetUrl } from "@/utils/publicUrl";

type ImageType = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  url: string;
  createdAt: string;
  user: { id: string; email: string; username: string; avatar?: string | null };
  likeCount: number;
  liked: boolean;
};

function normalizePublicImages(raw: unknown): ImageType[] {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map((item) => {
    const img = item as Partial<ImageType>;
    return {
      ...img,
      tags: Array.isArray(img.tags) ? img.tags : [],
      likeCount: typeof img.likeCount === "number" ? img.likeCount : 0,
      liked: Boolean(img.liked),
    } as ImageType;
  });
}

export default function PublicGallery() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const qParam = router.isReady && typeof router.query.q === "string" ? router.query.q : "";
  const catParam = router.isReady && typeof router.query.cat === "string" ? router.query.cat : "";
  const [searchDraft, setSearchDraft] = useState("");
  const [images, setImages] = useState<ImageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ImageType | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const cardRefs = useRef<{ [id: string]: GalleryCardHandle | null }>({});
  const [updateLoading, setUpdateLoading] = useState(false);
  const [, setDeleteLoadingId] = useState<string | null>(null);
  const { setVisibleImageIds } = useLike();

  useLayoutEffect(() => {
    if (!router.isReady) return;
    setPage(1);
  }, [router.isReady, qParam, catParam]);

  useEffect(() => {
    if (!router.isReady) return;
    setSearchDraft(qParam);
  }, [router.isReady, qParam]);

  const activeCat = catParam;

  /** patch.cat === null 清除分类；undefined 沿用当前路由 */
  function pushHomeQuery(patch: { q?: string | null; cat?: string | null }) {
    const qVal =
      patch.q !== undefined && patch.q !== null
        ? patch.q
        : typeof router.query.q === "string"
          ? router.query.q
          : "";
    let catVal = "";
    if (patch.cat === null) catVal = "";
    else if (patch.cat !== undefined && patch.cat !== null) catVal = patch.cat;
    else if (typeof router.query.cat === "string") catVal = router.query.cat;

    const q: Record<string, string> = {};
    if (qVal) q.q = qVal;
    if (catVal) q.cat = catVal;
    router.push({ pathname: "/", query: q }, undefined, { shallow: true });
  }

  function submitSearch(e: FormEvent) {
    e.preventDefault();
    const q = searchDraft.trim();
    const cat = typeof router.query.cat === "string" ? router.query.cat : "";
    const query: Record<string, string> = {};
    if (q) query.q = q;
    if (cat) query.cat = cat;
    router.push({ pathname: "/", query }, undefined, { shallow: true });
  }

  useEffect(() => {
    if (!router.isReady) return;
    let cancelled = false;
    const qs = (p: number) => {
      const x = new URLSearchParams({ page: String(p), limit: "12" });
      if (qParam) x.set("q", qParam);
      if (catParam) x.set("cat", catParam);
      return x.toString();
    };
    if (page === 1) {
      setLoading(true);
      fetch(`/api/public-gallery?${qs(1)}`)
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            if (!cancelled) {
              setToast({ message: (data as { message?: string }).message || "加载画廊失败。", type: "error" });
              setImages([]);
              setHasMore(false);
            }
            return;
          }
          const data = await res.json();
          if (!cancelled) {
            setImages(normalizePublicImages(data.images));
            setHasMore(data.page < data.totalPages);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setToast({ message: "网络错误，无法加载画廊。", type: "error" });
            setImages([]);
            setHasMore(false);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    } else {
      setLoadingMore(true);
      fetch(`/api/public-gallery?${qs(page)}`)
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            if (!cancelled) setToast({ message: (data as { message?: string }).message || "加载更多图片失败。", type: "error" });
            return;
          }
          const data = await res.json();
          if (!cancelled) {
            setImages((prev) => [...prev, ...normalizePublicImages(data.images)]);
            setHasMore(data.page < data.totalPages);
          }
        })
        .catch(() => {
          if (!cancelled) setToast({ message: "网络错误，无法加载更多图片。", type: "error" });
        })
        .finally(() => {
          if (!cancelled) setLoadingMore(false);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [router.isReady, page, qParam, catParam]);

  useEffect(() => {
    setVisibleImageIds(images.map(img => img.id));
  }, [images, setVisibleImageIds]);

  useEffect(() => {
    if (typeof window !== "undefined" && status === "authenticated") {
      if (window.sessionStorage.getItem("justLoggedIn")) {
        setToast({ message: "登录成功！", type: "success" });
        window.sessionStorage.removeItem("justLoggedIn");
      }
    }
  }, [status]);

  async function handleDelete(id: string) {
    setDeleteLoadingId(id);
    const res = await fetch("/api/delete-image", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    setDeleteLoadingId(null);
    if (res.ok) {
      setImages(images => images.filter(img => img.id !== id));
      setSelectedImage(null);
      setToast({ message: data.message || "图片已删除", type: "success" });
    } else {
      setToast({ message: data.message || "删除图片失败。", type: "error" });
    }
  }

  async function handleUpdate(id: string, title: string, description: string, tags: string[]) {
    setUpdateLoading(true);
    const res = await fetch("/api/update-image", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title, description, tags }),
    });
    const data = await res.json();
    setUpdateLoading(false);
    if (res.ok) {
      setImages(images => images.map(img => img.id === id ? { ...img, title, description, tags } : img));
      setEditingId(null);
      setSelectedImage(img => img && img.id === id ? { ...img, title, description, tags } : img);
      setToast({ message: data.message || "图片已更新", type: "success" });
    } else {
      setToast({ message: data.message || "更新图片失败。", type: "error" });
    }
  }

  return (
    <>
      <Head>
        <title>首页 | ASTRAEUS</title>
      </Head>
      <Navbar />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="max-w-[90rem] w-full md:mx-4 lg:mx-auto mt-8 px-0">
        <h2 className="text-2xl font-bold mb-2 mx-4 sm:mx-auto">公开画廊</h2>
        <p className="mb-4 mx-4 sm:mx-auto text-bg text-base">
          在 ASTRAEUS 发现与分享你喜欢的瞬间！
        </p>

        <div className="mx-4 sm:mx-auto mb-8 flex flex-col items-stretch sm:items-center gap-4">
          <GallerySearchField
            value={searchDraft}
            onChange={setSearchDraft}
            onSubmit={submitSearch}
            placeholder="搜索标题或描述…"
            className="sm:mx-auto"
          />
          <div className="flex w-full max-w-[90rem] gap-2 overflow-x-auto pb-1 scrollbar-thin justify-start lg:justify-center">
            <button
              type="button"
              onClick={() => pushHomeQuery({ cat: null })}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium border transition ${
                !activeCat
                  ? "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]"
                  : "border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]"
              }`}
            >
              全部
            </button>
            {GALLERY_CATEGORY_FILTERS.map(({ label }) => (
              <button
                key={label}
                type="button"
                onClick={() => pushHomeQuery({ cat: label })}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium border transition ${
                  activeCat === label
                    ? "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]"
                    : "border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 mb-4 mx-4 sm:mx-auto">
          {loading
            ? Array.from({ length: 10 }).map((_, i) => <GalleryCardSkeleton key={i} />)
            : images.map(img => (
                <GalleryCard
                  ref={el => { cardRefs.current[img.id] = el; }}
                  key={img.id}
                  image={img}
                  onClick={() => setSelectedImage(img)}
                  setToast={setToast}
                />
              ))}
        </div>
        {/* Load More button */}
        {hasMore && !loadingMore && !loading && (
          <div className="flex justify-center my-6">
            <Button
              onClick={() => setPage(p => p + 1)}
              variant="primary"
              className="px-6"
              disabled={loadingMore}
              loading={loadingMore}
            >
              加载更多
            </Button>
          </div>
        )}
        {loadingMore && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 mb-4 mx-4 sm:mx-auto">
            {Array.from({ length: 5 }).map((_, i) => (
              <GalleryCardSkeleton key={i} />
            ))}
          </div>
        )}
        {/* End of gallery message */}
        {!hasMore && images.length > 0 && !loading && (
          <p className="text-center text-gray-500 my-6">已经到底啦</p>
        )}
        {images.length === 0 && !loading && <p className="mt-4 text-gray-500">还没有人上传图片。</p>}
      </div>

      <Modal open={!!selectedImage} onClose={() => setSelectedImage(null)} size="2xl">
        {selectedImage && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Link
                href={`/user/${selectedImage.user.username}`}
                className="flex items-center gap-2 group outline-none transition"
                tabIndex={0}
                aria-label={`前往 @${selectedImage.user.username} 的主页`}
              >
                <Image
                  src={publicAssetUrl(selectedImage.user.avatar) || "/avatar.png"}
                  alt="用户头像"
                  width={32}
                  height={32}
                  className="rounded-full aspect-square object-cover border group-hover:ring-2 group-hover:ring-[var(--primary)] transition"
                />
                <span className="font-semibold text-[var(--primary)] group-hover:underline">
                  @{selectedImage.user.username}
                </span>
              </Link>
            </div>
            <Image
              src={publicAssetUrl(selectedImage.url)}
              alt={selectedImage.title}
              width={500}
              height={300}
              className="w-full h-auto rounded mb-4"
              priority={false}
            />
            <div className="flex items-start justify-between mt-4 mb-2">
              <div className="min-w-0 max-w-[70%]">
                <h2 className="text-xl font-bold">{selectedImage.title}</h2>
                <p className="text-gray-600 mt-2">{selectedImage.description}</p>
                {selectedImage.tags.length > 0 && (
                  <p className="text-sm mt-2 text-[rgba(234,76,137,0.95)]">
                    {selectedImage.tags.map((t) => `#${t}`).join(" ")}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(selectedImage.createdAt).toLocaleString("zh-CN")}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 ml-2">
                <LikeButton
                  imageId={selectedImage.id}
                  initialLiked={selectedImage.liked}
                  initialCount={selectedImage.likeCount}
                  onLike={() => {
                    cardRefs.current[selectedImage.id]?.refetchLikeState();
                  }}
                  setToast={setToast}
                />
                {session?.user?.email === selectedImage.user.email && editingId !== selectedImage.id && (
                  <div className="flex gap-2 mt-2">
                    <Button
                      onClick={() => {
                        setEditingId(selectedImage.id);
                        setEditTitle(selectedImage.title);
                        setEditDescription(selectedImage.description);
                        setEditTags([...selectedImage.tags]);
                      }}
                      variant="outline"
                      className="font-semibold"
                    >
                      编辑
                    </Button>
                    <Button
                      onClick={() => {
                        setDeleteId(selectedImage.id);
                        setShowConfirm(true);
                      }}
                      variant="outline"
                      className="font-semibold"
                    >
                      删除
                    </Button>
                  </div>
                )}
              </div>
            </div>
            {/* Edit form below the image/content, full width */}
            {editingId === selectedImage.id && (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleUpdate(selectedImage.id, editTitle, editDescription, editTags);
                }}
                className="flex flex-col gap-3 mt-4"
              >
                <input
                  value={editTitle}
                  aria-label="编辑标题"
                  onChange={e => setEditTitle(e.target.value)}
                  className="border p-2 rounded"
                />
                <textarea
                  value={editDescription}
                  aria-label="编辑描述"
                  onChange={e => setEditDescription(e.target.value)}
                  className="border p-2 rounded"
                />
                <TagChipsPicker value={editTags} onChange={setEditTags} />
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    loading={updateLoading}
                    variant="primary"
                  >
                    保存
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setEditingId(null)}
                    disabled={loading}
                    variant="secondary"
                  >
                    取消
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
          onConfirm={async () => {
            if (deleteId) await handleDelete(deleteId);
          }}
        title="删除图片"
        description="确定要删除这张图片吗？此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        type="danger"
      />
    </>
  );
}
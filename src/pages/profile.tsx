import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";
import Navbar, { NavbarHandle } from "@/components/Navbar";
import Image from "next/image";
import Modal from "@/components/Modal";
import GalleryCard, { GalleryCardHandle } from "@/components/GalleryCard";
import TagChipsPicker from "@/components/TagChipsPicker";
import ConfirmModal from "@/components/ConfirmModal";
import Toast from "@/components/Toast";
import GalleryCardSkeleton from "@/components/GalleryCardSkeleton";
import ProfileSectionSkeleton from "@/components/ProfileSectionSkeleton";
import LikeButton from "@/components/LikeButton";
import Button from "@/components/Button";
import Head from "next/head";
import { publicAssetUrl } from "@/utils/publicUrl";
import { signOutToLogin } from "@/utils/signOutToLogin";

type Profile = {
  email: string;
  username?: string;
  avatar?: string;
  bio?: string;
};

type ImageType = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  url: string;
  createdAt: string;
  likeCount: number;
  liked: boolean;
};

export default function ProfilePage() {
  const { status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);
  const [images, setImages] = useState<ImageType[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageType | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, ] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const cardRefs = useRef<{ [id: string]: GalleryCardHandle | null }>({});
  const navbarRef = useRef<NavbarHandle>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }

    if (status === "authenticated") {
      setProfileLoadError(null);
      fetch("/api/profile")
        .then(async (res) => {
          const data = (await res.json().catch(() => ({}))) as Profile & { message?: string };
          if (!res.ok || !data?.email) {
            setProfileLoadError(data.message || `加载资料失败（${res.status}）`);
            return;
          }
          setProfile(data);
        })
        .catch(() => setProfileLoadError("网络错误，无法加载资料"));

      setGalleryLoading(true);
      fetch("/api/gallery?page=1&limit=12")
        .then(async res => {
          if (!res.ok) {
            const data = await res.json();
            setToast({ message: data.message || "加载画廊失败。", type: "error" });
            setImages([]);
            setHasMore(false);
            setGalleryLoading(false);
            return;
          }
          const data = await res.json();
          const raw = (data.images || []) as Partial<ImageType>[];
          setImages(
            raw.map((img) => ({
              ...img,
              tags: Array.isArray(img.tags) ? img.tags : [],
              likeCount: typeof img.likeCount === "number" ? img.likeCount : 0,
              liked: Boolean(img.liked),
            })) as ImageType[],
          );
          setHasMore(data.page < data.totalPages);
          setGalleryLoading(false);
        })
        .catch(() => {
          setToast({ message: "网络错误，无法加载画廊。", type: "error" });
          setImages([]);
          setHasMore(false);
          setGalleryLoading(false);
        });
    }
  }, [status, router]);

  // Fetch follower count for the logged-in user
  useEffect(() => {
    if (status === "authenticated" && profile?.username) {
      fetch(`/api/user/${encodeURIComponent(profile.username)}/follow`)
        .then(res => res.json())
        .then(data => setFollowerCount(data.count))
        .catch(() => setFollowerCount(0));
    }
  }, [status, profile?.username]);

  useEffect(() => {
    if (page === 1) return;
    setLoadingMore(true);
    fetch(`/api/gallery?page=${page}&limit=12`)
      .then(async res => {
        if (!res.ok) {
          const data = await res.json();
          setToast({ message: data.message || "加载更多图片失败。", type: "error" });
          setLoadingMore(false);
          return;
        }
        const data = await res.json();
        const raw = (data.images || []) as Partial<ImageType>[];
        const mapped = raw.map((img) => ({
          ...img,
          tags: Array.isArray(img.tags) ? img.tags : [],
          likeCount: typeof img.likeCount === "number" ? img.likeCount : 0,
          liked: Boolean(img.liked),
        })) as ImageType[];
        setImages((prev) => [...prev, ...mapped]);
        setHasMore(page < data.totalPages);
        setLoadingMore(false);
      })
      .catch(() => {
        setToast({ message: "网络错误，无法加载更多图片。", type: "error" });
        setLoadingMore(false);
      });
  }, [page]);

  async function confirmDelete() {
    if (!deleteId) return;
    const res = await fetch("/api/delete-image", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteId }),
    });
    const data = await res.json();
    if (res.ok) {
      setImages(images => images.filter(img => img.id !== deleteId));
      setSelectedImage(null);
      setToast({ message: data.message || "图片已删除", type: "success" });
    } else {
      setToast({ message: data.message || "删除图片失败。", type: "error" });
    }
    setShowConfirm(false);
    setDeleteId(null);
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

  if (status === "loading" || status === "unauthenticated") return null;

  if (profileLoadError) {
    return (
      <>
        <Navbar />
        <div className="max-w-md mx-auto mt-16 px-4 text-center space-y-4">
          <p className="text-[var(--destructive)]">{profileLoadError}</p>
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
        <Navbar />
        <div className="max-w-md mx-4 sm:mx-auto mt-8">
          <ProfileSectionSkeleton />
        </div>
        <div className="max-w-[90rem] mx-auto mt-8 px-4">
          <h2 className="text-2xl font-bold mb-4 text-center">我的画廊</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:mx-auto">
            {Array.from({ length: 8 }).map((_, i) => (
              <GalleryCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
    <Head>
        <title>我的资料 | PixelNest</title>
    </Head>
      <Navbar ref={navbarRef} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-[90rem] mx-auto mt-8 px-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[var(--foreground)]">我的画廊</h2>
            {profile.username && (
              <p className="text-[var(--muted-foreground)] text-sm mt-1">{followerCount} 位粉丝</p>
            )}
          </div>
          <Link
            href="/settings"
            className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--primary)] hover:bg-[var(--muted)] transition w-fit"
          >
            个人设置
          </Link>
        </div>
        {galleryLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <GalleryCardSkeleton key={i} />
            ))}
          </div>
        ) : images.length === 0 && !loadingMore ? (
          <p className="mt-4 text-[var(--muted-foreground)] text-center">你还没有上传图片。</p>
        ) : null}
        {images.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
              {images.map(img => (
                <GalleryCard
                  key={img.id}
                  ref={el => { cardRefs.current[img.id] = el; }}
                  image={img}
                  onClick={() => setSelectedImage(img)}
                  setToast={setToast}
                />
              ))}
            </div>
            {/* Only show Load More after initial images are loaded */}
            {profile && images.length > 0 && hasMore && !loadingMore && (
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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 my-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <GalleryCardSkeleton key={i} />
                ))}
              </div>
            )}
            {!hasMore && images.length > 0 && (
              <p className="text-center text-[var(--muted-foreground)] my-6">已经到底啦</p>
            )}
          </>
        )}
      </div>

      <Modal open={!!selectedImage} onClose={() => { setSelectedImage(null); setEditingId(null); }} size="2xl">
        {selectedImage && (
          <div>
            <Image
              src={publicAssetUrl(selectedImage.url)}
              alt={selectedImage.title}
              width={500}
              height={300}
              className="w-full h-auto rounded mb-4"
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
                    cardRefs.current[selectedImage.id]?.refetchLikeState?.();
                  }}
                  setToast={setToast}
                />
                {editingId !== selectedImage.id && (
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
        onClose={() => { setShowConfirm(false); setDeleteId(null); }}
        onConfirm={confirmDelete}
        title="删除图片"
        description="确定要删除这张图片吗？此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        type="danger"
      />
    </>
  );
}
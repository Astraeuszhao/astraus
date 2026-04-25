import { GetServerSideProps } from "next";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import GalleryCard, { GalleryCardHandle } from "@/components/GalleryCard";
import { PrismaClient } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import Modal from "@/components/Modal";
import LikeButton from "@/components/LikeButton";
import FollowButton from "@/components/FollowButton";
import GalleryCardSkeleton from "@/components/GalleryCardSkeleton";
import Toast from "@/components/Toast";
import Button from "@/components/Button";
import Head from "next/head";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { useLike } from "@/context/LikeContext";
import { publicAssetUrl } from "@/utils/publicUrl";

const prisma = new PrismaClient();

type UserProfile = {
  email: string;
  username: string;
  avatar?: string | null;
  bio?: string | null;
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

export default function PublicProfile({
  user,
  followData,
}: {
  user: UserProfile | null;
  followData: { count: number; following: boolean };
}) {
  const [images, setImages] = useState<ImageType[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageType | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [followState, setFollowState] = useState(followData);
  const cardRefs = useRef<{ [id: string]: GalleryCardHandle | null }>({});
  const { setVisibleImageIds } = useLike();

  function mapUserImages(raw: unknown[]): ImageType[] {
    return raw.map((item) => {
      const img = item as Partial<ImageType>;
      return {
        ...img,
        tags: Array.isArray(img.tags) ? img.tags : [],
        likeCount: typeof img.likeCount === "number" ? img.likeCount : 0,
        liked: Boolean(img.liked),
      } as ImageType;
    });
  }

  useEffect(() => {
    if (!user?.username) return;
    setLoading(true);
    fetch(`/api/user/${encodeURIComponent(user.username)}/images?page=1&limit=12`)
      .then(async (res) => {
        if (!res.ok) {
          setToast({ message: "加载作品失败", type: "error" });
          setImages([]);
          setHasMore(false);
          return;
        }
        const data = await res.json();
        setImages(mapUserImages(data.images || []));
        setHasMore(data.page < data.totalPages);
      })
      .catch(() => {
        setToast({ message: "网络错误，无法加载作品", type: "error" });
        setImages([]);
        setHasMore(false);
      })
      .finally(() => setLoading(false));
  }, [user?.username]);

  useEffect(() => {
    if (page === 1 || !user?.username) return;
    setLoadingMore(true);
    fetch(`/api/user/${encodeURIComponent(user.username)}/images?page=${page}&limit=12`)
      .then(async (res) => {
        if (!res.ok) {
          setToast({ message: "加载更多失败", type: "error" });
          return;
        }
        const data = await res.json();
        setImages((prev) => [...prev, ...mapUserImages(data.images || [])]);
        setHasMore(data.page < data.totalPages);
      })
      .catch(() => setToast({ message: "网络错误", type: "error" }))
      .finally(() => setLoadingMore(false));
  }, [page, user?.username]);

  useEffect(() => {
    setVisibleImageIds(images.map((img) => img.id));
  }, [images, setVisibleImageIds]);

  const refetchFollowState = async () => {
    const res = await fetch(`/api/user/${user!.username}/follow`);
    if (res.ok) {
      const data = await res.json();
      setFollowState(data);
    }
  };

  if (!user) return <p>用户不存在。</p>;
  return (
    <>
      <Head>
        <title>
          {user ? `${user.username} 的主页 | PixelNest` : "用户不存在 | PixelNest"}
        </title>
        <meta
          name="description"
          content={
            user
              ? `查看 @${user.username} 的公开主页与作品 · PixelNest`
              : "PixelNest 上未找到该用户。"
          }
        />
      </Head>
      <Navbar />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="max-w-md mx-4 sm:mx-auto mt-8 p-6 border rounded bg-[var(--card)] text-[var(--card-foreground)] shadow-lg">
        <div className="flex flex-col items-center mb-4">
          <Image
            src={publicAssetUrl(user.avatar) || "/avatar.png"}
            alt="Avatar"
            width={96}
            height={96}
            className="rounded-full aspect-square object-cover border shadow"
          />
          <p className="mt-2 text-lg font-bold">@{user.username}</p>
            <div>
              <FollowButton
                username={user.username}
                userEmail={user.email}
                initialFollowing={followState.following}
                initialCount={followState.count}
                setToast={setToast}
                onLoginSuccess={refetchFollowState}
              />
            </div>
        </div>
        {user.bio && <p className="mb-2 text-center">{user.bio}</p>}
      </div>

      <div className="max-w-[90rem] mx-4 sm:mx-auto mb-4 mt-12 px-2">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {user.username} 的画廊
        </h2>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 my-4 sm:mx-auto">
            {Array.from({ length: 8 }).map((_, i) => (
              <GalleryCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {images.map((img) => (
                <GalleryCard
                  key={img.id}
                  ref={(el) => {
                    cardRefs.current[img.id] = el;
                  }}
                  image={img}
                  onClick={() => setSelectedImage(img)}
                  setToast={setToast}
                />
              ))}
            </div>
            {hasMore && !loadingMore && (
              <div className="flex justify-center my-6">
                <Button
                  onClick={() => setPage((p) => p + 1)}
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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 my-4 mx-4 sm:mx-auto">
                {Array.from({ length: 4 }).map((_, i) => (
                  <GalleryCardSkeleton key={i} />
                ))}
              </div>
            )}
            {!hasMore && images.length > 0 && (
              <p className="text-center text-gray-500 my-6">已经到底啦</p>
            )}
            {images.length === 0 && !loading && (
              <p className="mt-4 text-gray-500 text-center">
                暂无图片。
              </p>
            )}
          </>
        )}
      </div>

      {/* Modal for image preview */}
      <Modal open={!!selectedImage} onClose={() => setSelectedImage(null)} size="2xl">
        {selectedImage && (
          <div>
            <Image
              src={publicAssetUrl(selectedImage.url)}
              alt={selectedImage.title}
              width={800}
              height={500}
              className="w-full h-auto rounded"
            />
            <div className="flex items-start justify-between mt-4 mb-2">
              <div className="min-w-0 max-w-[70%]">
                <h2 className="text-xl font-bold">{selectedImage.title}</h2>
                <p className="text-gray-700 mt-2">
                  {selectedImage.description}
                </p>
                {selectedImage.tags.length > 0 && (
                  <p className="text-sm mt-2 text-[rgba(234,76,137,0.95)]">
                    {selectedImage.tags.map((t) => `#${t}`).join(" ")}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(selectedImage.createdAt).toLocaleString("zh-CN")}
                </p>
              </div>
              <span className="ml-2">
                <LikeButton
                  imageId={selectedImage.id}
                  initialLiked={selectedImage.liked}
                  initialCount={selectedImage.likeCount}
                  onLike={() => {
                    cardRefs.current[selectedImage.id]?.refetchLikeState();
                  }}
                  setToast={setToast}
                />
              </span>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const username = context.params?.username as string;
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      email: true,
      username: true,
      avatar: true,
      bio: true,
      followerCount: true,
    },
  });

  if (!user) {
    return { notFound: true };
  }

  // Same logic as GET /api/user/[username]/follow — avoid SSR fetch to localhost (fails on Windows / port mismatch).
  let followData = { count: user.followerCount ?? 0, following: false };
  const session = await getServerSession(context.req, context.res, authOptions);
  if (session?.user?.email) {
    const viewer = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (viewer) {
      const row = await prisma.follow.findUnique({
        where: {
          followerId_followingId: { followerId: viewer.id, followingId: user.id },
        },
      });
      followData = {
        count: user.followerCount ?? 0,
        following: !!row,
      };
    }
  }

  const publicUser = {
    email: user.email,
    username: user.username,
    avatar: user.avatar,
    bio: user.bio,
  };

  return {
    props: {
      user: JSON.parse(JSON.stringify(publicUser)),
      followData,
    },
  };
};
import React, { useImperativeHandle, useState, useEffect, forwardRef } from "react";
import { useSession } from "next-auth/react";
import LoginModal from "@/components/LoginModal";
import { FaHeart, FaRegHeart, FaSpinner } from "react-icons/fa";
import { useLike } from "@/context/LikeContext";

type LikeButtonProps = {
    imageId: string;
    initialLiked: boolean;
    initialCount: number;
    onLike?: () => void;
    setToast?: (toast: { message: string; type: "success" | "error" }) => void;
};

const LikeButton = forwardRef<{ refetch: () => void }, LikeButtonProps>(
  ({ imageId, initialLiked, initialCount, onLike, setToast }, ref) => {
    const { status } = useSession();
    const {
      likes,
      setLike,
      fetchLikeIfNeeded,
      refetchAllLikes,
      visibleImageIds,
      refetchingAfterLogin,
      setRefetchingAfterLogin,
    } = useLike();
    const contextLike = likes[imageId];

    const [liked, setLiked] = useState(contextLike?.liked ?? initialLiked);
    const [count, setCount] = useState(contextLike?.count ?? initialCount);
    const [loading, setLoading] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [initializing, setInitializing] = useState(!contextLike);

    // Sync local state with context if it changes
    useEffect(() => {
      if (contextLike) {
        setLiked(contextLike.liked);
        setCount(contextLike.count);
        setInitializing(false);
      }
    }, [contextLike]);

    // Only fetch if not already in context
    useEffect(() => {
      if (!contextLike) {
        setInitializing(true);
        fetchLikeIfNeeded(imageId).finally(() => setInitializing(false));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageId]);

    useImperativeHandle(ref, () => ({
      refetch: () => fetchLikeIfNeeded(imageId),
      getLiked: () => liked,
      getLikeCount: () => count,
    }));

    // Handler for login success: show loading spinner while refetching
    const handleLoginSuccess = async () => {
      if (visibleImageIds.length > 0) {
        setRefetchingAfterLogin(true);
        await refetchAllLikes(visibleImageIds);
        setRefetchingAfterLogin(false);
      }
    };

    async function toggleLike() {
      if (status !== "authenticated") {
        setShowLogin(true);
        return;
      }
      setLoading(true);
      const method = liked ? "DELETE" : "POST";
      const res = await fetch(`/api/images/${imageId}/like`, { method });
      if (res.ok) {
        const newLiked = !liked;
        const newCount = count + (liked ? -1 : 1);
        setLiked(newLiked);
        setCount(newCount);
        setLike(imageId, newLiked, newCount); // update context
        if (onLike) onLike();
        if (setToast) {
          setToast({
            message: liked ? "已取消点赞" : "点赞成功",
            type: "success",
          });
        }
      } else {
        if (res.status === 403 && setToast) {
          const data = await res.json();
          setToast({ message: data.message || "已达到点赞次数上限。", type: "error" });
        }
      }
      setLoading(false);
    }

    const isButtonLoading = loading || refetchingAfterLogin || initializing;

    if (liked) {
      return (
        <>
          <button
            onClick={toggleLike}
            disabled={isButtonLoading}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-semibold transition bg-primary/10 text-foreground/50 hover:bg-primary/30 cursor-pointer ${
              isButtonLoading ? "cursor-not-allowed" : "cursor-pointer"
            }`}
            aria-pressed="true"
            aria-label="取消点赞"
            type="button"
          >
            {isButtonLoading ? (
              <FaSpinner className="w-5 h-5 animate-spin" />
            ) : (
              <FaHeart className="w-5 h-5 fill-primary" />
            )}
            {!isButtonLoading && <span>{count}</span>}
          </button>
          {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLoginSuccess={handleLoginSuccess} />}
        </>
      );
    }

    return (
      <>
        <button
          onClick={toggleLike}
          disabled={isButtonLoading}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-semibold transition bg-primary/10 text-foreground/50 hover:bg-primary/30 cursor-pointer ${
            isButtonLoading ? "cursor-not-allowed" : "cursor-pointer"
          }`}
          aria-pressed="false"
          aria-label="点赞"
          type="button"
        >
          {isButtonLoading ? (
            <FaSpinner className="w-5 h-5 animate-spin" />
          ) : (
            <FaRegHeart className="w-5 h-5 stroke-primary" />
          )}
          {!isButtonLoading && <span>{count}</span>}
        </button>
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} setToast={setToast} onLoginSuccess={handleLoginSuccess} />}
      </>
    );
  }
);

LikeButton.displayName = "LikeButton";
export default LikeButton;
import Button from "@/components/Button";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import LoginModal from "@/components/LoginModal";
import { FaSpinner } from "react-icons/fa";

export default function FollowButton({
  username,
  userEmail,
  initialFollowing,
  initialCount,
  setToast,
  onLoginSuccess,
}: {
  username: string;
  userEmail: string;
  initialFollowing: boolean;
  initialCount: number;
  setToast?: (toast: { message: string; type: "success" | "error" }) => void;
  onLoginSuccess?: () => void;
}) {
  const { data: session, status } = useSession();
  const isOwnProfile = session?.user?.email === userEmail;

  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [refetchingAfterLogin, setRefetchingAfterLogin] = useState(false);

  useEffect(() => {
    setFollowing(initialFollowing);
    setCount(initialCount);
  }, [initialFollowing, initialCount]);

  async function toggleFollow() {
    if (status !== "authenticated") {
      setShowLogin(true); 
      return;
    }
    setLoading(true);
    const method = following ? "DELETE" : "POST";
    const res = await fetch(`/api/user/${username}/follow`, { method });
    if (res.ok) {
      setFollowing(!following);
      setCount((c) => c + (following ? -1 : 1));
      if (setToast) {
        setToast({
          message: following ? "已取消关注" : "关注成功",
          type: "success",
        });
      }
    } else {
      if (res.status === 403 && setToast) {
        const data = await res.json();
        setToast({ message: data.message || "已达到关注人数上限。", type: "error" });
      }
    }
    setLoading(false);
  }

  const handleLoginSuccess = async () => {
    setRefetchingAfterLogin(true);
    if (onLoginSuccess) await onLoginSuccess();
    setRefetchingAfterLogin(false);
  };

  return (
    <div className="flex flex-col items-center">
      <p className="text-gray-500 text-sm mb-4">
        {count} 位粉丝
      </p>
      {status !== "loading" && !isOwnProfile && (
        refetchingAfterLogin ? (
          <button
            className="flex items-center justify-center px-4 py-2 rounded font-semibold transition w-24 h-10 bg-[var(--input)]"
            disabled
            aria-label="加载中"
            type="button"
          >
            <FaSpinner className="animate-spin" />
          </button>
        ) : (
          <Button
            onClick={toggleFollow}
            loading={loading}
            variant={following ? "outline" : "primary"}
            className={following ? "border-[var(--unfollow-bg)] text-[var(--unfollow-fg)] hover:bg-[var(--muted)]" : ""}
          >
            {following ? "取消关注" : "关注"}
          </Button>
        )
      )}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          setToast={setToast}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}
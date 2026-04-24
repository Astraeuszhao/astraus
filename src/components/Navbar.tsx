import Link from "next/link";
import { useSession } from "next-auth/react";
import Image from "next/image";
import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { useRouter } from "next/router";
import Spinner from "./Spinner";
import { FaHome, FaUpload, FaSignInAlt, FaUserPlus, FaBars } from "react-icons/fa";
import { useAvatar } from "@/context/AvatarContext";
import { publicAssetUrl } from "@/utils/publicUrl";

export type NavbarHandle = {
  refetchAvatar: () => void;
};

const Navbar = forwardRef(function Navbar(_props, ref) {
  const { data: session } = useSession();
  const router = useRouter();
  const { avatar, setAvatar } = useAvatar();
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [navLabel, setNavLabel] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName =
    navLabel || (typeof session?.user?.name === "string" && session.user.name.trim()) || session?.user?.email || "";

  const fetchSessionProfile = React.useCallback(() => {
    if (!session) {
      setNavLabel(null);
      return;
    }
    fetch("/api/profile")
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as {
          email?: string;
          nickname?: string | null;
          username?: string;
          avatar?: string | null;
        } | null;
        if (!res.ok || !data?.email) {
          setNavLabel(
            (typeof session.user?.name === "string" && session.user.name.trim()) || session.user?.email || null,
          );
          setAvatar("/avatar.png");
          return;
        }
        const label =
          (typeof data.nickname === "string" && data.nickname.trim()) || data.username || data.email;
        setNavLabel(label);
        if (data.avatar) setAvatar(`${data.avatar}?t=${Date.now()}`);
        else setAvatar("/avatar.png");
      })
      .catch(() => {
        setNavLabel(
          (typeof session.user?.name === "string" && session.user.name.trim()) || session.user?.email || null,
        );
        setAvatar("/avatar.png");
      });
  }, [session, setAvatar]);

  useImperativeHandle(ref, () => ({
    refetchAvatar: fetchSessionProfile,
  }));

  useEffect(() => {
    fetchSessionProfile();
  }, [fetchSessionProfile]);

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleStop = () => setLoading(false);
    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleStop);
    router.events.on("routeChangeError", handleStop);
    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleStop);
      router.events.off("routeChangeError", handleStop);
    };
  }, [router]);

  useEffect(() => {
    const closeMenu = () => setMenuOpen(false);
    router.events.on("routeChangeStart", closeMenu);
    return () => router.events.off("routeChangeStart", closeMenu);
  }, [router]);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <>
      {loading && <Spinner />}
      <nav className="w-full bg-[var(--sidebar)] text-[var(--sidebar-foreground)] shadow-lg sticky top-0 z-[51] mb-6 border-b border-[var(--border)]">
        <div className="flex flex-col">
          <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4">
            <div className="shrink-0">
              <Link
                href="/"
                className="font-bold text-xl sm:text-2xl tracking-tight text-black dark:text-white hover:opacity-90 transition leading-none"
              >
                ASTRAEUS
              </Link>
            </div>

            <div className="hidden lg:flex items-center gap-3 shrink-0 ml-auto">
              <Link href="/" className="hover:text-[var(--primary)] font-medium transition flex items-center gap-2 text-sm">
                <FaHome className="h-4 w-4" />
                主页
              </Link>
              {session && (
                <Link href="/upload" className="hover:text-[var(--primary)] font-medium transition flex items-center gap-2 text-sm">
                  <FaUpload className="h-4 w-4" />
                  上传
                </Link>
              )}
              {!session && (
                <>
                  <Link href="/login" className="hover:text-[var(--primary)] font-medium transition flex items-center gap-2 text-sm">
                    <FaSignInAlt className="h-4 w-4" />
                    登录
                  </Link>
                  <Link href="/register" className="hover:text-[var(--primary)] font-medium transition flex items-center gap-2 text-sm">
                    <FaUserPlus className="h-4 w-4" />
                    注册
                  </Link>
                </>
              )}
              {session && (
                <button
                  type="button"
                  onClick={() => router.push("/profile")}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-[var(--card)] shadow border border-[var(--border)] cursor-pointer transition hover:bg-[var(--primary)] hover:text-white focus:outline-none hover:shadow-md"
                  title="个人"
                >
                  <Image
                    src={publicAssetUrl(avatar) || "/avatar.png"}
                    alt="Avatar"
                    width={32}
                    height={32}
                    className="rounded-full aspect-square object-cover border"
                    priority={false}
                  />
                  <span className="font-semibold text-sm truncate max-w-[120px]">{displayName}</span>
                </button>
              )}
            </div>

            <div className="lg:hidden relative flex items-center ml-auto">
              <button
                aria-label="打开菜单"
                className="p-2 rounded hover:bg-[var(--muted)] transition"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <FaBars className="w-7 h-7" />
              </button>
              {menuOpen && (
                <div
                  ref={menuRef}
                  className="
                absolute top-full right-0 mt-2
                bg-[var(--card)] bg-opacity-95
                backdrop-blur
                text-[var(--card-foreground)]
                rounded-xl
                shadow-2xl
                flex flex-col gap-3
                p-5
                min-w-[220px]
                z-[60]
                border border-[var(--border)]
                transition-all
                animate-fade-in
              "
                >
                  {session && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        router.push("/profile");
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--muted)] shadow border border-[var(--border)] cursor-pointer transition hover:bg-[var(--primary)] hover:text-white focus:outline-none justify-center mb-2"
                      title="个人"
                    >
                      <Image
                        src={publicAssetUrl(avatar) || "/avatar.png"}
                        alt="Avatar"
                        width={32}
                        height={32}
                        className="rounded-full aspect-square object-cover border"
                        priority={false}
                      />
                      <span className="font-semibold text-sm truncate max-w-[120px]">{displayName}</span>
                    </button>
                  )}

                  <div className="border-b border-[var(--border)] my-2" />

                  <div className="flex flex-col gap-2 mt-2">
                    <Link
                      href="/"
                      className="hover:text-[var(--primary)] font-medium transition flex items-center justify-center gap-2"
                      onClick={() => setMenuOpen(false)}
                    >
                      <FaHome className="h-5 w-5" />
                      主页
                    </Link>
                    {session && (
                      <Link
                        href="/upload"
                        className="hover:text-[var(--primary)] font-medium transition flex items-center justify-center gap-2"
                        onClick={() => setMenuOpen(false)}
                      >
                        <FaUpload className="h-5 w-5" />
                        上传
                      </Link>
                    )}
                    {!session && (
                      <>
                        <Link href="/login" className="hover:text-[var(--primary)] font-medium transition flex items-center justify-center gap-2" onClick={() => setMenuOpen(false)}>
                          <FaSignInAlt className="h-5 w-5" />
                          登录
                        </Link>
                        <Link href="/register" className="hover:text-[var(--primary)] font-medium transition flex items-center justify-center gap-2" onClick={() => setMenuOpen(false)}>
                          <FaUserPlus className="h-5 w-5" />
                          注册
                        </Link>
                      </>
                    )}
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
});

export default Navbar;

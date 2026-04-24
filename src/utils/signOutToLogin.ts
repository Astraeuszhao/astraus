import { signOut } from "next-auth/react";

/**
 * Clears the NextAuth session then navigates to /login on the **current** origin.
 * Avoids redirecting to NEXTAUTH_URL when it points at another port (e.g. :3000 vs :3001).
 */
export async function signOutToLogin(toastMessage = "已成功退出登录") {
  await signOut({ redirect: false });
  window.location.href = `/login?toast=${encodeURIComponent(toastMessage)}`;
}

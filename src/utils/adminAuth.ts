import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";

export const ADMIN_COOKIE = "pn_admin";

function signingSecret() {
  return process.env.ADMIN_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev-only-admin-secret";
}

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD ?? "123456789";
}

export function mintAdminToken(): string {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
  const nonce = randomBytes(16).toString("hex");
  const payload = `${exp}.${nonce}`;
  const sig = createHmac("sha256", signingSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifyAdminToken(token: string | undefined): boolean {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [expStr, nonce, sig] = parts;
  const exp = parseInt(expStr, 10);
  if (!Number.isFinite(exp) || exp < Date.now() / 1000) return false;
  const payload = `${expStr}.${nonce}`;
  const expected = createHmac("sha256", signingSecret()).update(payload).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(expected, "utf8"));
  } catch {
    return false;
  }
}

function tokenFromCookieHeader(cookieHeader: string | undefined): string {
  if (!cookieHeader) return "";
  const parts = cookieHeader.split(";");
  for (const p of parts) {
    const [k, ...rest] = p.trim().split("=");
    if (k === ADMIN_COOKIE) return decodeURIComponent(rest.join("="));
  }
  return "";
}

export function assertAdmin(req: NextApiRequest, res: NextApiResponse): boolean {
  const token = tokenFromCookieHeader(req.headers.cookie);
  if (!verifyAdminToken(token)) {
    res.status(401).json({ message: "未登录后台或会话已过期" });
    return false;
  }
  return true;
}

export function adminSetCookieHeader(token: string): string {
  const maxAge = 60 * 60 * 24 * 7;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ADMIN_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function adminClearCookieHeader(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

import type { NextApiRequest, NextApiResponse } from "next";
import { timingSafeEqual } from "crypto";
import {
  adminSetCookieHeader,
  getAdminPassword,
  mintAdminToken,
} from "@/utils/adminAuth";

function safeEqual(a: string, b: string) {
  try {
    const ba = Buffer.from(a, "utf8");
    const bb = Buffer.from(b, "utf8");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "不允许的请求方法" });

  const { password } = req.body as { password?: string };
  if (typeof password !== "string") {
    return res.status(400).json({ message: "请输入密码" });
  }

  const expected = getAdminPassword();
  if (!safeEqual(password, expected)) {
    return res.status(401).json({ message: "密码错误" });
  }

  const token = mintAdminToken();
  res.setHeader("Set-Cookie", adminSetCookieHeader(token));
  return res.status(200).json({ ok: true });
}

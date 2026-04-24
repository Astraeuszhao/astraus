import type { NextApiRequest, NextApiResponse } from "next";
import { adminClearCookieHeader } from "@/utils/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "不允许的请求方法" });
  res.setHeader("Set-Cookie", adminClearCookieHeader());
  return res.status(200).json({ ok: true });
}

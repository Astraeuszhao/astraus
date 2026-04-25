import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";
import { rateLimit } from "@/utils/rateLimit";
import { normalizeImageTags } from "@/utils/imageTags";

const prisma = new PrismaClient();

const updateRateLimitStore: Record<string, { count: number; reset: number }> = {};
const UPDATE_LIMIT = 20; // max updates per hour per user
const UPDATE_WINDOW = 60 * 60 * 1000; // 1 hour

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.email) {
    return res.status(401).json({ message: "未登录" });
  }

  // Rate limit per user
  const { limited, wait } = rateLimit(updateRateLimitStore, session.user.email, UPDATE_LIMIT, UPDATE_WINDOW);
  if (limited) {
    return res.status(429).json({ message: `更新过于频繁，请 ${wait} 秒后再试。` });
  }

  const body = req.body as {
    id?: string;
    title?: string;
    description?: string;
    tags?: unknown;
  };

  const id = typeof body.id === "string" ? body.id.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const tags = normalizeImageTags(body.tags, 8);

  // Validate
  if (!id || !title || !description) {
    return res.status(400).json({ message: "缺少必填字段" });
  }
  if (title.length > 100) {
    return res.status(400).json({ message: "标题不能超过 100 字" });
  }
  if (description.length > 500) {
    return res.status(400).json({ message: "描述不能超过 500 字" });
  }

  // Check ownership
  const image = await prisma.image.findUnique({ where: { id } });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!image || !user || image.userId !== user.id) {
    return res.status(403).json({ message: "无权修改此图片" });
  }

  await prisma.image.update({
    where: { id },
    data: { title, description, tags },
  });

  res.status(200).json({ message: "图片已更新" });
}
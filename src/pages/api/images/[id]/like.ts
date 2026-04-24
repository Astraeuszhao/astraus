import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const LIKE_LIMIT = 5000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only require auth for POST and DELETE
  let user = null;
  if (req.method === "POST" || req.method === "DELETE" || req.method === "GET") {
    const session = await getServerSession(req, res, authOptions);
    if (session?.user?.email) {
      user = await prisma.user.findUnique({ where: { email: session.user.email } });
    }
  }

  const imageId = req.query.id as string;
  if (!imageId) return res.status(400).json({ message: "缺少图片 ID" });

  if (req.method === "POST" || req.method === "DELETE") {
    if (!user) return res.status(401).json({ message: "未登录" });
  }

  if (req.method === "POST") {
    if (user?.muted) {
      return res.status(403).json({ message: "账号已被禁言，暂时无法点赞" });
    }
    // Enforce like table limit
    const likeCount = await prisma.imageLike.count();
    if (likeCount >= LIKE_LIMIT) {
      return res.status(403).json({ message: "点赞数据已达系统上限。" });
    }
    // Like image (upsert)
    const existingLike = await prisma.imageLike.findUnique({
      where: { userId_imageId: { userId: user!.id, imageId } },
    });
    if (!existingLike) {
      await prisma.imageLike.create({
        data: { userId: user!.id, imageId },
      });
      await prisma.image.update({
        where: { id: imageId },
        data: { likeCount: { increment: 1 } },
      });
    }
    return res.status(200).json({ liked: true });
  }

  if (req.method === "DELETE") {
    // Unlike image
    const deleted = await prisma.imageLike.deleteMany({
      where: { userId: user!.id, imageId },
    });
    if (deleted.count > 0) {
      await prisma.image.update({
        where: { id: imageId },
        data: { likeCount: { decrement: deleted.count } },
      });
    }
    return res.status(200).json({ liked: false });
  }

  if (req.method === "GET") {
    const image = await prisma.image.findUnique({ where: { id: imageId } });
    if (!image) return res.status(404).json({ message: "未找到图片" });

    let liked = false;
    if (user) {
      liked = !!(await prisma.imageLike.findUnique({
        where: { userId_imageId: { userId: user.id, imageId } },
      }));
    }
    // Fallback to 0 if likeCount is undefined
    return res.status(200).json({ count: image.likeCount ?? 0, liked });
  }

  res.status(405).end();
}
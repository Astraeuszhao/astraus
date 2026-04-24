import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const raw = req.query.username;
    const username =
      typeof raw === "string" ? raw.trim() : Array.isArray(raw) && typeof raw[0] === "string" ? raw[0].trim() : "";

    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "8", 10);

    if (!username) {
      return res.status(400).json({ message: "需要用户名" });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ message: "用户不存在" });
    }

    const total = await prisma.image.count({ where: { userId: user.id } });
    const totalPages = Math.ceil(total / limit) || 1;

    const images = await prisma.image.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        tags: true,
        url: true,
        createdAt: true,
        likeCount: true,
      },
    });

    return res.status(200).json({
      images,
      page,
      totalPages,
    });
  } catch (e) {
    console.error("api/user/[username]/images", e);
    return res.status(500).json({
      message: "加载作品失败，请确认数据库已迁移（npx prisma migrate deploy）并重启开发服务后重试。",
    });
  }
}

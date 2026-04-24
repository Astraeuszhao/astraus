import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { assertAdmin } from "@/utils/adminAuth";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ message: "不允许的请求方法" });
  if (!assertAdmin(req, res)) return;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      username: true,
      nickname: true,
      publicUid: true,
      avatar: true,
      followerCount: true,
      muted: true,
      _count: { select: { images: true } },
    },
  });

  return res.status(200).json({ users });
}

import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { assertAdmin } from "@/utils/adminAuth";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ message: "不允许的请求方法" });
  if (!assertAdmin(req, res)) return;

  const userId = typeof req.query.userId === "string" && req.query.userId ? req.query.userId : undefined;

  const images = await prisma.image.findMany({
    where: userId ? { userId } : {},
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, username: true, nickname: true, email: true },
      },
    },
  });

  return res.status(200).json({ images });
}

import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { assertAdmin } from "@/utils/adminAuth";
import { normalizeImageTags } from "@/utils/imageTags";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!assertAdmin(req, res)) return;

  const id = typeof req.query.id === "string" ? req.query.id : "";
  if (!id) return res.status(400).json({ message: "缺少图片 ID" });

  if (req.method === "PATCH") {
    const body = req.body as {
      title?: unknown;
      description?: unknown;
      tags?: unknown;
      likeCount?: unknown;
    };

    const data: { title?: string; description?: string; tags?: string[]; likeCount?: number } = {};

    if (body.title !== undefined) {
      if (typeof body.title !== "string") return res.status(400).json({ message: "标题无效" });
      const t = body.title.trim();
      if (!t || t.length > 100) return res.status(400).json({ message: "标题须在 1～100 字" });
      data.title = t;
    }
    if (body.description !== undefined) {
      if (typeof body.description !== "string") return res.status(400).json({ message: "描述无效" });
      const d = body.description.trim();
      if (!d || d.length > 500) return res.status(400).json({ message: "描述须在 1～500 字" });
      data.description = d;
    }
    if (body.tags !== undefined) {
      data.tags = normalizeImageTags(body.tags, 8);
    }
    if (body.likeCount !== undefined) {
      const n = typeof body.likeCount === "number" ? body.likeCount : parseInt(String(body.likeCount), 10);
      if (!Number.isFinite(n) || n < 0 || n > 1_000_000_000) {
        return res.status(400).json({ message: "点赞数无效" });
      }
      data.likeCount = Math.floor(n);
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "没有要更新的字段" });
    }

    try {
      const image = await prisma.image.update({
        where: { id },
        data,
        include: {
          user: { select: { id: true, username: true, nickname: true, email: true } },
        },
      });
      return res.status(200).json({ image });
    } catch {
      return res.status(404).json({ message: "图片不存在" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await prisma.image.delete({ where: { id } });
      return res.status(200).json({ message: "已删除" });
    } catch {
      return res.status(404).json({ message: "图片不存在" });
    }
  }

  return res.status(405).json({ message: "不允许的请求方法" });
}

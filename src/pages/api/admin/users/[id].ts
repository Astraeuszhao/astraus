import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { assertAdmin } from "@/utils/adminAuth";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!assertAdmin(req, res)) return;

  const id = typeof req.query.id === "string" ? req.query.id : "";
  if (!id) return res.status(400).json({ message: "缺少用户 ID" });

  if (req.method === "PATCH") {
    const body = req.body as {
      nickname?: unknown;
      followerCount?: unknown;
      muted?: unknown;
      clearAvatar?: unknown;
    };

    const data: {
      nickname?: string | null;
      followerCount?: number;
      muted?: boolean;
      avatar?: string | null;
    } = {};

    if (body.nickname !== undefined) {
      if (typeof body.nickname !== "string") {
        return res.status(400).json({ message: "昵称格式无效" });
      }
      const n = body.nickname.trim();
      if (n.length < 1 || n.length > 40) {
        return res.status(400).json({ message: "昵称长度须在 1～40 字之间" });
      }
      data.nickname = n;
    }

    if (body.followerCount !== undefined) {
      const n = typeof body.followerCount === "number" ? body.followerCount : parseInt(String(body.followerCount), 10);
      if (!Number.isFinite(n) || n < 0 || n > 1_000_000_000) {
        return res.status(400).json({ message: "粉丝数无效" });
      }
      data.followerCount = Math.floor(n);
    }

    if (body.muted !== undefined) {
      if (typeof body.muted !== "boolean") {
        return res.status(400).json({ message: "禁言状态无效" });
      }
      data.muted = body.muted;
    }

    if (body.clearAvatar === true) {
      data.avatar = "/avatar.png";
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "没有要更新的字段" });
    }

    try {
      const updated = await prisma.user.update({
        where: { id },
        data,
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
      return res.status(200).json({ user: updated });
    } catch {
      return res.status(404).json({ message: "用户不存在" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await prisma.user.delete({ where: { id } });
      return res.status(200).json({ message: "账户已删除" });
    } catch {
      return res.status(404).json({ message: "用户不存在" });
    }
  }

  return res.status(405).json({ message: "不允许的请求方法" });
}

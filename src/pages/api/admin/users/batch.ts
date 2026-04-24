import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { assertAdmin } from "@/utils/adminAuth";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "不允许的请求方法" });
  if (!assertAdmin(req, res)) return;

  const { ids, action } = req.body as { ids?: unknown; action?: string };
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: "请选择至少一个用户" });
  }
  const idList = ids.filter((x): x is string => typeof x === "string" && x.length > 0);
  if (idList.length === 0) return res.status(400).json({ message: "无效的用户 ID" });

  if (action === "mute") {
    await prisma.user.updateMany({ where: { id: { in: idList } }, data: { muted: true } });
    return res.status(200).json({ message: "已批量禁言" });
  }
  if (action === "unmute") {
    await prisma.user.updateMany({ where: { id: { in: idList } }, data: { muted: false } });
    return res.status(200).json({ message: "已批量解除禁言" });
  }
  if (action === "delete") {
    await prisma.user.deleteMany({ where: { id: { in: idList } } });
    return res.status(200).json({ message: "已批量删除账户" });
  }

  return res.status(400).json({ message: "未知操作" });
}

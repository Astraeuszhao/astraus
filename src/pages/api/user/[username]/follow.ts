import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

const FOLLOW_LIMIT = 5000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  let user = null;
  if (session?.user?.email) {
    user = await prisma.user.findUnique({ where: { email: session.user.email } });
  }

  const { username } = req.query;
  const targetUser = await prisma.user.findUnique({ where: { username: String(username) } });
  if (!targetUser) return res.status(404).json({ message: "用户不存在" });

  if (req.method === "POST") {
    if (!user) return res.status(401).json({ message: "未登录" });
    if (user.id === targetUser.id) return res.status(400).json({ message: "不能关注自己" });

    // Enforce follow table limit
    const followCount = await prisma.follow.count();
    if (followCount >= FOLLOW_LIMIT) {
      return res.status(403).json({ message: "关注数据已达系统上限。" });
    }

    // Only increment if this is a new follow
    const existingFollow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: user.id, followingId: targetUser.id } },
    });
    if (!existingFollow) {
      await prisma.follow.create({
        data: { followerId: user.id, followingId: targetUser.id },
      });
      await prisma.user.update({
        where: { id: targetUser.id },
        data: { followerCount: { increment: 1 } },
      });
    }
    return res.status(200).json({ following: true });
  }

  if (req.method === "DELETE") {
    if (!user) return res.status(401).json({ message: "未登录" });
    const deleted = await prisma.follow.deleteMany({
      where: { followerId: user.id, followingId: targetUser.id },
    });
    if (deleted.count > 0) {
      await prisma.user.update({
        where: { id: targetUser.id },
        data: { followerCount: { decrement: deleted.count } },
      });
    }
    return res.status(200).json({ following: false });
  }

  if (req.method === "GET") {
    // Read followerCount directly from the user table
    const freshTargetUser = await prisma.user.findUnique({ where: { id: targetUser.id } });
    let following = false;
    if (user) {
      following = !!(await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: user.id, followingId: targetUser.id } },
      }));
    }
    return res.status(200).json({ count: freshTargetUser?.followerCount ?? 0, following });
  }

  return res.status(405).end();
}
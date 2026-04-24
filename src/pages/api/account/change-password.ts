import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";
import { compare, hash } from "bcryptjs";

const prisma = new PrismaClient();

function validPassword(p: string) {
  return p.length >= 6 && p.length <= 128;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "不允许的请求方法" });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ message: "未登录" });

  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
    return res.status(400).json({ message: "参数无效" });
  }
  if (!validPassword(newPassword)) {
    return res.status(400).json({ message: "新密码长度须在 6～128 位之间" });
  }
  if (currentPassword === newPassword) {
    return res.status(400).json({ message: "新密码不能与当前密码相同" });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return res.status(404).json({ message: "用户不存在" });

  const ok = await compare(currentPassword, user.password);
  if (!ok) return res.status(400).json({ message: "当前密码错误" });

  const hashed = await hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed },
  });

  return res.status(200).json({ message: "密码已更新" });
}

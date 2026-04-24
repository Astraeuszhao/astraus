import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "不允许的请求方法" });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ message: "未登录" });

  const { password } = req.body as { password?: string };
  if (typeof password !== "string" || !password) {
    return res.status(400).json({ message: "请输入密码" });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return res.status(404).json({ message: "用户不存在" });

  const ok = await compare(password, user.password);
  if (!ok) return res.status(400).json({ message: "密码错误，无法注销" });

  await prisma.user.delete({ where: { id: user.id } });

  return res.status(200).json({ message: "账户已注销" });
}

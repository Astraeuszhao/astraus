import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { rateLimit } from "@/utils/rateLimit";
import { mintPublicUid } from "@/utils/publicUid";

const prisma = new PrismaClient();

const rateLimitStore: Record<string, { count: number; reset: number }> = {};
const LIMIT = 5; // max registrations per window per IP
const WINDOW = 60 * 60 * 1000; // 1 hour in ms

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUsername(username: string) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

function isValidPassword(password: string) {
  return password.length >= 6 && password.length <= 128;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "不允许的请求方法" });
  }

  // --- Rate limiting by IP ---
  const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.socket?.remoteAddress || "unknown";
  const { limited, wait } = rateLimit(rateLimitStore, ip, LIMIT, WINDOW);
  if (limited) {
    return res.status(429).json({ message: `注册过于频繁，请 ${wait} 秒后再试。` });
  }

  const { email, username, password } = req.body;

  // Basic sanitation
  if (
    typeof email !== "string" ||
    typeof username !== "string" ||
    typeof password !== "string"
  ) {
    return res.status(400).json({ message: "请求参数类型无效" });
  }

  // Trim and sanitize
  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim();

  // Validation
  if (!cleanEmail || !cleanUsername || !password) {
    return res.status(400).json({ message: "请填写邮箱、用户名和密码" });
  }
  if (!isValidEmail(cleanEmail)) {
    return res.status(400).json({ message: "邮箱格式不正确" });
  }
  if (!isValidUsername(cleanUsername)) {
    return res.status(400).json({ message: "用户名为 3～20 位，仅字母、数字或下划线" });
  }
  if (!isValidPassword(password)) {
    return res.status(400).json({
      message: "密码长度须在 6～128 个字符之间",
    });
  }

  // Enforce user limit
  const userCount = await prisma.user.count();
  if (userCount >= 500) {
    return res.status(403).json({ message: "用户数量已达上限，暂停注册。" });
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: cleanEmail }, { username: cleanUsername }],
    },
  });
  if (existingUser) {
    return res.status(409).json({ message: "该邮箱或用户名已被占用" });
  }

  const hashedPassword = await hash(password, 10);
  const publicUid = await mintPublicUid(prisma);

  const user = await prisma.user.create({
    data: {
      email: cleanEmail,
      username: cleanUsername,
      publicUid,
      password: hashedPassword,
      nickname: cleanUsername,
    },
  });

  return res.status(201).json({ id: user.id, email: user.email, username: user.username });
}
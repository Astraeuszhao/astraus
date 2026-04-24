import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { rateLimit } from "@/utils/rateLimit";
import { del as blobDel } from "@vercel/blob";

const prisma = new PrismaClient();

const rateLimitStore: Record<string, { count: number; reset: number }> = {};
const LIMIT = 10; // max deletes per window
const WINDOW = 60 * 60 * 1000; // 1 hour in ms

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "DELETE") return res.status(405).end();

    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.email) {
      return res.status(401).json({ message: "未登录" });
    }
    const userEmail = session.user.email;

    // Use the utility
    const { limited, wait } = rateLimit(rateLimitStore, userEmail, LIMIT, WINDOW);
    if (limited) {
      return res.status(429).json({ message: `操作过于频繁，请 ${wait} 秒后再试。` });
    }

    let { id } = req.body;
    id = typeof id === "string" ? id.trim() : "";
    if (!id) return res.status(400).json({ message: "缺少图片 ID" });

    // Find the image and check ownership
    const image = await prisma.image.findUnique({ where: { id } });
    if (!image) return res.status(404).json({ message: "未找到图片" });

    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user || image.userId !== user.id) {
      return res.status(403).json({ message: "无权删除此图片" });
    }

    // Delete the file from storage
    if (typeof image.url === "string" && image.url) {
      try {
        if (process.env.USE_BLOB_STORAGE === "true") {
          // Blob：从 URL 解析对象路径
          const url = new URL(image.url);
          const blobPath = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;
          await blobDel(blobPath);
        } else {
          // Local: remove from public/... (url may contain Windows "\" from legacy rows)
          const rel = String(image.url).replace(/\\/g, "/").replace(/^\/+/, "");
          const filePath = path.join(process.cwd(), "public", rel);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      } catch (fileErr) {
        console.error("Failed to delete file:", fileErr);
      }
    }

    // Delete from DB
    await prisma.image.delete({ where: { id } });

    res.status(200).json({ message: "图片已删除" });
  } catch (err) {
    console.error("Delete image error:", err);
    res.status(500).json({ message: "服务器内部错误" });
  }
}
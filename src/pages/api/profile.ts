import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";
import formidable, { File } from "formidable";
import fs from "fs";
import path from "path";
import { rateLimit } from "@/utils/rateLimit";
import { put } from "@vercel/blob";
import { mintPublicUid } from "@/utils/publicUid";

export const config = {
  api: {
    bodyParser: false,
  },
};

const prisma = new PrismaClient();

const profileRateLimitStore: Record<string, { count: number; reset: number }> = {};
const PROFILE_LIMIT = 10; // max profile updates per hour
const PROFILE_WINDOW = 60 * 60 * 1000; // 1 hour

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.email) {
      return res.status(401).json({ message: "未登录" });
    }
    const userEmail = session.user.email!;

    if (req.method === "GET") {
      let user = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true, email: true, username: true, publicUid: true, nickname: true, avatar: true, bio: true },
      });
      if (!user) {
        return res.status(404).json({ message: "用户不存在，请重新注册或登录" });
      }
      if (!user.publicUid) {
        const publicUid = await mintPublicUid(prisma);
        user = await prisma.user.update({
          where: { id: user.id },
          data: { publicUid },
          select: { id: true, email: true, username: true, publicUid: true, nickname: true, avatar: true, bio: true },
        });
      }
      const { id: _omit, ...rest } = user;
      return res.status(200).json(rest);
    }

    if (req.method === "POST") {
    // Rate limit profile updates per user
    const { limited, wait } = rateLimit(profileRateLimitStore, userEmail, PROFILE_LIMIT, PROFILE_WINDOW);
    if (limited) {
      return res.status(429).json({ message: `资料更新过于频繁，请 ${wait} 秒后再试。` });
    }

    const form = formidable({ multiples: false, maxFileSize: 2 * 1024 * 1024 }); // 2MB max
    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(500).json({ message: "上传处理出错" });

      const nicknameRaw = fields.nickname
        ? Array.isArray(fields.nickname)
          ? String(fields.nickname[0] ?? "").trim()
          : String(fields.nickname).trim()
        : undefined;

      if (nicknameRaw !== undefined) {
        if (nicknameRaw.length < 1 || nicknameRaw.length > 40) {
          return res.status(400).json({ message: "昵称长度须在 1～40 字之间" });
        }
      }

      // Sanitize and validate bio
      const bio = fields.bio
        ? Array.isArray(fields.bio)
          ? String(fields.bio[0] ?? "").trim()
          : String(fields.bio).trim()
        : undefined;
      if (bio && bio.length > 300) {
        return res.status(400).json({ message: "简介不能超过 300 字" });
      }

      // Handle avatar upload
      let avatarPath = undefined;
      const file = files.avatar as File | File[] | undefined;
      const avatarFile = Array.isArray(file) ? file[0] : file;

      if (avatarFile && avatarFile.filepath) {
        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        if (!allowedTypes.includes(avatarFile.mimetype || "")) {
          return res.status(400).json({ message: "头像须为图片文件（jpg、png、gif、webp）" });
        }
        // Validate file size (already enforced by formidable, but double-check)
        if (avatarFile.size && avatarFile.size > 2 * 1024 * 1024) {
          return res.status(400).json({ message: "头像不能超过 2MB" });
        }

        if (process.env.USE_BLOB_STORAGE === "true") {
          const fileName = `astraeus/avatars/${userEmail}-avatar${path.extname(avatarFile.originalFilename || "")}`;
          const stream = fs.createReadStream(avatarFile.filepath);
          const blob = await put(fileName, stream, {
            access: "public",
            allowOverwrite: true,
          });
          avatarPath = blob.url;
          fs.unlinkSync(avatarFile.filepath);
        } else {
          // Local upload
          const uploadDir = path.join(process.cwd(), "public", "avatars");
          fs.mkdirSync(uploadDir, { recursive: true });
          const fileName = `${userEmail}-avatar${path.extname(avatarFile.originalFilename || "")}`;
          const filePath = path.join(uploadDir, fileName);
          fs.renameSync(avatarFile.filepath, filePath);
          avatarPath = `/avatars/${fileName}`;
        }
      }

      // Update user
      const updated = await prisma.user.update({
        where: { email: userEmail },
        data: {
          ...(nicknameRaw !== undefined ? { nickname: nicknameRaw } : {}),
          ...(bio !== undefined ? { bio } : {}),
          ...(avatarPath ? { avatar: avatarPath } : {}),
        },
        select: { email: true, username: true, publicUid: true, nickname: true, avatar: true, bio: true },
      });

      return res.status(200).json(updated);
    });
      return;
    }

    return res.status(405).json({ message: "不允许的请求方法" });
  } catch (e) {
    console.error("api/profile", e);
    return res.status(500).json({
      message: "服务器错误，请确认数据库已迁移（npx prisma migrate dev）后重试",
    });
  }
}
import type { NextApiRequest, NextApiResponse } from "next";
import { put } from "@vercel/blob";
import fs from "fs";
import path from "path";
import formidable from "formidable";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";
import { rateLimit } from "@/utils/rateLimit";
import { normalizeImageTags } from "@/utils/imageTags";
import sharp from "sharp";

export const config = {
  api: {
    bodyParser: false,
  },
};

const prisma = new PrismaClient();

const uploadRateLimitStore: Record<string, { count: number; reset: number }> = {};
const UPLOAD_LIMIT = 20; // max uploads per hour per user
const UPLOAD_WINDOW = 60 * 60 * 1000; // 1 hour

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.email) {
    return res.status(401).json({ message: "未登录" });
  }
  const userEmail = session.user.email;

  const uploader = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { id: true, muted: true },
  });
  if (!uploader) {
    return res.status(401).json({ message: "未找到用户" });
  }
  if (uploader.muted) {
    return res.status(403).json({ message: "账号已被禁言，暂时无法上传" });
  }

  // Rate limit uploads per user
  const { limited, wait } = rateLimit(uploadRateLimitStore, userEmail, UPLOAD_LIMIT, UPLOAD_WINDOW);
  if (limited) {
    return res.status(429).json({ message: `上传过于频繁，请 ${wait} 秒后再试。` });
  }

  // Enforce image limit
  const imageCount = await prisma.image.count();
  if (imageCount >= 300) {
    return res.status(403).json({ message: "全站图片数量已达上限，无法继续上传。" });
  }

  // Only create uploadDir if not using blob storage
  let uploadDir: string | undefined = undefined;
  if (process.env.USE_BLOB_STORAGE !== "true") {
    uploadDir = path.join(process.cwd(), "public", "uploads");
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const form = formidable({
    multiples: false,
    uploadDir: uploadDir || "/tmp", // fallback to /tmp for serverless
    keepExtensions: true,
  });

  form.parse(req, async (err, fields: Record<string, unknown>, files) => {
    const fail = (status: number, message: string) => {
      if (!res.writableEnded) res.status(status).json({ message });
    };

    try {
      if (err) {
        console.error("upload formidable", err);
        return fail(500, "上传处理出错");
      }

      const title =
        typeof fields.title === "string"
          ? fields.title.trim()
          : Array.isArray(fields.title) && typeof fields.title[0] === "string"
            ? fields.title[0].trim()
            : "";

      const description =
        typeof fields.description === "string"
          ? fields.description.trim()
          : Array.isArray(fields.description) && typeof fields.description[0] === "string"
            ? fields.description[0].trim()
            : "";

      if (!title || !description) {
        return fail(400, "请填写标题和描述");
      }
      if (title.length > 100) {
        return fail(400, "标题不能超过 100 字");
      }
      if (description.length > 500) {
        return fail(400, "描述不能超过 500 字");
      }

      const tagsRaw =
        typeof fields.tags === "string"
          ? fields.tags
          : Array.isArray(fields.tags) && typeof fields.tags[0] === "string"
            ? fields.tags[0]
            : "[]";
      const tags = normalizeImageTags(tagsRaw, 8);

      let file = files.image as formidable.File | formidable.File[];
      if (Array.isArray(file)) file = file[0];
      if (!file?.filepath) return fail(400, "未选择文件");

      const MAX_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        try {
          fs.unlinkSync(file.filepath);
        } catch {
          /* ignore */
        }
        return fail(400, "文件过大，最大 5MB。");
      }

      let imageUrl: string;
      const tmpToUnlink: string[] = [file.filepath];

      if (process.env.USE_BLOB_STORAGE === "true") {
        let streamPath = file.filepath;
        const compressedPath = file.filepath + "-compressed.jpg";
        try {
          await sharp(file.filepath, { failOnError: false })
            .rotate()
            .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
            .jpeg({ quality: 80, mozjpeg: true })
            .toFile(compressedPath);
          tmpToUnlink.push(compressedPath);
          streamPath = compressedPath;
        } catch (e) {
          console.error("upload sharp (blob)", e);
        }
        const fileName = `pixelnest/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
        const stream = fs.createReadStream(streamPath);
        const blob = await put(fileName, stream, { access: "public" });
        imageUrl = blob.url;
        for (const p of tmpToUnlink) {
          try {
            fs.unlinkSync(p);
          } catch {
            /* ignore */
          }
        }
      } else {
        const uploadsPublic = path.join(process.cwd(), "public", "uploads");
        fs.mkdirSync(uploadsPublic, { recursive: true });
        const compressedPath = file.filepath + "-compressed.jpg";
        let destAbs: string;
        let destWeb: string;
        try {
          await sharp(file.filepath, { failOnError: false })
            .rotate()
            .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
            .jpeg({ quality: 80, mozjpeg: true })
            .toFile(compressedPath);
          const fileName = path.basename(compressedPath);
          destAbs = path.join(uploadsPublic, fileName);
          destWeb = `/uploads/${fileName}`;
          fs.renameSync(compressedPath, destAbs);
          try {
            fs.unlinkSync(file.filepath);
          } catch {
            /* ignore */
          }
        } catch (e) {
          console.error("upload sharp (local)", e);
          const ext = path.extname(file.originalFilename || "") || ".bin";
          const fileName = `up-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
          destAbs = path.join(uploadsPublic, fileName);
          destWeb = `/uploads/${fileName}`;
          fs.copyFileSync(file.filepath, destAbs);
          try {
            fs.unlinkSync(file.filepath);
          } catch {
            /* ignore */
          }
        }
        imageUrl = destWeb!;
      }

      const createdImage = await prisma.image.create({
        data: {
          title: String(title),
          description: String(description),
          tags,
          url: imageUrl,
          userId: uploader.id,
        },
      });

      return res.status(201).json({ id: createdImage.id, url: imageUrl });
    } catch (e) {
      console.error("upload", e);
      return fail(500, "上传失败，请换一张图片或稍后重试。");
    }
  });
}
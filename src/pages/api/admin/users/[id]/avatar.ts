import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";
import { assertAdmin } from "@/utils/adminAuth";

export const config = {
  api: { bodyParser: false },
};

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "不允许的请求方法" });
  if (!assertAdmin(req, res)) return;

  const id = typeof req.query.id === "string" ? req.query.id : "";
  if (!id) return res.status(400).json({ message: "缺少用户 ID" });

  const exists = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return res.status(404).json({ message: "用户不存在" });

  const form = formidable({ multiples: false, maxFileSize: 2 * 1024 * 1024 });
  form.parse(req, async (err, _fields, files) => {
    if (err) return res.status(500).json({ message: "上传处理出错" });

    const file = files.avatar as File | File[] | undefined;
    const avatarFile = Array.isArray(file) ? file[0] : file;
    if (!avatarFile?.filepath) {
      return res.status(400).json({ message: "请选择头像文件" });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(avatarFile.mimetype || "")) {
      try {
        fs.unlinkSync(avatarFile.filepath);
      } catch {
        /* ignore */
      }
      return res.status(400).json({ message: "须为 jpg、png、gif、webp" });
    }

    let avatarPath: string;

    try {
      if (process.env.USE_BLOB_STORAGE === "true") {
        const fileName = `pixelnest/avatars/admin-${id}${path.extname(avatarFile.originalFilename || "")}`;
        const stream = fs.createReadStream(avatarFile.filepath);
        const blob = await put(fileName, stream, { access: "public", allowOverwrite: true });
        avatarPath = blob.url;
        fs.unlinkSync(avatarFile.filepath);
      } else {
        const uploadDir = path.join(process.cwd(), "public", "avatars");
        fs.mkdirSync(uploadDir, { recursive: true });
        const fileName = `admin-${id}-avatar${path.extname(avatarFile.originalFilename || ".jpg")}`;
        const filePath = path.join(uploadDir, fileName);
        fs.renameSync(avatarFile.filepath, filePath);
        avatarPath = `/avatars/${fileName}`;
      }

      const user = await prisma.user.update({
        where: { id },
        data: { avatar: avatarPath },
        select: {
          id: true,
          email: true,
          username: true,
          nickname: true,
          avatar: true,
          followerCount: true,
          muted: true,
          _count: { select: { images: true } },
        },
      });

      return res.status(200).json({ user });
    } catch (e) {
      console.error("admin avatar", e);
      return res.status(500).json({ message: "保存失败" });
    }
  });
}

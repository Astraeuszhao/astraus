import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient, Prisma } from "@prisma/client";
import { GALLERY_CATEGORY_FILTERS } from "@/constants/galleryFilters";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "12", 10);
    const skip = (page - 1) * limit;
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const catParam = typeof req.query.cat === "string" ? req.query.cat.trim() : "";

    const and: Prisma.ImageWhereInput[] = [];
    if (q) {
      and.push({
        OR: [
          { title: { contains: q, mode: Prisma.QueryMode.insensitive } },
          { description: { contains: q, mode: Prisma.QueryMode.insensitive } },
          { tags: { has: q } },
          {
            user: {
              OR: [
                { username: { contains: q, mode: Prisma.QueryMode.insensitive } },
                { nickname: { contains: q, mode: Prisma.QueryMode.insensitive } },
                { publicUid: { contains: q } },
              ],
            },
          },
        ],
      });
    }
    const catDef = GALLERY_CATEGORY_FILTERS.find((f) => f.label === catParam);
    if (catDef) {
      and.push({
        OR: [
          { tags: { has: catParam } },
          ...catDef.keywords.flatMap((kw) => [
            { title: { contains: kw, mode: Prisma.QueryMode.insensitive } },
            { description: { contains: kw, mode: Prisma.QueryMode.insensitive } },
          ]),
        ],
      });
    }
    const where: Prisma.ImageWhereInput = and.length ? { AND: and } : {};

    const [images, total] = await Promise.all([
      prisma.image.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, email: true, username: true, avatar: true },
          },
        },
      }),
      prisma.image.count({ where }),
    ]);

    return res.status(200).json({
      images,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (e) {
    console.error("public-gallery", e);
    const unreachable =
      typeof e === "object" &&
      e !== null &&
      ("name" in e && (e as { name: string }).name === "PrismaClientInitializationError" ||
        ("code" in e && (e as { code: string }).code === "P1001") ||
        ("errorCode" in e && (e as { errorCode: string }).errorCode === "P1001"));
    if (unreachable) {
      return res.status(503).json({
        message:
          "无法连接数据库。请确认 PostgreSQL 已启动且 .env 中 DATABASE_URL 正确，然后重启开发服务。",
      });
    }
    return res.status(500).json({
      message: "搜索或加载画廊失败，请稍后重试。若刚更新过程序，请执行 npx prisma migrate deploy 并重启服务。",
    });
  }
}
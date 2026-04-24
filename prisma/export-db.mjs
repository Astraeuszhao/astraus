import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

/** 导出业务表元数据为 prisma/db-export.json（不含密码） */
const p = new PrismaClient();
const users = await p.user.findMany({
  orderBy: { createdAt: "asc" },
  select: {
    id: true,
    email: true,
    username: true,
    publicUid: true,
    nickname: true,
    createdAt: true,
    avatar: true,
    bio: true,
    followerCount: true,
  },
});
const images = await p.image.findMany({ orderBy: { createdAt: "asc" } });
const imageLikes = await p.imageLike.findMany({ orderBy: { createdAt: "asc" } });
const follows = await p.follow.findMany({ orderBy: { createdAt: "asc" } });

const out = {
  exportedAt: new Date().toISOString(),
  users,
  images,
  imageLikes,
  follows,
};

const dest = path.join(process.cwd(), "prisma", "db-export.json");
fs.writeFileSync(dest, JSON.stringify(out, null, 2), "utf8");
console.log("Written:", dest);
console.log(
  "Counts — users:",
  users.length,
  "images:",
  images.length,
  "likes:",
  imageLikes.length,
  "follows:",
  follows.length,
);
await p.$disconnect();

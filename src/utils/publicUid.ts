import type { PrismaClient } from "@prisma/client";

/** 12 位数字，注册或首次打开资料时写入，全站唯一 */
export async function mintPublicUid(prisma: PrismaClient): Promise<string> {
  for (let attempt = 0; attempt < 25; attempt++) {
    const uid = String(Math.floor(100_000_000_000 + Math.random() * 900_000_000_000));
    const clash = await prisma.user.findFirst({ where: { publicUid: uid }, select: { id: true } });
    if (!clash) return uid;
  }
  throw new Error("无法生成唯一用户编号");
}

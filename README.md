# PixelNest（仓库名：`pixelnest`）

> **PixelNest** 是面向访客的公开图片画廊与社区功能品牌；本仓库为 **Astraus** 维护的全栈实现（Next.js + Prisma + PostgreSQL）。

- **GitHub 源码**：[Astraeuszhao/pixelnest](https://github.com/Astraeuszhao/pixelnest)（`git clone`、Issue、PR 均在此；`package.json` 的 `repository` 同址）
- 在 GitHub 上打开仓库时，如尚未填写 **About** 说明，可写一句：`PixelNest — public image gallery (Next.js + Prisma). Maintained by Astraus.` 并加 topics：`nextjs` `prisma` `image-gallery` 等

|  | 技术 |
|--|------|
| 运行环境 | [Node.js](https://nodejs.org/) 20+ |
| 框架 | [Next.js](https://nextjs.org/) 15、React 19、TypeScript |
| 样式 | [Tailwind CSS](https://tailwindcss.com/) 4 |
| 数据 | [Prisma](https://www.prisma.io/) 6、PostgreSQL |
| 登录 | [NextAuth.js](https://next-auth.js.org/) v4（Credentials + JWT） |
| 媒体 | 本地 `public/uploads` / `public/avatars`，或 Blob（`USE_BLOB_STORAGE=true`） |

## 快速开始

1. 复制 [`.env.example`](./.env.example) 为 `.env` 并填写。  
2. 启动 PostgreSQL（可 `docker compose up -d`），库名与 `DATABASE_URL` 一致。  
3. `npx prisma migrate deploy`  
4. 可选：`npx prisma db seed`  
5. `npm install` → `npm run dev`（默认端口见 `package.json`）

## 安全提示

- **切勿** 将含密钥的 `.env` 或数据库导出推送到远程；规则见 [`.gitignore`](./.gitignore)。  
- 生产环境务必更换 [`.env.example`](./.env.example) 中示例密码与 `NEXTAUTH_SECRET`。

## 许可

[MIT](LICENSE) · Copyright (c) Astraus

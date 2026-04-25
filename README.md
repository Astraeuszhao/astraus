# Astraus

图文分享站点：注册登录、上传、公开画廊、点赞与关注、个人资料与设置、管理后台（`/admin`）。

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 15（Pages Router）、React 19、TypeScript |
| UI | Tailwind CSS 4 |
| 数据 | Prisma 6、PostgreSQL |
| 鉴权 | NextAuth.js 4（Credentials + JWT） |
| 媒体 | 本地 `public/uploads` / `public/avatars`，或对象存储 Blob（`USE_BLOB_STORAGE=true`） |

## 目录结构（摘要）

```
src/pages/           # 页面与 pages/api/*
src/components/
prisma/schema.prisma
prisma/migrations/
prisma/seed.mjs
```

## 环境与数据库

1. 复制 `.env.example` 为 `.env`。
2. PostgreSQL：本机实例，或 **`docker compose up -d`**（默认库 **`astraus_dev`**，与 `.env.example` 中 `DATABASE_URL` 一致）。
3. `npx prisma migrate deploy`
4. （可选）`npx prisma db seed`
5. `npm install` → `npm run dev`（端口见 `package.json`）

许可：**MIT**（`LICENSE`）。

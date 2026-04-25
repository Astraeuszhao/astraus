# Astraus

> 全栈图片分享与社交：公开画廊、点赞与关注、个人资料、**Astraus** 管理后台（`/admin`）。

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

- **切勿** 将含密钥的 `.env` 或数据库导出推送到远程仓库；本地忽略规则见 [`.gitignore`](./.gitignore)。  
- 生产环境务必更换 [`.env.example`](./.env.example) 中示例密码与 `NEXTAUTH_SECRET`。

## 许可

[MIT](LICENSE) · Copyright (c) Astraus

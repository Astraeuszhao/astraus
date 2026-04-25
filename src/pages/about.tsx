import Navbar from "@/components/Navbar";
import Head from "next/head";

export default function About() {
  return (
    <>
      <Head>
        <title>关于 | PixelNest</title>
      </Head>
      <Navbar />
      <div className="max-w-xl mx-4 sm:mx-auto mt-8 p-6 border rounded bg-[var(--card)] text-[var(--card-foreground)] shadow-lg">
        <h1 className="text-2xl font-bold mb-3">关于</h1>
        <p className="text-[var(--muted-foreground)] text-sm leading-relaxed">
          <strong>PixelNest</strong> 是公开图片分享站点：浏览、上传、点赞与关注。项目由 <strong>Astraus</strong> 开发与维护。部署见 README；许可 MIT。
        </p>
      </div>
    </>
  );
}

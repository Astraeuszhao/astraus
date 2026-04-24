import Link from "next/link";

export default function Custom404() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center bg-background text-foreground">
      <h1 className="text-5xl font-bold mb-4">404</h1>
      <p className="text-xl mb-6">抱歉，您访问的页面不存在。</p>
      <Link href="/" className="text-[#f43f5e] underline text-lg">
        返回首页
      </Link>
    </div>
  );
}

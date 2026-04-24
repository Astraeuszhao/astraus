import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import Toast from "@/components/Toast";
import Image from "next/image";
import Button from "@/components/Button";
import Head from "next/head";
import TagChipsPicker from "@/components/TagChipsPicker";
import { FaCloudUploadAlt } from "react-icons/fa";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export default function Upload() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setFileError(null);
    setImage(null);
    setPreview(null);

    if (file) {
      if (file.size > MAX_SIZE) {
        setFileError("文件过大，单张最大 5MB。");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  }

  function handleRemoveImage() {
    setImage(null);
    setPreview(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!image || success) return;
    setLoading(true);
    setToast(null);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("tags", JSON.stringify(tags));
    formData.append("image", image);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setToast({ message: "上传成功！", type: "success" });
        setSuccess(true);
        setTimeout(() => router.push(`/image/${data.id}`), 1200);
      } else {
        const data = await res.json();
        setToast({ message: data.message || "上传失败", type: "error" });
      }
    } catch {
      setToast({ message: "上传失败", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || status === "unauthenticated") return null;

  return (
    <>
      <Head>
        <title>上传 | ASTRAEUS</title>
      </Head>
      <Navbar />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="min-h-[calc(100vh-6rem)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] text-center mb-2">
            上传作品
          </h1>
          <p className="text-center text-sm text-[var(--muted-foreground)] mb-8">
            添加标题、描述与 # 标签，与大家分享你的瞬间
          </p>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-sm overflow-hidden"
          >
            <div className="p-6 sm:p-8 space-y-6">
              {preview ? (
                <div className="relative rounded-xl overflow-hidden bg-[var(--muted)]/30 border border-[var(--border)]">
                  <Image
                    src={preview}
                    alt="预览"
                    width={1200}
                    height={800}
                    className="w-full max-h-[min(420px,50vh)] object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-3 right-3 rounded-full bg-black/65 text-white w-9 h-9 flex items-center justify-center text-xl leading-none hover:bg-black/80 transition"
                    aria-label="移除图片"
                    disabled={loading || success}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || success}
                  className="w-full min-h-[200px] rounded-xl border-2 border-dashed border-[var(--border)] bg-[#f3f3f4]/80 dark:bg-[var(--muted)]/40 flex flex-col items-center justify-center gap-3 text-[var(--muted-foreground)] hover:border-[rgba(234,76,137,0.45)] hover:bg-[var(--muted)]/25 transition cursor-pointer disabled:opacity-50"
                >
                  <FaCloudUploadAlt className="w-12 h-12 opacity-80" aria-hidden />
                  <span className="text-sm font-medium text-[var(--foreground)]">点击选择图片</span>
                  <span className="text-xs">支持常见图片格式，最大 5MB</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                aria-label="选择图片"
                onChange={handleFileChange}
                required={!image}
                className="hidden"
                disabled={loading || success}
              />
              {fileError && <p className="text-sm text-red-500">{fileError}</p>}

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground)]">标题</label>
                <input
                  type="text"
                  placeholder="给作品起个名字"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full rounded-lg border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] px-3 py-2.5 text-sm outline-none focus:border-[rgba(234,76,137,0.4)] focus:shadow-[0_0_0_3px_rgb(234_76_137/0.08)] transition"
                  disabled={loading || success}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground)]">描述</label>
                <textarea
                  placeholder="简单介绍这张照片或创作想法"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  className="w-full rounded-lg border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] px-3 py-2.5 text-sm outline-none focus:border-[rgba(234,76,137,0.4)] focus:shadow-[0_0_0_3px_rgb(234_76_137/0.08)] transition resize-y min-h-[100px]"
                  disabled={loading || success}
                />
              </div>

              <TagChipsPicker value={tags} onChange={setTags} disabled={loading || success} />

              <Button
                type="submit"
                loading={loading}
                success={success}
                loadingMessage="上传并处理中…"
                successMessage="上传成功！"
                fullWidth
                disabled={!!fileError || !image}
                className="rounded-xl py-3"
              >
                发布
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

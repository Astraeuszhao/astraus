import { GALLERY_TAG_LABELS } from "@/constants/galleryFilters";

const allowed = new Set(GALLERY_TAG_LABELS);

/** 解析上传/更新接口中的标签：仅保留白名单内、去重、最多 max 个 */
export function normalizeImageTags(raw: unknown, max = 8): string[] {
  let arr: unknown[] = [];
  if (Array.isArray(raw)) arr = raw;
  else if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw) as unknown;
      if (Array.isArray(p)) arr = p;
    } catch {
      return [];
    }
  } else return [];

  const out: string[] = [];
  for (const x of arr) {
    if (typeof x !== "string") continue;
    const t = x.trim();
    if (!allowed.has(t)) continue;
    if (!out.includes(t)) out.push(t);
    if (out.length >= max) break;
  }
  return out;
}

/**
 * Normalize paths stored on Windows (backslashes) or missing leading slash
 * for next/image and <img> public URLs. Leaves http(s) URLs unchanged.
 */
export function publicAssetUrl(url: string | null | undefined): string {
  if (url == null) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const qIndex = trimmed.indexOf("?");
  const pathPart = qIndex >= 0 ? trimmed.slice(0, qIndex) : trimmed;
  const query = qIndex >= 0 ? trimmed.slice(qIndex) : "";
  const normalized = "/" + pathPart.replace(/\\/g, "/").replace(/^\/+/, "");
  return normalized + query;
}

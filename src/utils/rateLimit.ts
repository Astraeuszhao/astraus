type RateLimitStore = Record<string, { count: number; reset: number }>;

export function rateLimit(
  store: RateLimitStore,
  key: string,
  limit: number,
  windowMs: number
): { limited: boolean; wait?: number } {
  const now = Date.now();
  if (!store[key] || now > store[key].reset) {
    store[key] = { count: 1, reset: now + windowMs };
  } else {
    store[key].count += 1;
  }
  if (store[key].count > limit) {
    const wait = Math.ceil((store[key].reset - now) / 1000);
    return { limited: true, wait };
  }
  return { limited: false };
}
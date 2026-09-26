// In-memory sliding-window limit per client IP. Best effort: per server instance, reset on cold start.
export const RATE_LIMIT = 20;
export const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_TRACKED = 5000; // bound memory under many distinct IPs

export interface RateLimiter {
  allow: (key: string) => boolean;
  reset: () => void;
}

export function createRateLimiter(limit = RATE_LIMIT, windowMs = RATE_WINDOW_MS, now: () => number = Date.now): RateLimiter {
  const hits = new Map<string, number[]>();
  return {
    allow(key) {
      const t = now();
      const recent = (hits.get(key) ?? []).filter((ts) => t - ts < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return false;
      }
      recent.push(t);
      hits.delete(key); // re-insert so Map order tracks recency
      hits.set(key, recent);
      if (hits.size > MAX_TRACKED) hits.delete(hits.keys().next().value!);
      return true;
    },
    reset: () => hits.clear(),
  };
}

// The /api/judge limiter: 20 requests per IP per 10 minutes, per server instance (best effort).
export const judgeLimiter = createRateLimiter();

// Vercel sets x-forwarded-for; the first entry is the client.
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}

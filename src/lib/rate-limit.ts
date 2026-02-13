type RateLimitState = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

const RATE_LIMIT_BUCKETS = new Map<string, RateLimitState>();

// Cleanup expired entries periodically to prevent memory leak
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
let lastCleanup = Date.now();

function cleanupExpiredBuckets() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  for (const [key, state] of RATE_LIMIT_BUCKETS) {
    if (state.resetAt <= now) {
      RATE_LIMIT_BUCKETS.delete(key);
    }
  }
  lastCleanup = now;
}

export function checkRateLimit(key: string, options: { limit: number; windowMs: number }): RateLimitResult {
  // Clean up expired entries periodically
  cleanupExpiredBuckets();
  const { limit, windowMs } = options;
  const now = Date.now();
  const existing = RATE_LIMIT_BUCKETS.get(key);

  let state: RateLimitState;
  if (!existing || existing.resetAt <= now) {
    state = { count: 0, resetAt: now + windowMs };
  } else {
    state = existing;
  }

  if (state.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((state.resetAt - now) / 1000));
    RATE_LIMIT_BUCKETS.set(key, state);
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt: state.resetAt,
      retryAfterSeconds
    };
  }

  state.count += 1;
  RATE_LIMIT_BUCKETS.set(key, state);

  const remaining = Math.max(0, limit - state.count);
  return {
    allowed: true,
    limit,
    remaining,
    resetAt: state.resetAt,
    retryAfterSeconds: Math.max(1, Math.ceil((state.resetAt - now) / 1000))
  };
}

export function getClientIp(request: Request) {
  // Prefer Vercel's trusted x-real-ip header (set by platform, not spoofable)
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  // Fallback to x-forwarded-for, but use rightmost IP
  // The rightmost IP is the one added by the first trusted proxy,
  // while leftmost can be spoofed by the client
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map((ip) => ip.trim()).filter(Boolean);
    if (ips.length > 0) {
      // Use rightmost IP (closest to server, added by trusted proxy)
      return ips[ips.length - 1];
    }
  }

  return "unknown";
}

export function __resetRateLimitForTests() {
  RATE_LIMIT_BUCKETS.clear();
}

// Default rate limits for different endpoint types
export const RATE_LIMITS = {
  // Read endpoints that call external APIs (protect quota)
  externalApi: { limit: 60, windowMs: 60000 }, // 60/min
  // Write endpoints (more restrictive)
  write: { limit: 10, windowMs: 60000 } // 10/min
} as const;

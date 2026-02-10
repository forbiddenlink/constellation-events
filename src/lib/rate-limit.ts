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

export function checkRateLimit(key: string, options: { limit: number; windowMs: number }): RateLimitResult {
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
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}

export function __resetRateLimitForTests() {
  RATE_LIMIT_BUCKETS.clear();
}

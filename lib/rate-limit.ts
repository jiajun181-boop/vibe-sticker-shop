/**
 * In-memory rate limiter for serverless functions.
 * Uses a sliding window approach with automatic cleanup.
 *
 * Usage:
 *   const limiter = createRateLimiter({ windowMs: 60_000, max: 5 });
 *   // In route handler:
 *   const ip = request.headers.get("x-forwarded-for") || "unknown";
 *   const { success, remaining } = limiter.check(ip);
 *   if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 */

interface RateLimiterOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
}

interface HitRecord {
  timestamps: number[];
}

export function createRateLimiter({ windowMs, max }: RateLimiterOptions) {
  const hits = new Map<string, HitRecord>();
  let lastCleanup = Date.now();

  function cleanup() {
    const now = Date.now();
    // Only cleanup every 60 seconds to avoid overhead
    if (now - lastCleanup < 60_000) return;
    lastCleanup = now;
    const cutoff = now - windowMs;
    for (const [key, record] of hits) {
      record.timestamps = record.timestamps.filter((t) => t > cutoff);
      if (record.timestamps.length === 0) hits.delete(key);
    }
  }

  function check(key: string): { success: boolean; remaining: number; retryAfterMs: number } {
    cleanup();
    const now = Date.now();
    const cutoff = now - windowMs;

    let record = hits.get(key);
    if (!record) {
      record = { timestamps: [] };
      hits.set(key, record);
    }

    // Remove expired timestamps
    record.timestamps = record.timestamps.filter((t) => t > cutoff);

    if (record.timestamps.length >= max) {
      const oldestInWindow = record.timestamps[0];
      const retryAfterMs = oldestInWindow + windowMs - now;
      return { success: false, remaining: 0, retryAfterMs: Math.max(retryAfterMs, 0) };
    }

    record.timestamps.push(now);
    return { success: true, remaining: max - record.timestamps.length, retryAfterMs: 0 };
  }

  return { check };
}

// Pre-configured limiters for common use cases
// Auth routes: 10 attempts per 15 minutes
export const authLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 });

// Admin login: 5 attempts per 15 minutes (stricter)
export const adminLoginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 });

// Contact form: 3 submissions per 10 minutes
export const contactLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 3 });

// Checkout: 10 per 5 minutes
export const checkoutLimiter = createRateLimiter({ windowMs: 5 * 60 * 1000, max: 10 });

// Forgot password: 3 per 15 minutes
export const forgotPasswordLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 3 });

// Upload endpoints: 20 per 10 minutes
export const uploadLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 20 });

/**
 * Helper to extract client IP from request
 */
export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

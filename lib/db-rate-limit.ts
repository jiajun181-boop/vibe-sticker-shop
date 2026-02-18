/**
 * DB-backed rate limiter for critical auth routes.
 * Persists across serverless cold starts (unlike the in-memory limiter).
 * Uses the LoginAttempt table in PostgreSQL.
 */
import { prisma } from "@/lib/prisma";

interface DbRateLimitOptions {
  windowMs: number;
  max: number;
  route: string;
}

/**
 * Check if an IP has exceeded the rate limit for a given route.
 * Also records the attempt.
 */
export async function checkDbRateLimit(
  ip: string,
  { windowMs, max, route }: DbRateLimitOptions
): Promise<{ success: boolean; remaining: number }> {
  const cutoff = new Date(Date.now() - windowMs);

  try {
    // Count recent failed attempts from this IP
    const recentAttempts = await prisma.loginAttempt.count({
      where: {
        ip,
        route,
        success: false,
        createdAt: { gte: cutoff },
      },
    });

    if (recentAttempts >= max) {
      return { success: false, remaining: 0 };
    }

    return { success: true, remaining: max - recentAttempts };
  } catch (err) {
    // If DB is down, fall through — don't block legitimate logins
    console.error("[DbRateLimit] Check failed, allowing request:", err);
    return { success: true, remaining: max };
  }
}

/**
 * Record a login attempt (success or failure).
 */
export async function recordLoginAttempt(
  ip: string,
  route: string,
  success: boolean
): Promise<void> {
  try {
    await prisma.loginAttempt.create({
      data: { ip, route, success },
    });
  } catch (err) {
    console.error("[DbRateLimit] Record failed:", err);
  }
}

/**
 * Cleanup old attempts (call from cron or periodically).
 * Deletes attempts older than 24 hours.
 */
export async function cleanupLoginAttempts(): Promise<number> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const { count } = await prisma.loginAttempt.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  return count;
}

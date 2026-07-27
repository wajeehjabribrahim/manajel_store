import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * DB-backed fixed-window rate limiter.
 * Survives restarts/deploys and works across serverless instances,
 * unlike the in-memory limiter in middleware (kept as a first layer).
 *
 * Fails open on DB errors so an outage never blocks legitimate traffic.
 */
export async function checkDbRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const now = new Date();

  try {
    const bucket = await prisma.rateLimitBucket.findUnique({ where: { key } });

    if (!bucket || bucket.resetAt <= now) {
      await prisma.rateLimitBucket.upsert({
        where: { key },
        update: { count: 1, resetAt: new Date(now.getTime() + windowMs) },
        create: { key, count: 1, resetAt: new Date(now.getTime() + windowMs) },
      });
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if (bucket.count >= limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((bucket.resetAt.getTime() - now.getTime()) / 1000)
        ),
      };
    }

    await prisma.rateLimitBucket.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
    return { allowed: true, retryAfterSeconds: 0 };
  } catch (error) {
    console.error("[rateLimit] DB error, failing open:", error);
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

export function getRequestIp(req: Request | NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

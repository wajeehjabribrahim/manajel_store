import { NextRequest, NextResponse } from "next/server";

type Bucket = {
  count: number;
  resetAt: number;
};

const globalForRateLimit = globalThis as typeof globalThis & {
  __manajelRateLimitStore__?: Map<string, Bucket>;
};

const rateLimitStore =
  globalForRateLimit.__manajelRateLimitStore__ ?? new Map<string, Bucket>();

if (!globalForRateLimit.__manajelRateLimitStore__) {
  globalForRateLimit.__manajelRateLimitStore__ = rateLimitStore;
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

function getRateLimitConfig(pathname: string) {
  if (pathname.startsWith("/api/auth")) {
    return { key: "auth", limit: 20, windowMs: 60_000 };
  }
  if (pathname.startsWith("/api/orders")) {
    return { key: "orders", limit: 60, windowMs: 60_000 };
  }
  return { key: "contact", limit: 20, windowMs: 60_000 };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const response = NextResponse.next();

  // Skip noisy NextAuth client endpoints to avoid false 429s.
  if (
    pathname === "/api/auth/session" ||
    pathname.startsWith("/api/auth/session/") ||
    pathname === "/api/auth/_log" ||
    pathname.startsWith("/api/auth/_log/")
  ) {
    return response;
  }

  // Cache shop and product pages for 1 hour
  if (pathname === "/shop" || pathname.startsWith("/shop/") || pathname.startsWith("/products/")) {
    response.headers.set("Cache-Control", "public, max-age=3600");
  }

  if (
    !pathname.startsWith("/api/auth") &&
    !pathname.startsWith("/api/orders") &&
    !pathname.startsWith("/api/contact")
  ) {
    return response;
  }

  const { key, limit, windowMs } = getRateLimitConfig(pathname);
  const ip = getClientIp(request);
  const bucketKey = `${key}:${ip}`;
  const now = Date.now();

  const existing = rateLimitStore.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return response;
  }

  if (existing.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
        },
      }
    );
  }

  existing.count += 1;
  rateLimitStore.set(bucketKey, existing);

  return response;
}

export const config = {
  matcher: ["/api/auth/:path*", "/api/orders/:path*", "/api/contact/:path*"],
};

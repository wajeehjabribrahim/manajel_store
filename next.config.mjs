import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    scrollRestoration: true,
    // Next 14 ignores instrumentation.ts without this flag, which would leave
    // server-side Sentry silently uninitialised. (Default-on from Next 15.)
    instrumentationHook: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "imgur.com",
      },
      {
        protocol: "https",
        hostname: "i.imgur.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async rewrites() {
    return {
      // Serve the standalone cinematic landing page (public/landing/) at the root URL.
      beforeFiles: [
        {
          source: "/",
          destination: "/landing/index.html",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  async redirects() {
    return [
      // Legacy store URLs (pre-merge) now live under /store.
      {
        source:
          "/:seg(shop|cart|login|register|account|orders|about|contact|faq|shipping-policy|return-policy|privacy-policy|admin|products)",
        destination: "/store/:seg",
        permanent: true,
      },
      {
        source:
          "/:seg(shop|cart|login|register|account|orders|about|contact|faq|shipping-policy|return-policy|privacy-policy|admin|products)/:path*",
        destination: "/store/:seg/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "mnajel.com",
          },
        ],
        destination: "https://www.mnajel.com/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || ['http://localhost:3000'];
    // `next dev` compiles modules through eval for hot reloading. Without this
    // the React bundle throws a CSP EvalError locally and never hydrates, which
    // makes pages hang on their loading skeletons — production builds contain no
    // eval, so the strict policy below still applies to real visitors.
    const devScriptSrc = process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : '';
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      `script-src 'self' 'unsafe-inline'${devScriptSrc}`,
      "connect-src 'self' https:",
      "form-action 'self'",
    ].join('; ');

    // The landing page (served at / from public/landing/) loads GSAP, Lenis and
    // the Tailwind CDN plus Google Fonts, so it needs its own relaxed CSP.
    const landingCsp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "img-src 'self' data:",
      "media-src 'self'",
      "font-src 'self' data: https://fonts.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      `script-src 'self' 'unsafe-inline'${devScriptSrc} https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net`,
      "connect-src 'self'",
      "form-action 'self'",
    ].join('; ');

    return [
      // Private / account pages must never be indexed — keep them out of search
      // results so they can't outrank the homepage or shop pages.
      {
        source: '/store/:seg(admin|account|cart|login|register|orders)/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
      {
        source: '/store/:seg(admin|account|cart|login|register|orders)',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
      {
        source: '/store/shop',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, immutable',
          },
        ],
      },
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, immutable',
          },
        ],
      },
      {
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, immutable',
          },
        ],
      },
      {
        source: '/store/shop/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
        ],
      },
      {
        source: '/store/products/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
        ],
      },
      {
        source: '/landing/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, immutable',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      // Placed after the catch-all so these override its CSP for the landing page only.
      {
        source: '/',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: landingCsp,
          },
        ],
      },
      {
        source: '/landing/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: landingCsp,
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};

// Only wrap the config when Sentry is actually configured — without a DSN the
// wrapper adds build work and warnings for no benefit. Source maps are uploaded
// only when SENTRY_AUTH_TOKEN is present as well.
const sentryEnabled = Boolean(
  process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
);

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: true,
      // Hide source maps from the public bundle after uploading them.
      widenClientFileUpload: true,
      sourcemaps: { deleteSourcemapsAfterUpload: true },
      // Route Sentry's browser requests through the app so ad blockers don't
      // swallow client-side error reports.
      tunnelRoute: "/monitoring",
      disableLogger: true,
    })
  : nextConfig;

import * as Sentry from "@sentry/nextjs";

// Fully inert until SENTRY_DSN is set in the environment, so local development
// and any deploy without the key behave exactly as before.
const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    // 10% of transactions is plenty for a store this size and keeps the free
    // tier from filling up on launch day.
    tracesSampleRate: 0.1,
    // Order/contact payloads carry customer names, phones and addresses —
    // never ship request bodies or cookies to a third party.
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers.cookie;
          delete event.request.headers.authorization;
        }
      }
      return event;
    },
  });
}

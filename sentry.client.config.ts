import * as Sentry from "@sentry/nextjs";

// Next 14 loads the browser SDK from this filename; instrumentation-client.ts
// is only picked up from Next 15.3 onward.
//
// The DSN has to be NEXT_PUBLIC_ to reach the client bundle; it is a write-only
// key and safe to expose. Inert when unset.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    // No session replay: it records the checkout form, which carries customer
    // names, phone numbers and addresses.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    sendDefaultPii: false,
  });
}

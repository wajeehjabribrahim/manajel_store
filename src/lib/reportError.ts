import * as Sentry from "@sentry/nextjs";

/**
 * Reports a caught error to Sentry as well as the console.
 *
 * Routes here catch their own errors and return a 500 JSON body, which means
 * Sentry's automatic instrumentation never sees them — an order that fails for
 * a customer would otherwise leave no trace beyond a console line nobody reads.
 *
 * Safe to call when Sentry is not configured: captureException is a no-op then.
 */
export function reportError(error: unknown, context: string, extra?: Record<string, unknown>) {
  console.error(`[${context}]`, error);

  Sentry.captureException(error, {
    tags: { context },
    // Never pass customer data in `extra` — order ids and counts only.
    extra,
  });
}

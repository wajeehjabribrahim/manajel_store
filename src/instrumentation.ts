// Next.js loads this once per server/edge runtime before anything else.
// It must live inside src/ because this project uses a src directory —
// at the repo root Next silently ignores it.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export { captureRequestError as onRequestError } from "@sentry/nextjs";

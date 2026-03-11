import * as Sentry from "@sentry/nextjs";

// Only initialize if DSN is configured — no-op otherwise
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,

    // Sample 100% of errors, 10% of transactions in production
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,

    // Filter noise — don't send these to Sentry
    ignoreErrors: [
      // Browser extensions
      "ResizeObserver loop",
      "ResizeObserver loop completed with undelivered notifications",
      // Network issues (customer's connection, not our bug)
      "Failed to fetch",
      "NetworkError",
      "Load failed",
      "AbortError",
      // Next.js hydration (usually benign)
      "Hydration failed",
      "Text content does not match",
    ],

    beforeSend(event) {
      // Strip PII from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((b) => {
          if (b.category === "xhr" || b.category === "fetch") {
            // Don't send full request URLs for checkout/auth routes
            const url = b.data?.url || "";
            if (url.includes("/api/checkout") || url.includes("/api/auth")) {
              b.data = { ...b.data, url: url.split("?")[0] };
            }
          }
          return b;
        });
      }
      return event;
    },
  });
}

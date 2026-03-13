import * as Sentry from "@sentry/nextjs";

if (process.env.ENABLE_SENTRY === "true" && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Tag checkout/payment errors as high priority
    beforeSend(event) {
      const url = event.request?.url || "";
      if (url.includes("/api/checkout") || url.includes("/api/webhook")) {
        event.level = "fatal";
        event.tags = { ...event.tags, revenue_critical: "true" };
      }
      return event;
    },
  });
}

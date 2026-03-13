const clientSentryEnabled =
  process.env.NEXT_PUBLIC_ENABLE_SENTRY === "true" &&
  process.env.NEXT_PUBLIC_SENTRY_DSN;

export function captureClientException(error) {
  if (process.env.NODE_ENV !== "production") {
    console.error(error);
  }

  if (!clientSentryEnabled || typeof window === "undefined") {
    return;
  }

  const sentry = window.Sentry;
  if (sentry && typeof sentry.captureException === "function") {
    sentry.captureException(error);
  }
}

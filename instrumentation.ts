const sentryEnabled = process.env.ENABLE_SENTRY === "true" && process.env.SENTRY_DSN;

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && sentryEnabled) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    });
  }
}

export async function onRequestError(
  error: { digest: string } & Error,
  request: { path: string; method: string; headers: Record<string, string> },
  context: { routerKind: string; routePath: string; routeType: string; renderSource: string },
) {
  if (process.env.ENABLE_SENTRY === "true" && process.env.SENTRY_DSN) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureException(error, {
      tags: {
        routerKind: context.routerKind,
        routePath: context.routePath,
        routeType: context.routeType,
      },
      extra: {
        method: request.method,
        path: request.path,
        renderSource: context.renderSource,
      },
    });
  }
}

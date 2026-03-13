import fs from "fs";
import path from "path";

const nextConfigPath = path.resolve(__dirname, "../next.config.ts");
const instrumentationPath = path.resolve(__dirname, "../instrumentation.ts");
const serverConfigPath = path.resolve(__dirname, "../sentry.server.config.ts");
const clientConfigPath = path.resolve(__dirname, "../sentry.client.config.ts");
const clientHelperPath = path.resolve(__dirname, "../lib/sentry-client.js");
const appErrorPath = path.resolve(__dirname, "../app/error.js");
const globalErrorPath = path.resolve(__dirname, "../app/global-error.js");
const packageJsonPath = path.resolve(__dirname, "../package.json");

describe("Sentry disablement and build hardening", () => {
  test("next config no longer wraps the app in Sentry", () => {
    const src = fs.readFileSync(nextConfigPath, "utf-8");
    expect(src).not.toContain('process.env.ENABLE_SENTRY === "true"');
    expect(src).not.toContain("withSentryConfig");
  });

  test("instrumentation is a no-op and does not initialize Sentry at runtime", () => {
    const src = fs.readFileSync(instrumentationPath, "utf-8");
    expect(src).not.toContain('process.env.ENABLE_SENTRY === "true"');
    expect(src).not.toContain("Sentry.init");
    expect(src).toContain("return;");
  });

  test("server and client Sentry configs are both opt-in", () => {
    const serverSrc = fs.readFileSync(serverConfigPath, "utf-8");
    const clientSrc = fs.readFileSync(clientConfigPath, "utf-8");
    expect(serverSrc).not.toContain("@sentry/nextjs");
    expect(clientSrc).not.toContain("@sentry/nextjs");
    expect(serverSrc).toContain("Sentry is disabled by default");
    expect(clientSrc).toContain("Sentry is disabled by default");
  });

  test("client error boundaries use the lazy Sentry helper instead of static imports", () => {
    const helperSrc = fs.readFileSync(clientHelperPath, "utf-8");
    const appErrorSrc = fs.readFileSync(appErrorPath, "utf-8");
    const globalErrorSrc = fs.readFileSync(globalErrorPath, "utf-8");
    expect(helperSrc).toContain('process.env.NEXT_PUBLIC_ENABLE_SENTRY === "true"');
    expect(helperSrc).not.toContain("@sentry/nextjs");
    expect(appErrorSrc).toContain("captureClientException");
    expect(globalErrorSrc).toContain("captureClientException");
    expect(appErrorSrc).not.toContain('import * as Sentry from "@sentry/nextjs"');
    expect(globalErrorSrc).not.toContain('import * as Sentry from "@sentry/nextjs"');
  });

  test("production build uses webpack while Node app routes are unstable on turbopack", () => {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    expect(pkg.scripts.build).toContain("next build --webpack");
    expect(pkg.dependencies?.["@sentry/nextjs"]).toBeUndefined();
    expect(pkg.devDependencies?.["@sentry/nextjs"]).toBeUndefined();
  });
});

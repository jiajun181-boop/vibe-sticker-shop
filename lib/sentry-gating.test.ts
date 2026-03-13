import fs from "fs";
import path from "path";

const nextConfigPath = path.resolve(__dirname, "../next.config.ts");
const instrumentationPath = path.resolve(__dirname, "../instrumentation.ts");
const serverConfigPath = path.resolve(__dirname, "../sentry.server.config.ts");
const clientConfigPath = path.resolve(__dirname, "../sentry.client.config.ts");

describe("Sentry opt-in gating", () => {
  test("next config only enables Sentry when ENABLE_SENTRY is true", () => {
    const src = fs.readFileSync(nextConfigPath, "utf-8");
    expect(src).toContain('process.env.ENABLE_SENTRY === "true"');
    expect(src).toContain("withSentryConfig");
  });

  test("instrumentation gates runtime Sentry initialization behind ENABLE_SENTRY", () => {
    const src = fs.readFileSync(instrumentationPath, "utf-8");
    expect(src).toContain('process.env.ENABLE_SENTRY === "true"');
    expect(src).toContain("Sentry.init");
  });

  test("server and client Sentry configs are both opt-in", () => {
    const serverSrc = fs.readFileSync(serverConfigPath, "utf-8");
    const clientSrc = fs.readFileSync(clientConfigPath, "utf-8");
    expect(serverSrc).toContain('process.env.ENABLE_SENTRY === "true"');
    expect(clientSrc).toContain('process.env.ENABLE_SENTRY === "true"');
  });
});

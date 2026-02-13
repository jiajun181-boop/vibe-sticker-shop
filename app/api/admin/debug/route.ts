import { NextResponse } from "next/server";

export async function GET() {
  const hasAdminPw = !!process.env.ADMIN_PASSWORD;
  const pwLength = (process.env.ADMIN_PASSWORD || "").length;
  const hasJwtSecret = !!process.env.ADMIN_JWT_SECRET;
  const nodeEnv = process.env.NODE_ENV;

  return NextResponse.json({
    hasAdminPassword: hasAdminPw,
    adminPasswordLength: pwLength,
    hasJwtSecret,
    nodeEnv,
    timestamp: new Date().toISOString(),
  });
}

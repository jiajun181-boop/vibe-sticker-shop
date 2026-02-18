import { NextResponse } from "next/server";

function resolveCommitSha() {
  return (
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    process.env.NEXT_PUBLIC_GIT_SHA ||
    ""
  );
}

export async function GET() {
  const commitSha = resolveCommitSha();
  const branch =
    process.env.VERCEL_GIT_COMMIT_REF ||
    process.env.GITHUB_REF_NAME ||
    "";

  return NextResponse.json(
    {
      app: "lunarprint",
      commitShort: commitSha ? commitSha.slice(0, 7) : "unknown",
      generatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}


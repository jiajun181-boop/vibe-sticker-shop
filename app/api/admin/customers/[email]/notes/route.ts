import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  const session = await getAdminSession(request);
  if (!session.authenticated) return session.response;

  const { email: rawEmail } = await params;
  const email = decodeURIComponent(rawEmail);

  try {
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      // No user account — return empty notes (customer may only exist via orders)
      return NextResponse.json({ data: [] });
    }

    const notes = await prisma.customerNote.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: notes });
  } catch (err) {
    console.error("[Customer notes GET] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch customer notes" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  const session = await getAdminSession(request);
  if (!session.authenticated) return session.response;

  const { email: rawEmail } = await params;
  const email = decodeURIComponent(rawEmail);

  try {
    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: "Content must be under 5000 characters" },
        { status: 400 }
      );
    }

    // Find or create the user by email
    let user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      // Create a minimal user record so we can attach notes
      user = await prisma.user.create({
        data: { email },
        select: { id: true },
      });
    }

    const authorName = session.user!.name || session.user!.email || "Admin";

    const note = await prisma.customerNote.create({
      data: {
        userId: user.id,
        authorName,
        content: content.trim(),
      },
    });

    return NextResponse.json({ data: note }, { status: 201 });
  } catch (err) {
    console.error("[Customer notes POST] Error:", err);
    return NextResponse.json(
      { error: "Failed to create customer note" },
      { status: 500 }
    );
  }
}

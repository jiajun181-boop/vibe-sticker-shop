import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    // Log for now — integrate with email service (SendGrid, Resend) later
    console.log("[Contact Form]", {
      name,
      email,
      phone: body.phone || "",
      company: body.company || "",
      message,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Contact Form Error]", err);
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}

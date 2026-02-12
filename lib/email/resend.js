import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "La Lunar Printing Inc. <orders@lalunar.com>";

export async function sendEmail({ to, subject, html, template = "generic", orderId = null }) {
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not set — skipping email send");
    return null;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[Email] Resend error:", error);
      await prisma.emailLog.create({
        data: { to, subject, template, status: "failed", error: JSON.stringify(error), orderId },
      });
      return null;
    }

    await prisma.emailLog.create({
      data: { to, subject, template, status: "sent", orderId },
    });

    console.log(`[Email] Sent "${subject}" to ${to}`);
    return data;
  } catch (err) {
    console.error("[Email] Send failed:", err);
    await prisma.emailLog.create({
      data: { to, subject, template, status: "failed", error: String(err), orderId },
    }).catch(() => {});
    return null;
  }
}

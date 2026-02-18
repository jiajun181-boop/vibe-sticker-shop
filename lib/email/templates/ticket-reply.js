import { escapeHtml } from "../escape-html";

export function buildTicketReplyHtml(ticketId, subject, replyBody, authorName) {
  subject = escapeHtml(subject);
  replyBody = escapeHtml(replyBody);
  authorName = escapeHtml(authorName);
  const shortId = escapeHtml(ticketId.slice(0, 8));
  return {
    subject: `Re: Ticket #${shortId} — ${subject}`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f7f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    <div style="background:#111;padding:24px 32px;">
      <h1 style="margin:0;color:#fff;font-size:18px;font-weight:700;">La Lunar Printing</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111;">New Reply on Ticket #${shortId}</h2>
      <p style="margin:0 0 20px;color:#666;font-size:14px;line-height:1.5;">
        ${authorName || "Support"} has replied to your ticket.
      </p>
      <div style="background:#f7f7f8;border-radius:8px;padding:16px;margin-bottom:20px;">
        <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.05em;">Subject</p>
        <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#111;">${subject}</p>
        <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.05em;">Reply</p>
        <p style="margin:0;font-size:14px;color:#333;line-height:1.6;white-space:pre-wrap;">${replyBody}</p>
      </div>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://lunarprint.ca"}/account/support/${ticketId}"
         style="display:inline-block;background:#111;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
        View Ticket
      </a>
    </div>
    <div style="padding:16px 32px;background:#f7f7f8;text-align:center;">
      <p style="margin:0;font-size:12px;color:#999;">La Lunar Printing Inc. &bull; Toronto, ON</p>
    </div>
  </div>
</body>
</html>`,
  };
}

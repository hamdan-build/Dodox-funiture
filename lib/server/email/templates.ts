import { escapeHtml } from "@/lib/server/security/sanitize";
import { formatRwf } from "@/lib/utils";

function wrapEditorialEmail(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:32px 16px;background:#f7f2e8;font-family:Georgia,serif;color:#221e19;">
  <div style="max-width:600px;margin:0 auto;background:#fbf8f1;border:1px solid #ded2be;padding:36px 32px;">
    <p style="margin:0 0 8px;font-family:sans-serif;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#6f6453;">
      DODOX FURNITURE · KIGALI ATELIER
    </p>
    <h1 style="margin:0 0 20px;font-weight:400;font-size:26px;line-height:1.2;color:#221e19;">
      ${escapeHtml(title)}
    </h1>
    <div style="font-family:sans-serif;font-size:14px;line-height:1.7;color:#4c443a;">
      ${bodyHtml}
    </div>
    <hr style="margin:28px 0 16px;border:none;border-top:1px solid #ded2be;" />
    <p style="margin:0;font-family:sans-serif;font-size:11px;color:#6f6453;">
      DODOX Furniture · Kigali, Rwanda · Manual concierge confirmation workflow (no online payment collected).
    </p>
  </div>
</body>
</html>`;
}

export function buildOrderReceivedEmail(params: {
  firstName: string;
  reference: string;
  totalAmount: number;
  trackingUrl: string;
  items: { name: string; quantity: number; unitPrice: number; variantSummary: string }[];
}) {
  const rows = params.items
    .map(
      (item) =>
        `<li><strong>${escapeHtml(item.name)}</strong> (${escapeHtml(item.variantSummary || "Standard")}) × ${item.quantity} — ${escapeHtml(formatRwf(item.unitPrice * item.quantity))}</li>`,
    )
    .join("");

  const subject = `Order Request Received · ${params.reference}`;
  const html = wrapEditorialEmail(
    `Thank you, ${params.firstName}.`,
    `<p>Your DODOX order request has been recorded under reference <strong>${escapeHtml(params.reference)}</strong>.</p>
     <p><strong>No payment has been collected online.</strong> Our Kigali concierge will review piece availability, lead times, and local payment arrangements with you directly.</p>
     <ul style="padding-left:18px;">${rows}</ul>
     <p><strong>Estimated Total:</strong> ${escapeHtml(formatRwf(params.totalAmount))}</p>
     <p><a href="${escapeHtml(params.trackingUrl)}" style="display:inline-block;padding:10px 18px;background:#7e5f3c;color:#f7f2e8;text-decoration:none;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;">Track Your Request</a></p>`,
  );
  const text = `Thank you, ${params.firstName}.\n\nYour DODOX order request (${params.reference}) has been received. Total: ${formatRwf(params.totalAmount)}. No payment has been taken online.\nTrack status: ${params.trackingUrl}`;
  return { subject, html, text };
}

export function buildOrderStatusEmail(params: {
  firstName: string;
  reference: string;
  newStatusLabel: string;
  note?: string | null;
  trackingUrl: string;
}) {
  const subject = `Order Update (${params.reference}) · ${params.newStatusLabel}`;
  const noteBlock = params.note
    ? `<p style="padding:12px;background:#f1e9db;border-left:2px solid #7e5f3c;">${escapeHtml(params.note)}</p>`
    : "";
  const html = wrapEditorialEmail(
    `Your order is now: ${params.newStatusLabel}`,
    `<p>Hello ${escapeHtml(params.firstName)},</p>
     <p>Your order request <strong>${escapeHtml(params.reference)}</strong> has been updated to <strong>${escapeHtml(params.newStatusLabel)}</strong>.</p>
     ${noteBlock}
     <p><a href="${escapeHtml(params.trackingUrl)}" style="color:#7e5f3c;">View live order timeline</a></p>`,
  );
  const text = `Hello ${params.firstName},\nOrder ${params.reference} is now: ${params.newStatusLabel}.${params.note ? `\nNote: ${params.note}` : ""}\nTrack: ${params.trackingUrl}`;
  return { subject, html, text };
}

export function buildAtelierEnquiryEmail(params: {
  name: string;
  reference: string;
  furnitureType: string;
}) {
  const subject = `Atelier Commission Brief Received · ${params.reference}`;
  const html = wrapEditorialEmail(
    "We have your commission brief.",
    `<p>Hello ${escapeHtml(params.name)},</p>
     <p>Your bespoke commission request for <strong>${escapeHtml(params.furnitureType)}</strong> is logged under reference <strong>${escapeHtml(params.reference)}</strong>. A DODOX designer will review your dimensions and finish preferences shortly.</p>`,
  );
  const text = `Hello ${params.name}, your Atelier brief (${params.reference}) for ${params.furnitureType} has been received.`;
  return { subject, html, text };
}

export function buildContactAcknowledgementEmail(params: {
  name: string;
  reference: string;
  subjectLine: string;
}) {
  const subject = `Message Received · ${params.reference}`;
  const html = wrapEditorialEmail(
    "Thank you for writing to the atelier.",
    `<p>Hello ${escapeHtml(params.name)},</p>
     <p>We received your enquiry regarding <strong>${escapeHtml(params.subjectLine)}</strong> (Reference: <strong>${escapeHtml(params.reference)}</strong>). Our concierge responds Monday through Saturday.</p>`,
  );
  const text = `Hello ${params.name}, we received your message (${params.reference}) regarding ${params.subjectLine}.`;
  return { subject, html, text };
}

export function buildNewsletterWelcomeEmail(params: {
  unsubscribeUrl: string;
}) {
  const subject = "Welcome to the DODOX Atelier List";
  const html = wrapEditorialEmail(
    "You are on the atelier list.",
    `<p>Thank you for subscribing to private seasonal previews and editorial notes from DODOX Furniture.</p>
     <p style="font-size:12px;color:#6f6453;">You may <a href="${escapeHtml(params.unsubscribeUrl)}" style="color:#7e5f3c;">unsubscribe at any time</a>.</p>`,
  );
  const text = `Welcome to the DODOX Atelier List.\nUnsubscribe anytime: ${params.unsubscribeUrl}`;
  return { subject, html, text };
}

export function buildAdminAlertEmail(params: {
  eventTitle: string;
  summary: string;
  adminUrl: string;
}) {
  const subject = `[DODOX Admin] ${params.eventTitle}`;
  const html = wrapEditorialEmail(
    params.eventTitle,
    `<p>${escapeHtml(params.summary)}</p>
     <p><a href="${escapeHtml(params.adminUrl)}" style="color:#7e5f3c;">Open in DODOX Admin Portal</a></p>`,
  );
  const text = `${params.eventTitle}\n${params.summary}\nAdmin: ${params.adminUrl}`;
  return { subject, html, text };
}

export function buildPasswordResetEmail(params: {
  firstName: string;
  resetUrl: string;
}) {
  const subject = "Reset your DODOX Admin password";
  const html = wrapEditorialEmail(
    "Password Reset Request",
    `<p>Hello ${escapeHtml(params.firstName)},</p>
     <p>A password reset was requested for your DODOX Admin account. This link expires in 30 minutes:</p>
     <p><a href="${escapeHtml(params.resetUrl)}" style="display:inline-block;padding:10px 18px;background:#7e5f3c;color:#f7f2e8;text-decoration:none;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;">Reset Password</a></p>
     <p style="font-size:12px;color:#6f6453;">If you did not request this, you can safely ignore this message.</p>`,
  );
  const text = `Hello ${params.firstName},\nReset your DODOX Admin password (valid 30 minutes): ${params.resetUrl}`;
  return { subject, html, text };
}

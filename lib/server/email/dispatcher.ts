import { getCloudflareBindings, getRuntimeEnv } from "@/lib/server/env";

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

async function sendViaResendWithRetry(
  apiKey: string,
  from: string,
  msg: EmailMessage,
): Promise<boolean> {
  const recipients = Array.isArray(msg.to) ? msg.to : [msg.to];

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: recipients,
          subject: msg.subject,
          html: msg.html,
          text: msg.text,
          ...(msg.replyTo ? { reply_to: msg.replyTo } : {}),
        }),
      });

      if (response.ok) {
        return true;
      }

      const errBody = await response.text().catch(() => "");
      console.warn(
        `[DODOX Email] Resend attempt ${attempt} returned ${response.status}: ${errBody.slice(0, 200)}`,
      );
    } catch (err) {
      console.warn(`[DODOX Email] Resend attempt ${attempt} network error:`, err);
    }
  }
  return false;
}

/**
 * Dispatches transactional email via Cloudflare Queues (when bound) or Resend HTTP API.
 * Email failures NEVER throw or roll back committed orders/enquiries.
 */
export async function dispatchEmailSafe(msg: EmailMessage): Promise<void> {
  try {
    const env = await getRuntimeEnv();
    const { ctx } = await getCloudflareBindings();

    if (env.NOTIFICATION_QUEUE) {
      await env.NOTIFICATION_QUEUE.send({
        type: "email",
        payload: msg,
        queuedAt: new Date().toISOString(),
      });
      return;
    }

    const apiKey = env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      if (env.APP_ENV !== "production") {
        console.info(
          `[DODOX Email Dev Stub] To=${Array.isArray(msg.to) ? msg.to.join(",") : msg.to} | Subject="${msg.subject}"`,
        );
      }
      return;
    }

    const task = sendViaResendWithRetry(apiKey, env.EMAIL_FROM, msg).then(
      () => undefined,
    );
    if (ctx?.waitUntil) {
      ctx.waitUntil(task);
    } else {
      await task;
    }
  } catch (err) {
    console.error("[DODOX Email Dispatch Error]", err);
  }
}

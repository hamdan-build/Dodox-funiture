import { getRuntimeEnv } from "@/lib/server/env";
import { ValidationError } from "@/lib/server/errors";
import { getClientIp } from "@/lib/server/http";

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
}

/**
 * Verifies a Cloudflare Turnstile token when `TURNSTILE_SECRET_KEY` is configured.
 * When `TURNSTILE_SECRET_KEY` is empty (local development / unconfigured staging),
 * verification passes cleanly without blocking public forms.
 */
export async function verifyTurnstileIfConfigured(
  request: Request,
  token?: string | null,
): Promise<void> {
  const env = await getRuntimeEnv();
  const secret = env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    return;
  }

  if (!token || !token.trim()) {
    throw new ValidationError(
      "Please complete the security verification before submitting.",
    );
  }

  const formData = new URLSearchParams();
  formData.set("secret", secret);
  formData.set("response", token.trim());
  const ip = getClientIp(request);
  if (ip && ip !== "unknown") {
    formData.set("remoteip", ip);
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    },
  );

  if (!response.ok) {
    throw new ValidationError(
      "Could not verify bot protection at this moment. Please try again.",
    );
  }

  const result = (await response.json()) as TurnstileVerifyResponse;
  if (!result.success) {
    throw new ValidationError(
      "Security verification expired or failed. Please refresh and try again.",
    );
  }
}

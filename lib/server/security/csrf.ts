import { ForbiddenError } from "@/lib/server/errors";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Verifies same-origin / Referer for cookie-authenticated mutations to mitigate CSRF,
 * while cleanly supporting Cloudflare Workers, local development, and *.e2b.app preview hosts.
 */
export function verifyCsrfRequest(request: Request): void {
  if (!MUTATING_METHODS.has(request.method.toUpperCase())) {
    return;
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host =
    request.headers.get("x-forwarded-host") || request.headers.get("host");

  // Non-browser API test clients without Origin/Referer must pass X-Requested-With
  if (!origin && !referer) {
    const requestedWith = request.headers.get("x-requested-with");
    if (requestedWith === "dodox-admin" || requestedWith === "XMLHttpRequest") {
      return;
    }
    // Allow internal server-to-server / test requests when no host mismatch exists
    if (!host) return;
    throw new ForbiddenError(
      "Cross-site request protection blocked a request missing origin headers.",
    );
  }

  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host) return;
    } catch {
      throw new ForbiddenError("Invalid request origin header.");
    }
    throw new ForbiddenError("Cross-origin state-changing request rejected.");
  }

  if (referer && host) {
    try {
      const refererHost = new URL(referer).host;
      if (refererHost === host) return;
    } catch {
      throw new ForbiddenError("Invalid request referer header.");
    }
    throw new ForbiddenError("Cross-origin state-changing request rejected.");
  }
}

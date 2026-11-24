"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Lock, ShieldCheck } from "lucide-react";
import { apiRequest } from "@/components/admin/api-client";
import { adminInputClass, adminPrimaryBtn } from "@/components/admin/ui";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bootstrapAvailable, setBootstrapAvailable] = useState(false);

  useEffect(() => {
    apiRequest<{ admin: unknown; bootstrapAvailable: boolean }>(
      "/api/admin/auth/me",
    )
      .then((res) => {
        if (res.admin) {
          router.replace("/admin");
        } else if (res.bootstrapAvailable) {
          setBootstrapAvailable(true);
        }
      })
      .catch(() => undefined);
  }, [router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await apiRequest("/api/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not sign in. Please try again.",
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4efe5] px-4 py-12">
      <div className="w-full max-w-md border border-line bg-parchment p-7 sm:p-9">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-bronze">
              DODOX Furniture
            </p>
            <h1 className="mt-1 font-display text-3xl text-ink">
              Atelier Administration
            </h1>
          </div>
          <span className="flex h-10 w-10 items-center justify-center border border-line bg-ivory text-bronze">
            <Lock size={16} />
          </span>
        </div>

        <p className="mt-2 text-[12px] leading-relaxed text-muted">
          Authorized staff access only. Sessions are audited and rate-limited.
        </p>

        {bootstrapAvailable ? (
          <div className="mt-4 border border-bronze/40 bg-peach/50 p-3.5 text-[11.5px] text-ink">
            <p className="flex items-center gap-1.5 font-medium">
              <ShieldCheck size={14} className="text-bronze" />
              First-time setup available
            </p>
            <p className="mt-1 text-ink-soft">
              No staff accounts exist in D1 yet.{" "}
              <Link
                href="/admin/bootstrap"
                className="font-medium text-bronze underline"
              >
                Bootstrap initial Super Admin
              </Link>{" "}
              using your server bootstrap token.
            </p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="admin-email"
              className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.16em] text-ink/70"
            >
              Staff Email
            </label>
            <input
              id="admin-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@dodox.rw"
              className={adminInputClass}
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="admin-password"
                className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink/70"
              >
                Password
              </label>
              <Link
                href="/admin/forgot-password"
                className="text-[10px] uppercase tracking-[0.12em] text-bronze hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="admin-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={adminInputClass}
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="border border-[#8b3528]/30 bg-[#f5deda] px-3 py-2 text-[11.5px] text-[#8b3528]"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className={`${adminPrimaryBtn} h-11 w-full`}
          >
            {submitting ? "Signing in…" : "Sign in to Admin"}
            <ArrowRight size={13} />
          </button>
        </form>

        <div className="mt-6 border-t border-line/70 pt-4 text-center">
          <Link
            href="/"
            className="text-[10px] uppercase tracking-[0.16em] text-muted hover:text-bronze"
          >
            ← Return to public storefront
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { apiRequest } from "@/components/admin/api-client";
import { adminInputClass, adminPrimaryBtn } from "@/components/admin/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiRequest("/api/admin/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4efe5] px-4 py-12">
      <div className="w-full max-w-md border border-line bg-parchment p-7 sm:p-9">
        <p className="text-[10px] uppercase tracking-[0.24em] text-bronze">
          Account Recovery
        </p>
        <h1 className="mt-1 font-display text-3xl text-ink">
          Reset Staff Password
        </h1>

        {submitted ? (
          <div className="mt-5 space-y-4">
            <div className="flex items-start gap-3 border border-line bg-ivory p-4">
              <MailCheck size={18} className="mt-0.5 shrink-0 text-bronze" />
              <p className="text-[12px] leading-relaxed text-ink-soft">
                If an active staff account exists for <strong>{email}</strong>, a
                30-minute reset link has been dispatched.
              </p>
            </div>
            <Link href="/admin/login" className={`${adminPrimaryBtn} w-full`}>
              Return to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <p className="text-[12px] leading-relaxed text-muted">
              Enter your DODOX staff email address to receive a one-time password
              reset link.
            </p>
            <div>
              <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.16em] text-ink/70">
                Staff Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={adminInputClass}
              />
            </div>
            {error ? (
              <p className="border border-[#8b3528]/30 bg-[#f5deda] px-3 py-2 text-[11.5px] text-[#8b3528]">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className={`${adminPrimaryBtn} w-full`}
            >
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
            <div className="text-center">
              <Link
                href="/admin/login"
                className="text-[10px] uppercase tracking-[0.14em] text-muted hover:text-bronze"
              >
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

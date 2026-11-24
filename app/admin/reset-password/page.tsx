"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Check } from "lucide-react";
import { apiRequest } from "@/components/admin/api-client";
import { adminInputClass, adminPrimaryBtn } from "@/components/admin/ui";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiRequest("/api/admin/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="mt-5 space-y-4">
        <div className="flex items-start gap-3 border border-line bg-ivory p-4">
          <Check size={18} className="mt-0.5 text-bronze" />
          <p className="text-[12px] leading-relaxed text-ink-soft">
            Your password has been updated and prior sessions have been revoked.
          </p>
        </div>
        <Link href="/admin/login" className={`${adminPrimaryBtn} w-full`}>
          Sign In with New Password
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <div>
        <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.16em] text-ink/70">
          New Password (min 12 characters)
        </label>
        <input
          type="password"
          required
          minLength={12}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
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
        disabled={loading || !token}
        className={`${adminPrimaryBtn} w-full`}
      >
        {loading ? "Updating…" : "Update Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4efe5] px-4 py-12">
      <div className="w-full max-w-md border border-line bg-parchment p-7 sm:p-9">
        <p className="text-[10px] uppercase tracking-[0.24em] text-bronze">
          Security Update
        </p>
        <h1 className="mt-1 font-display text-3xl text-ink">
          Choose New Password
        </h1>
        <Suspense fallback={<p className="mt-4 text-[12px] text-muted">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { KeyRound, ShieldAlert } from "lucide-react";
import { apiRequest } from "@/components/admin/api-client";
import { adminInputClass, adminPrimaryBtn } from "@/components/admin/ui";

export default function AdminBootstrapPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [available, setAvailable] = useState(false);

  const [bootstrapToken, setBootstrapToken] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiRequest<{ admin: unknown; bootstrapAvailable: boolean }>(
      "/api/admin/auth/me",
    )
      .then((res) => {
        if (res.admin) {
          router.replace("/admin");
          return;
        }
        setAvailable(res.bootstrapAvailable);
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await apiRequest("/api/admin/auth/bootstrap", {
        method: "POST",
        body: JSON.stringify({
          bootstrapToken,
          firstName,
          lastName,
          email,
          password,
        }),
      });
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Bootstrap failed. Verify token and password requirements.",
      );
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4efe5] p-6 text-[12px] text-muted">
        Checking bootstrap status…
      </div>
    );
  }

  if (!available) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4efe5] px-4 py-12">
        <div className="w-full max-w-md border border-line bg-parchment p-8 text-center">
          <ShieldAlert size={24} className="mx-auto text-bronze" />
          <h1 className="mt-4 font-display text-2xl text-ink">
            Bootstrap Permanently Locked
          </h1>
          <p className="mt-2 text-[12px] leading-relaxed text-muted">
            An administrator account already exists in D1. Subsequent staff
            accounts must be created from Staff Management by an authorized Super Admin.
          </p>
          <Link
            href="/admin/login"
            className={`${adminPrimaryBtn} mt-6 w-full`}
          >
            Go to Staff Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4efe5] px-4 py-12">
      <div className="w-full max-w-lg border border-line bg-parchment p-7 sm:p-9">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-bronze">
              One-Time Provisioning
            </p>
            <h1 className="mt-1 font-display text-3xl text-ink">
              Initialize Super Admin
            </h1>
          </div>
          <span className="flex h-10 w-10 items-center justify-center border border-line bg-ivory text-bronze">
            <KeyRound size={16} />
          </span>
        </div>

        <p className="mt-2 text-[12px] leading-relaxed text-muted">
          Supply the server&apos;s <code className="text-ink">ADMIN_BOOTSTRAP_TOKEN</code> secret
          to create the initial Super Admin account. Once created, this route locks permanently.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.16em] text-ink/70">
              Server Bootstrap Token
            </label>
            <input
              type="password"
              required
              value={bootstrapToken}
              onChange={(e) => setBootstrapToken(e.target.value)}
              placeholder="Paste ADMIN_BOOTSTRAP_TOKEN"
              className={adminInputClass}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.16em] text-ink/70">
                First Name
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={adminInputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.16em] text-ink/70">
                Last Name
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={adminInputClass}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.16em] text-ink/70">
              Administrator Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="director@dodox.rw"
              className={adminInputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.16em] text-ink/70">
              Strong Password (min 12 chars, upper + lower + number/symbol)
            </label>
            <input
              type="password"
              required
              minLength={12}
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
            className={`${adminPrimaryBtn} mt-2 h-11 w-full`}
          >
            {submitting ? "Provisioning Super Admin…" : "Create Super Admin & Sign In"}
          </button>
        </form>

        <div className="mt-5 text-center">
          <Link
            href="/admin/login"
            className="text-[10px] uppercase tracking-[0.14em] text-muted hover:text-bronze"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

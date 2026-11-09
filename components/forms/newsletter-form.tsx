"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check } from "lucide-react";
import { TextField } from "@/components/forms/field";
import { newsletterSchema, type NewsletterInput } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui";

export function NewsletterForm({
  variant = "footer",
  className,
}: {
  variant?: "footer" | "panel";
  className?: string;
}) {
  const [subscribed, setSubscribed] = useState(false);
  const pushToast = useUiStore((state) => state.pushToast);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<NewsletterInput>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: NewsletterInput) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSubscribed(true);
    reset();
    pushToast({
      title: "You're on the atelier list",
      description: `Sample subscription recorded for ${values.email}. No mailing list is connected in this demo.`,
      variant: "success",
    });
  };

  if (subscribed) {
    return (
      <div
        className={cn(
          "flex items-start gap-3 border border-bronze/30 bg-parchment px-4 py-3.5",
          variant === "panel" && "bg-ivory/70",
          className,
        )}
        role="status"
      >
        <Check size={15} strokeWidth={1.6} className="mt-0.5 text-bronze" />
        <div>
          <p className="text-[12px] font-medium text-ink">You&apos;re on the list.</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            This is a demonstration form — no emails will be sent.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("w-full", className)}
      noValidate
    >
      <div className={cn("flex", variant === "panel" ? "flex-col gap-3 sm:flex-row" : "flex-col gap-2 sm:flex-row")}>
        <div className="flex-1">
          {variant === "panel" ? (
            <TextField
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register("email")}
            />
          ) : (
            <label className="sr-only" htmlFor="newsletter-email">
              Email address
            </label>
          )}
          {variant === "footer" ? (
            <>
              <input
                id="newsletter-email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email address"
                className="h-11 w-full border border-line bg-parchment px-3 text-[12px] text-ink placeholder:text-muted/60 focus:border-bronze focus:outline-none"
                aria-invalid={Boolean(errors.email)}
                {...register("email")}
              />
              {errors.email ? (
                <p className="mt-1.5 text-[11px] text-[#9a4a32]" role="alert">
                  {errors.email.message}
                </p>
              ) : null}
            </>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "inline-flex h-11 shrink-0 items-center justify-center gap-2 bg-bronze px-5 text-[10px] font-medium uppercase tracking-[0.18em] text-ivory transition-colors hover:bg-bronze-dark disabled:opacity-60",
            variant === "footer" && "w-full sm:w-auto",
          )}
        >
          {isSubmitting ? "Joining…" : "Subscribe"}
          <ArrowRight size={12} strokeWidth={1.5} />
        </button>
      </div>
      <p
        className={cn(
          "mt-2 text-[10px] leading-relaxed",
          variant === "panel" ? "text-ink-soft/70" : "text-muted",
        )}
      >
        Private invitations only. Demonstration form — not connected to a mailing
        list.
      </p>
    </form>
  );
}

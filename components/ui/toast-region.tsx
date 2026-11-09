"use client";

import { useEffect } from "react";
import { Check, CircleAlert, Info, X } from "lucide-react";
import { useUiStore, type Toast } from "@/store/ui";
import { cn } from "@/lib/utils";

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useUiStore((state) => state.dismissToast);

  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(toast.id), 4800);
    return () => window.clearTimeout(timer);
  }, [toast.id, dismiss]);

  const Icon =
    toast.variant === "success"
      ? Check
      : toast.variant === "error"
        ? CircleAlert
        : Info;

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 border bg-parchment p-4 shadow-[0_18px_50px_-24px_rgba(34,30,25,0.5)] animate-fade-in",
        toast.variant === "error" ? "border-[#c08a73]" : "border-line",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
          toast.variant === "error"
            ? "bg-[#f3ddd3] text-[#8f4a33]"
            : "bg-shell text-bronze",
        )}
      >
        <Icon size={13} strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-ink">{toast.title}</p>
        {toast.description ? (
          <p className="mt-1 text-[12px] leading-relaxed text-muted">
            {toast.description}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        className="text-muted transition-colors hover:text-ink"
        aria-label="Dismiss notification"
      >
        <X size={14} strokeWidth={1.5} />
      </button>
    </div>
  );
}

export function ToastRegion() {
  const toasts = useUiStore((state) => state.toasts);

  return (
    <div
      className="pointer-events-none fixed inset-x-4 bottom-24 z-[80] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

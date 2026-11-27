"use client";

import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  // Orders
  received: "bg-peach text-peach-ink border-peach-ink/20",
  under_review: "bg-[#efe6d2] text-[#785c2a] border-[#785c2a]/20",
  confirmed: "bg-[#dfeadf] text-[#2e5732] border-[#2e5732]/20",
  in_production: "bg-[#dfe7f0] text-[#2b4c6f] border-[#2b4c6f]/20",
  ready: "bg-[#d8ece6] text-[#21594b] border-[#21594b]/20",
  out_for_delivery: "bg-[#e3e0f3] text-[#453a7a] border-[#453a7a]/20",
  delivered: "bg-[#d7ead9] text-[#235328] border-[#235328]/25",
  cancelled: "bg-shell text-muted border-line",
  rejected: "bg-[#f5deda] text-[#8b3528] border-[#8b3528]/20",

  // Products & Content
  published: "bg-[#dfeadf] text-[#2e5732] border-[#2e5732]/20",
  active: "bg-[#dfeadf] text-[#2e5732] border-[#2e5732]/20",
  draft: "bg-shell text-ink-soft border-line",
  archived: "bg-shell text-muted border-line",
  inactive: "bg-shell text-muted border-line",
  unsubscribed: "bg-shell text-muted border-line",

  // Availability
  "in-stock": "bg-[#dfeadf] text-[#2e5732] border-[#2e5732]/20",
  "made-to-order": "bg-peach text-peach-ink border-peach-ink/20",
  "pre-order": "bg-[#dfe7f0] text-[#2b4c6f] border-[#2b4c6f]/20",
  "out-of-stock": "bg-[#f5deda] text-[#8b3528] border-[#8b3528]/20",

  // Enquiries & POs
  new: "bg-peach text-peach-ink border-peach-ink/20",
  open: "bg-[#efe6d2] text-[#785c2a] border-[#785c2a]/20",
  reviewing: "bg-[#efe6d2] text-[#785c2a] border-[#785c2a]/20",
  quotation_prepared: "bg-[#dfe7f0] text-[#2b4c6f] border-[#2b4c6f]/20",
  awaiting_customer: "bg-[#e3e0f3] text-[#453a7a] border-[#453a7a]/20",
  accepted: "bg-[#dfeadf] text-[#2e5732] border-[#2e5732]/20",
  completed: "bg-[#d7ead9] text-[#235328] border-[#235328]/25",
  replied: "bg-[#d7ead9] text-[#235328] border-[#235328]/25",
  ordered: "bg-[#dfe7f0] text-[#2b4c6f] border-[#2b4c6f]/20",
  partially_received: "bg-[#efe6d2] text-[#785c2a] border-[#785c2a]/20",
  unpaid_request: "bg-shell text-ink-soft border-line",
};

export function formatStatusLabel(status: string): string {
  return status.replace(/[_-]+/g, " ");
}

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  const tone =
    STATUS_STYLES[status] ?? "bg-shell text-ink-soft border-line";
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-0.5 text-[9.5px] font-medium uppercase tracking-[0.12em]",
        tone,
        className,
      )}
    >
      {label ?? formatStatusLabel(status)}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  subtext,
  icon,
  accent = "default",
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  accent?: "default" | "bronze" | "forest" | "warning";
}) {
  return (
    <div
      className={cn(
        "border bg-parchment p-4 sm:p-5",
        accent === "bronze"
          ? "border-bronze/40"
          : accent === "warning"
            ? "border-[#b66a3c]/40"
            : "border-line/80",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
          {label}
        </p>
        {icon ? <span className="text-bronze">{icon}</span> : null}
      </div>
      <p className="mt-2.5 font-display text-[28px] leading-none tabular-nums text-ink sm:text-[32px]">
        {value}
      </p>
      {subtext ? (
        <p className="mt-2 text-[11px] leading-snug text-muted">{subtext}</p>
      ) : null}
    </div>
  );
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-line/80 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-bronze">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 font-display text-[28px] leading-tight text-ink sm:text-[34px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export function AdminEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-line bg-parchment/70 px-6 py-12 text-center">
      <p className="font-display text-2xl text-ink">{title}</p>
      <p className="mt-2 max-w-md text-[12px] leading-relaxed text-muted">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function AdminModal({
  open,
  title,
  subtitle,
  onClose,
  children,
  maxWidth = "max-w-xl",
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/55 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={cn(
          "max-h-[90vh] w-full overflow-y-auto border border-line bg-parchment shadow-2xl",
          maxWidth,
        )}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-parchment px-5 py-4">
          <div>
            <h2 className="font-display text-2xl text-ink">{title}</h2>
            {subtitle ? (
              <p className="mt-0.5 text-[11.5px] text-muted">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center border border-line bg-ivory text-muted transition-colors duration-200 hover:border-bronze hover:bg-shell hover:text-ink active:bg-sand active:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze"
            aria-label="Close dialog"
          >
            <X size={15} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <AdminModal open={open} title={title} onClose={onCancel} maxWidth="max-w-md">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-line bg-ivory text-bronze">
          <AlertTriangle size={16} />
        </span>
        <p className="text-[12.5px] leading-relaxed text-ink-soft">
          {description}
        </p>
      </div>
      <div className="mt-6 flex justify-end gap-2 border-t border-line/70 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="inline-flex h-9 items-center justify-center border border-line bg-ivory px-4 text-[10px] font-medium uppercase tracking-[0.14em] text-ink transition-colors duration-200 hover:border-bronze hover:bg-shell hover:text-ink active:bg-sand active:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze disabled:pointer-events-none disabled:opacity-55"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={cn(
            "inline-flex h-9 items-center justify-center px-4 text-[10px] font-medium uppercase tracking-[0.14em] text-ivory transition-colors duration-200 hover:text-ivory active:text-ivory focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-60",
            destructive
              ? "bg-[#8b3528] hover:bg-[#70291e] active:bg-[#5e2118] focus-visible:outline-[#8b3528]"
              : "bg-bronze hover:bg-bronze-dark active:bg-ink focus-visible:outline-bronze",
          )}
        >
          {loading ? "Processing…" : confirmLabel}
        </button>
      </div>
    </AdminModal>
  );
}

export const adminInputClass =
  "h-10 w-full border border-line bg-ivory px-3 text-[12.5px] text-ink placeholder:text-muted/60 transition-colors duration-150 hover:border-taupe focus:border-bronze focus:bg-parchment focus:outline-none";

export const adminSelectClass =
  "h-10 w-full border border-line bg-ivory px-3 text-[12.5px] text-ink transition-colors duration-150 hover:border-taupe focus:border-bronze focus:bg-parchment focus:outline-none";

export const adminTextareaClass =
  "w-full border border-line bg-ivory p-3 text-[12.5px] leading-relaxed text-ink placeholder:text-muted/60 transition-colors duration-150 hover:border-taupe focus:border-bronze focus:bg-parchment focus:outline-none";

export const adminSearchInputClass =
  "h-9 w-full border border-line bg-parchment pl-9 pr-3 text-[12px] text-ink placeholder:text-muted/65 transition-colors duration-150 hover:border-taupe focus:border-bronze focus:bg-ivory focus:outline-none";

export const adminPrimaryBtn =
  "inline-flex h-9 items-center justify-center gap-1.5 bg-bronze px-4 text-[10.5px] font-medium uppercase tracking-[0.15em] text-ivory transition-colors duration-200 hover:bg-bronze-dark hover:text-ivory active:bg-ink active:text-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze disabled:pointer-events-none disabled:opacity-55";

export const adminDarkBtn =
  "inline-flex h-9 items-center justify-center gap-1.5 bg-ink px-4 text-[10.5px] font-medium uppercase tracking-[0.15em] text-ivory transition-colors duration-200 hover:bg-bronze hover:text-ivory active:bg-bronze-dark active:text-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze disabled:pointer-events-none disabled:opacity-55";

export const adminSecondaryBtn =
  "inline-flex h-9 items-center justify-center gap-1.5 border border-line bg-parchment px-3.5 text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink transition-colors duration-200 hover:border-bronze hover:bg-shell hover:text-ink active:bg-sand active:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze disabled:pointer-events-none disabled:opacity-55";

export const adminCompactBtn =
  "inline-flex h-7 items-center justify-center gap-1 border border-line bg-ivory px-2.5 text-[10px] font-medium uppercase tracking-[0.13em] text-ink transition-colors duration-200 hover:border-bronze hover:bg-shell hover:text-ink active:bg-sand active:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze disabled:pointer-events-none disabled:opacity-50";

export const adminCompactDarkBtn =
  "inline-flex h-7 items-center justify-center gap-1 bg-ink px-2.5 text-[10px] font-medium uppercase tracking-[0.13em] text-ivory transition-colors duration-200 hover:bg-bronze hover:text-ivory active:bg-bronze-dark active:text-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze disabled:pointer-events-none disabled:opacity-50";

export const adminIconBtn =
  "inline-flex h-7 w-7 items-center justify-center border border-line/85 bg-ivory text-muted transition-colors duration-200 hover:border-bronze hover:bg-shell hover:text-ink active:bg-sand active:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze disabled:pointer-events-none disabled:opacity-40";

export const adminDangerIconBtn =
  "inline-flex h-7 w-7 items-center justify-center border border-line/85 bg-ivory text-muted transition-colors duration-200 hover:border-[#8b3528]/50 hover:bg-[#f5deda]/70 hover:text-[#8b3528] active:bg-[#f5deda] active:text-[#8b3528] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8b3528] disabled:pointer-events-none disabled:opacity-40";

export function adminTabClass(active: boolean): string {
  return cn(
    "inline-flex h-8 items-center justify-center gap-1.5 border px-3.5 text-[10.5px] font-medium uppercase tracking-[0.14em] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze",
    active
      ? "border-ink bg-ink text-ivory hover:border-bronze-dark hover:bg-bronze-dark hover:text-ivory active:bg-ink active:text-ivory"
      : "border-line bg-parchment text-ink-soft hover:border-bronze/60 hover:bg-shell hover:text-ink active:bg-sand active:text-ink",
  );
}

export function adminFilterPillClass(active: boolean): string {
  return cn(
    "inline-flex h-8 items-center justify-center border px-3 text-[10px] font-medium uppercase tracking-[0.13em] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze",
    active
      ? "border-bronze bg-bronze text-ivory hover:border-bronze-dark hover:bg-bronze-dark hover:text-ivory active:bg-ink active:text-ivory"
      : "border-line bg-parchment text-muted hover:border-bronze/60 hover:bg-shell hover:text-ink active:bg-sand active:text-ink",
  );
}

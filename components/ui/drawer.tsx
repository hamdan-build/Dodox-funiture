"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { useDialog } from "@/hooks/use-dialog";
import { useLockBodyScroll } from "@/hooks/use-lock-body-scroll";
import { cn } from "@/lib/utils";

export function Drawer({
  open,
  onClose,
  title,
  side = "right",
  children,
  footer,
  widthClass = "max-w-md",
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: "left" | "right" | "bottom";
  children: ReactNode;
  footer?: ReactNode;
  widthClass?: string;
  labelledBy?: string;
}) {
  const panelRef = useDialog(open, onClose);
  useLockBodyScroll(open);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]" role="presentation">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-ink/45 backdrop-blur-[2px] animate-fade-in"
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : title}
        aria-labelledby={labelledBy}
        className={cn(
          "absolute flex flex-col bg-ivory shadow-[0_0_80px_rgba(20,16,12,0.35)]",
          side === "bottom"
            ? "inset-x-0 bottom-0 max-h-[88vh] w-full animate-fade-up"
            : side === "left"
              ? "inset-y-0 left-0 w-[88%] animate-slide-in-left"
              : "inset-y-0 right-0 w-[92%] animate-slide-in-right",
          side !== "bottom" && widthClass,
        )}
      >
        <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <h2
            id={labelledBy}
            className="font-display text-xl text-ink sm:text-2xl"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink transition-colors hover:bg-shell"
            aria-label={`Close ${title}`}
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer ? (
          <div className="border-t border-line bg-parchment px-5 py-4 sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

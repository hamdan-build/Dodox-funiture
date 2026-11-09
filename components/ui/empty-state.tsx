import Link from "next/link";
import type { ReactNode } from "react";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  actionHref,
  secondary,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: string;
  actionHref?: string;
  secondary?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center border border-line/70 bg-parchment px-6 py-16 text-center sm:py-20",
        className,
      )}
    >
      {icon ? (
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-line text-bronze">
          {icon}
        </div>
      ) : null}
      <h2 className="font-display text-2xl text-ink sm:text-3xl">{title}</h2>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-muted">
        {description}
      </p>
      {action && actionHref ? (
        <Link href={actionHref} className={buttonStyles({ className: "mt-7" })}>
          {action}
        </Link>
      ) : null}
      {secondary ? <div className="mt-4">{secondary}</div> : null}
    </div>
  );
}

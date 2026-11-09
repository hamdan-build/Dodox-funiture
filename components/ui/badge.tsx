import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "peach",
  className,
}: {
  children: ReactNode;
  tone?: "peach" | "dark" | "sand" | "outline" | "bronze";
  className?: string;
}) {
  const tones = {
    peach: "bg-peach text-peach-ink",
    dark: "bg-ink text-ivory",
    sand: "bg-sand/70 text-ink",
    outline: "border border-line bg-parchment/80 text-ink/75",
    bronze: "bg-bronze text-ivory",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.16em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
